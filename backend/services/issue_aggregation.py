"""
CivicLens Issue Aggregation Service
Deterministic candidate retrieval (strictly NOT LLM) that identifies potential
matching issues for the Recurrence Agent to evaluate.
"""
from datetime import timedelta
from typing import List, Dict, Any
from django.utils import timezone
from django.conf import settings
from apps.issues.models import ConsolidatedIssue, IssueStatus

def calculate_text_similarity(text_a: str, text_b: str) -> float:
    """
    Computes token-based Jaccard similarity coefficient between two strings.
    Fast, reliable, and deterministic.
    """
    tokens_a = set(text_a.lower().replace(',', ' ').replace('.', ' ').split())
    tokens_b = set(text_b.lower().replace(',', ' ').replace('.', ' ').split())
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    union = tokens_a.union(tokens_b)
    return len(intersection) / len(union)

def retrieve_candidates_for_report(report_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Retrieves up to N candidate open issues for a given report using deterministic filters:
    1. Active status (NEW, TRIAGED, ASSIGNED, IN_PROGRESS, IN_REVIEW)
    2. Same or related category
    3. Within time window (default 30 days)
    4. Location/text proximity ranking
    """
    category = report_data.get('category')
    address = report_data.get('address', '')
    ward = report_data.get('ward', '')
    limit = getattr(settings, 'CANDIDATE_RETRIEVAL_LIMIT', 10)
    window_days = getattr(settings, 'CANDIDATE_TIME_WINDOW_DAYS', 30)
    cutoff_time = timezone.now() - timedelta(days=window_days)

    # Base Query: Open issues in same category within time window
    active_statuses = [
        IssueStatus.NEW,
        IssueStatus.TRIAGED,
        IssueStatus.ASSIGNED,
        IssueStatus.IN_PROGRESS,
        IssueStatus.IN_REVIEW,
    ]

    queryset = ConsolidatedIssue.objects.filter(
        status__in=active_statuses,
        category=category,
        first_reported_at__gte=cutoff_time
    )

    # If few or no candidates in same category, expand to same ward
    if queryset.count() < 3 and ward:
        queryset = ConsolidatedIssue.objects.filter(
            status__in=active_statuses,
            ward=ward,
            first_reported_at__gte=cutoff_time
        )

    candidates = list(queryset)

    # Rank candidates by text similarity on address & title
    scored_candidates = []
    for issue in candidates:
        addr_sim = calculate_text_similarity(address, issue.address)
        title_sim = calculate_text_similarity(report_data.get('title', ''), issue.title)
        combined_sim = (addr_sim * 0.7) + (title_sim * 0.3)
        scored_candidates.append((combined_sim, issue))

    # Sort descending by similarity
    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    # Return top N candidates formatted for Recurrence Agent
    top_candidates = []
    for score, issue in scored_candidates[:limit]:
        top_candidates.append({
            'id': issue.id,
            'title': issue.title,
            'category': issue.category,
            'address': issue.address,
            'ward': issue.ward,
            'description': issue.description,
            'status': issue.status,
            'reports_count': issue.reports_count,
            'similarity_score': round(score, 3),
        })

    return top_candidates
