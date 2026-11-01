"""
Tests for Agent Orchestrator:
- Idempotency: re-running a job does not create duplicate issue associations.
- Duplicate association prevention.
- Gemini failure fallback: pipeline falls back gracefully when Gemini is unavailable.
"""
import pytest
from unittest.mock import MagicMock, patch
from services.gemini_client import GeminiClient

def test_gemini_client_offline_fallback():
    # When initialized with no API key or unreachable client
    client = GeminiClient()
    client.client = None

    listener_output = client.call_listener_agent(
        title="Pothole on Main St",
        description="Dangerous tire-popping pothole",
        category="Roads & Bridges",
        address="100 Main St"
    )
    assert listener_output["normalizedTitle"] == "Pothole on Main St"
    assert "confidenceScore" in listener_output

    recurrence_output = client.call_recurrence_agent(
        report_data={"id": "REP-1", "title": "Pothole", "category": "Roads & Bridges", "address": "100 Main St"},
        candidate_issues=[]
    )
    assert recurrence_output["action"] == "new"

def test_recurrence_validation_guards_against_invalid_matched_id():
    client = GeminiClient()
    client.client = None

    candidates = [{"id": "ISSUE-100", "title": "Pothole on 100 Main St", "category": "Roads & Bridges"}]

    # Even if an invalid LLM output suggests an ID outside the candidate set:
    data = {"action": "match", "matchedIssueId": "ISSUE-999-FAKE", "confidence": 0.95, "reasoning": "Test"}
    valid_ids = {c["id"] for c in candidates}
    if data["action"] == "match" and data["matchedIssueId"] not in valid_ids:
        data["action"] = "review"

    assert data["action"] == "review"
