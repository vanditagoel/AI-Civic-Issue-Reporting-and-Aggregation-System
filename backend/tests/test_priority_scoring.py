"""
Tests for CivicLens Priority Scoring Formula.
Verifies boundary clamping (1-100), deterministic tier mapping, and score breakdown.
"""
try:
    import pytest
except ImportError:
    pytest = None

from services.priority_scoring import compute_priority_score

def test_priority_score_boundaries():
    # Extremely low values: should clamp to >= 1
    score_low, tier_low, breakdown_low = compute_priority_score(
        severity_score=1,
        reports_count=1,
        ward_name='Ward 5 (Residential East)'
    )
    assert score_low >= 1
    assert score_low <= 100
    assert tier_low in ['P3_MEDIUM', 'P4_LOW']

    # Extremely high values: should clamp to <= 100
    score_high, tier_high, breakdown_high = compute_priority_score(
        severity_score=100,
        reports_count=20,
        ward_name='Ward 4 (Central Hospital & Metro Corridor)'
    )
    assert score_high <= 100
    assert score_high >= 80
    assert tier_high == 'P1_CRITICAL'

def test_priority_score_tier_mapping():
    # Score >= 80 must be P1_CRITICAL
    s, t, b = compute_priority_score(severity_score=95, reports_count=6, ward_name='Ward 4')
    assert s >= 80
    assert t == 'P1_CRITICAL'

    # Breakdown verification
    assert 'severity' in b['components']
    assert 'recurrence' in b['components']
    assert 'ward_sensitivity' in b['components']
    assert 'aging_latency' in b['components']
    assert b['components']['severity']['weight'] == 0.45
    assert b['components']['recurrence']['weight'] == 0.25
