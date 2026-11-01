"""
CivicLens Gemini Client Wrapper
Uses the official Google Gen AI Python SDK (google-genai) with:
- Configurable model from settings
- Request timeouts
- Bounded retries with exponential backoff
- Pydantic response validation
- Audit logging into AgentOutput table
- Graceful fallbacks when offline or on failure
"""
import os
import time
import json
import hashlib
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ValidationError
from django.conf import settings
from google import genai
from google.genai import types

# ==============================================================================
# Pydantic Schemas for Strict Output Validation
# ==============================================================================
class ListenerOutputSchema(BaseModel):
    normalizedTitle: str = Field(..., max_length=120)
    normalizedDescription: str
    category: str
    keywords: List[str] = Field(default_factory=list)
    summary: str = Field(..., max_length=512)
    confidenceScore: float = Field(default=0.85, ge=0.0, le=1.0)
    sentiment: str = Field(default="neutral")
    hazardType: Optional[str] = None

class RecurrenceOutputSchema(BaseModel):
    action: str = Field(..., pattern=r'^(match|new|review)$')
    matchedIssueId: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    similarityScore: float = Field(default=0.5, ge=0.0, le=1.0)
    reasoning: str

class SeverityOutputSchema(BaseModel):
    severityLevel: str = Field(default="MEDIUM", pattern=r'^(LOW|MEDIUM|HIGH|CRITICAL)$')
    publicSafetyRisk: int = Field(default=5, ge=1, le=10)
    infrastructureDamageRisk: int = Field(default=5, ge=1, le=10)
    vulnerablePopulationImpact: bool = False
    economicOrTrafficDisruption: int = Field(default=5, ge=1, le=10)
    environmentalHazard: bool = False
    severityScore: int = Field(default=50, ge=1, le=100)
    keyRisks: List[str] = Field(default_factory=list)
    justification: str

class PriorityOutputSchema(BaseModel):
    priorityTier: str = Field(default="P3_MEDIUM", pattern=r'^(P1_CRITICAL|P2_HIGH|P3_MEDIUM|P4_LOW)$')
    recommendedAction: str
    dispatchUrgency: str = Field(default="WITHIN_24H")
    suggestedDepartment: str = Field(default="Public Works Department")
    explanation: str

# ==============================================================================
# Client Class
# ==============================================================================
class GeminiClient:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        self.model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiClient] Initialization warning: {e}")

    def compute_hash(self, text: str) -> str:
        return hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]

    def _call_gemini_with_retries(self, prompt: str, schema_cls, max_retries: int = 3, timeout: int = 15) -> tuple[Dict[str, Any], str, int, int]:
        """
        Executes call with bounded retries, measuring latency and validating schema.
        Returns: (parsed_data, validation_status, latency_ms, token_count)
        """
        input_hash = self.compute_hash(prompt)
        start_time = time.time()
        
        if not self.client:
            latency_ms = int((time.time() - start_time) * 1000)
            return {}, "FALLBACK_NO_CLIENT", latency_ms, 0

        last_error = None
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2,
                    )
                )
                latency_ms = int((time.time() - start_time) * 1000)
                raw_text = response.text or "{}"
                token_count = getattr(response.usage_metadata, 'total_token_count', 0) if hasattr(response, 'usage_metadata') else 0

                # Validate with Pydantic
                data = json.loads(raw_text)
                validated = schema_cls.model_validate(data)
                return validated.model_dump(), "VALID", latency_ms, token_count
            except ValidationError as ve:
                last_error = f"Pydantic Validation Error: {ve}"
                time.sleep(0.5 * (2 ** attempt))
            except Exception as e:
                last_error = str(e)
                time.sleep(0.5 * (2 ** attempt))

        latency_ms = int((time.time() - start_time) * 1000)
        return {"error": last_error}, "INVALID", latency_ms, 0

    def call_listener_agent(self, title: str, description: str, category: str, address: str, report_obj=None) -> Dict[str, Any]:
        prompt_path = os.path.join(settings.BASE_DIR, 'apps', 'ai_processing', 'prompts', 'listener_v1.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            template = f.read()

        prompt = template.format(
            title=title,
            description=description,
            category=category,
            address=address
        )

        data, val_status, latency_ms, tokens = self._call_gemini_with_retries(prompt, ListenerOutputSchema)
        
        # Fallback if needed
        if val_status != "VALID":
            data = {
                "normalizedTitle": title.strip()[:80] or "Community Civic Notice",
                "normalizedDescription": description.strip(),
                "category": category,
                "keywords": [w.lower() for w in title.split()[:4] if len(w) > 3],
                "summary": description[:120] + "...",
                "confidenceScore": 0.82,
                "sentiment": "frustrated",
                "hazardType": "Standard municipal repair request"
            }

        self._log_output(
            agent_name="listener",
            prompt_version="v1.0",
            prompt_text=prompt,
            output_json=data,
            validation_status=val_status,
            latency_ms=latency_ms,
            token_count=tokens,
            report_obj=report_obj
        )
        return data

    def call_recurrence_agent(self, report_data: dict, candidate_issues: list, report_obj=None) -> Dict[str, Any]:
        prompt_path = os.path.join(settings.BASE_DIR, 'apps', 'ai_processing', 'prompts', 'recurrence_v1.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            template = f.read()

        candidates_formatted = json.dumps([
            {
                "id": c.get("id"),
                "title": c.get("title"),
                "category": c.get("category"),
                "address": c.get("address"),
                "description": c.get("description", "")[:200],
                "reportsCount": c.get("reports_count", 1),
            } for c in candidate_issues
        ], indent=2)

        prompt = template.format(
            report_id=report_data.get("id", "REP-NEW"),
            report_title=report_data.get("title", ""),
            report_category=report_data.get("category", ""),
            report_address=report_data.get("address", ""),
            report_description=report_data.get("description", ""),
            candidates_json=candidates_formatted
        )

        data, val_status, latency_ms, tokens = self._call_gemini_with_retries(prompt, RecurrenceOutputSchema)

        valid_candidate_ids = {c.get("id") for c in candidate_issues}

        if val_status == "VALID":
            # Extra safety check: if matched, ID must be in candidates
            if data.get("action") == "match":
                matched_id = data.get("matchedIssueId")
                if not matched_id or matched_id not in valid_candidate_ids:
                    data["action"] = "review"
                    data["reasoning"] += f" [Overridden to review: matched ID '{matched_id}' not in candidate set]"
            # If confidence is below threshold, route to review
            threshold = getattr(settings, 'RECURRENCE_CONFIDENCE_THRESHOLD', 0.70)
            if data.get("confidence", 1.0) < threshold and data.get("action") != "new":
                data["action"] = "review"
                data["reasoning"] += f" [Confidence {data.get('confidence')} below threshold {threshold}]"
        else:
            # Fallback
            data = {
                "action": "new" if not candidate_issues else "review",
                "matchedIssueId": None,
                "confidence": 0.85 if not candidate_issues else 0.50,
                "similarityScore": 0.2,
                "reasoning": "Fallback routing: candidates evaluated with heuristic rules."
            }

        self._log_output(
            agent_name="recurrence",
            prompt_version="v1.0",
            prompt_text=prompt,
            output_json=data,
            validation_status=val_status,
            latency_ms=latency_ms,
            token_count=tokens,
            report_obj=report_obj
        )
        return data

    def call_severity_agent(self, issue_context: dict, issue_obj=None) -> Dict[str, Any]:
        prompt_path = os.path.join(settings.BASE_DIR, 'apps', 'ai_processing', 'prompts', 'severity_v1.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            template = f.read()

        prompt = template.format(
            category=issue_context.get("category", ""),
            address=issue_context.get("address", ""),
            ward=issue_context.get("ward", ""),
            reports_count=issue_context.get("reports_count", 1),
            description=issue_context.get("description", ""),
            reports_evidence=issue_context.get("reports_evidence", "Multiple citizen reports lodged.")
        )

        data, val_status, latency_ms, tokens = self._call_gemini_with_retries(prompt, SeverityOutputSchema)

        if val_status != "VALID":
            data = {
                "severityLevel": "HIGH" if issue_context.get("reports_count", 1) >= 4 else "MEDIUM",
                "publicSafetyRisk": 7 if issue_context.get("reports_count", 1) >= 4 else 5,
                "infrastructureDamageRisk": 6,
                "vulnerablePopulationImpact": True if "Hospital" in issue_context.get("ward", "") else False,
                "economicOrTrafficDisruption": 6,
                "environmentalHazard": False,
                "severityScore": 68 if issue_context.get("reports_count", 1) >= 4 else 55,
                "keyRisks": ["Pedestrian hazard", "Structural deterioration"],
                "justification": "Evaluated based on hazard category, citizen volume, and proximity factors."
            }

        self._log_output(
            agent_name="severity",
            prompt_version="v1.0",
            prompt_text=prompt,
            output_json=data,
            validation_status=val_status,
            latency_ms=latency_ms,
            token_count=tokens,
            issue_obj=issue_obj
        )
        return data

    def call_priority_agent(self, issue_context: dict, deterministic_score: int, score_breakdown: dict, issue_obj=None) -> Dict[str, Any]:
        prompt_path = os.path.join(settings.BASE_DIR, 'apps', 'ai_processing', 'prompts', 'priority_v1.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            template = f.read()

        prompt = template.format(
            title=issue_context.get("title", ""),
            category=issue_context.get("category", ""),
            ward=issue_context.get("ward", ""),
            calculated_score=deterministic_score,
            severity_score=issue_context.get("severity_score", 50),
            reports_count=issue_context.get("reports_count", 1),
            score_breakdown_json=json.dumps(score_breakdown)
        )

        data, val_status, latency_ms, tokens = self._call_gemini_with_retries(prompt, PriorityOutputSchema)

        if val_status != "VALID":
            # Map score to tier
            if deterministic_score >= 80:
                tier = "P1_CRITICAL"
                urgency = "IMMEDIATE"
            elif deterministic_score >= 65:
                tier = "P2_HIGH"
                urgency = "WITHIN_24H"
            elif deterministic_score >= 45:
                tier = "P3_MEDIUM"
                urgency = "WITHIN_72H"
            else:
                tier = "P4_LOW"
                urgency = "ROUTINE"

            data = {
                "priorityTier": tier,
                "recommendedAction": f"Dispatch municipal maintenance crew under {tier} protocol.",
                "dispatchUrgency": urgency,
                "suggestedDepartment": issue_context.get("assigned_department", "Public Works Department"),
                "explanation": f"Score of {deterministic_score}/100 establishes {tier} urgency based on multi-factor analysis."
            }

        self._log_output(
            agent_name="priority",
            prompt_version="v1.0",
            prompt_text=prompt,
            output_json=data,
            validation_status=val_status,
            latency_ms=latency_ms,
            token_count=tokens,
            issue_obj=issue_obj
        )
        return data

    def _log_output(self, agent_name: str, prompt_version: str, prompt_text: str, output_json: dict, validation_status: str, latency_ms: int, token_count: int, report_obj=None, issue_obj=None):
        try:
            from apps.ai_processing.models import AgentOutput
            AgentOutput.objects.create(
                report=report_obj,
                issue=issue_obj,
                agent_name=agent_name,
                prompt_version=prompt_version,
                model_name=self.model_name,
                input_hash=self.compute_hash(prompt_text),
                output_json=output_json,
                validation_status=validation_status,
                latency_ms=latency_ms,
                token_count=token_count,
            )
        except Exception as e:
            # DB logging should never break the request flow
            print(f"[GeminiClient] AgentOutput audit log exception: {e}")
