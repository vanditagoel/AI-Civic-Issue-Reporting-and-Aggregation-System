"""
CivicLens Priority Scoring Engine
Computes the authoritative, bounded, and deterministic 1-100 Priority Score
for consolidated municipal issues using a transparent formula.
"""
from typing import Dict, Any, Tuple
from datetime import datetime

try:
    from django.conf import settings
    from django.utils import timezone
except ImportError:
    class DummySettings:
        PRIORITY_WEIGHTS = {
            'severity': 0.45,
            'recurrence': 0.25,
            'ward_sensitivity': 0.15,
            'aging': 0.15,
        }
    settings = DummySettings()
    class DummyTimezone:
        @staticmethod
        def now():
            return datetime.utcnow()
    timezone = DummyTimezone()


WARD_SENSITIVITY_SCORES = {
    'Ward 1': 70,  # Civic Center / Government
    'Ward 2': 65,  # Commercial & Downtown
    'Ward 3': 80,  # University & Transit Hub
    'Ward 4': 95,  # Central Hospital & Metro Corridor (Critical)
    'Ward 5': 60,  # Residential East
    'Ward 6': 75,  # Industrial & Logistics Hub
    'Ward 7': 60,  # Waterfront & Greenbelt
}

def compute_priority_score(
    severity_score: int,
    reports_count: int,
    ward_name: str,
    first_reported_at=None,
    last_reported_at=None
) -> Tuple[int, str, Dict[str, Any]]:
    """
    Computes priority score (1-100), priority tier, and granular breakdown:
    Formula:
      Priority Score = clamp(w_sev*Severity + w_rec*Recurrence + w_ward*Ward + w_age*Aging)
    """
    weights = getattr(settings, 'PRIORITY_WEIGHTS', {
        'severity': 0.45,
        'recurrence': 0.25,
        'ward_sensitivity': 0.15,
        'aging': 0.15,
    })

    # 1. Severity Component (1-100)
    sev_norm = max(1, min(100, severity_score))

    # 2. Recurrence Component (Logarithmic scale: 1 report = 20, 5+ reports = 100)
    # rec_score = min(100, 20 + (reports_count - 1) * 20)
    rec_norm = min(100, 20 + max(0, reports_count - 1) * 20)

    # 3. Ward Sensitivity Component
    ward_key = ward_name.split('(')[0].strip() if ward_name else 'Ward 5'
    ward_norm = WARD_SENSITIVITY_SCORES.get(ward_key, 65)

    # 4. Aging / Latency Component (Unresolved aging factor)
    now = timezone.now()
    if first_reported_at:
        days_open = (now - first_reported_at).total_seconds() / 86400.0
    else:
        days_open = 0.5
    # Aging score rises by 10 points per day up to max 100
    age_norm = min(100, int(20 + (days_open * 15)))

    # Weighted calculation
    raw_score = (
        (weights['severity'] * sev_norm) +
        (weights['recurrence'] * rec_norm) +
        (weights['ward_sensitivity'] * ward_norm) +
        (weights['aging'] * age_norm)
    )

    final_score = int(max(1, min(100, round(raw_score))))

    # Deterministic Tier Mapping
    if final_score >= 80:
        tier = 'P1_CRITICAL'
    elif final_score >= 65:
        tier = 'P2_HIGH'
    elif final_score >= 45:
        tier = 'P3_MEDIUM'
    else:
        tier = 'P4_LOW'

    breakdown = {
        'final_score': final_score,
        'priority_tier': tier,
        'components': {
            'severity': {
                'raw_value': sev_norm,
                'weight': weights['severity'],
                'weighted_contribution': round(weights['severity'] * sev_norm, 2),
            },
            'recurrence': {
                'reports_count': reports_count,
                'raw_value': rec_norm,
                'weight': weights['recurrence'],
                'weighted_contribution': round(weights['recurrence'] * rec_norm, 2),
            },
            'ward_sensitivity': {
                'ward': ward_key,
                'raw_value': ward_norm,
                'weight': weights['ward_sensitivity'],
                'weighted_contribution': round(weights['ward_sensitivity'] * ward_norm, 2),
            },
            'aging_latency': {
                'days_open': round(days_open, 2),
                'raw_value': age_norm,
                'weight': weights['aging'],
                'weighted_contribution': round(weights['aging'] * age_norm, 2),
            }
        },
        'formula': "clamp(0.45*Severity + 0.25*Recurrence + 0.15*Ward + 0.15*Aging)"
    }

    return final_score, tier, breakdown
