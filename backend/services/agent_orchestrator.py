"""
CivicLens 4-Agent Orchestration Service (Python / Django)
Uses the official Google Gen AI Python SDK with gemini-2.5-flash / gemini-3.8-flash
"""
import os
import json
from google import genai
from google.genai import types

def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

class AgentOrchestrator:
    def __init__(self):
        self.client = get_genai_client()

    def run_listener_agent(self, raw_title: str, raw_description: str, category: str, address: str) -> dict:
        """1. Listener Agent: Standardizes intake, normalizes title, extracts keywords & sentiment."""
        prompt = f"""You are the Listener Agent in CivicLens.
Analyze this civic issue report:
Title: {raw_title}
Description: {raw_description}
Category: {category}
Address: {address}

Output strictly valid JSON with:
normalizedTitle, normalizedDescription, category, keywords, summary, confidenceScore (0.0-1.0), sentiment, hazardType.
"""
        if not self.client:
            return {"normalizedTitle": raw_title, "category": category, "summary": raw_title, "confidenceScore": 0.85}

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)

    def run_recurrence_agent(self, report_data: dict, candidate_issues: list) -> dict:
        """2. Recurrence Agent: Matches against candidates, flags new issue, or escalates to human review."""
        prompt = f"""You are the Recurrence Agent in CivicLens.
Evaluate if this new report matches existing active municipal issues:
Report: {report_data}
Candidates: {candidate_issues}

Output strictly valid JSON:
decision ('MATCH_EXISTING' | 'CREATE_NEW' | 'NEEDS_REVIEW'),
matchedIssueId, confidence, similarityScore, reasoning.
"""
        if not self.client:
            return {"decision": "CREATE_NEW", "confidence": 0.9, "similarityScore": 0.1, "reasoning": "Fallback"}

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)

    def run_severity_agent(self, issue_context: dict) -> dict:
        """3. Severity Agent: Assesses physical danger, infrastructure damage, and vulnerable population risks."""
        prompt = f"""You are the Severity Agent in CivicLens.
Assess severity of this municipal issue:
{issue_context}

Output strictly valid JSON:
severityLevel ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
publicSafetyRisk (1-10), infrastructureDamageRisk (1-10), vulnerablePopulationImpact (bool),
economicOrTrafficDisruption (1-10), environmentalHazard (bool), severityScore (1-100), keyRisks, justification.
"""
        if not self.client:
            return {"severityLevel": "MEDIUM", "severityScore": 55, "publicSafetyRisk": 5, "infrastructureDamageRisk": 5}

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)

    def run_priority_agent(self, issue_context: dict, deterministic_score: int) -> dict:
        """4. Priority Agent: Provides qualitative dispatch recommendation matching calculated score."""
        prompt = f"""You are the Priority Agent in CivicLens.
Given calculated score {deterministic_score}/100 and issue:
{issue_context}

Output strictly valid JSON:
priorityTier ('P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW'),
recommendedAction, dispatchUrgency, suggestedDepartment, explanation.
"""
        if not self.client:
            return {"priorityTier": "P2_HIGH", "recommendedAction": "Standard dispatch", "dispatchUrgency": "WITHIN_24H"}

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
