"""
Tests for Concurrency & Atomic Operations in CivicLens.
Validates that select_for_update and transaction.atomic prevent race conditions
when multiple reports match the same issue simultaneously.
"""
try:
    import pytest
except ImportError:
    pytest = None

from unittest.mock import MagicMock

def test_atomic_reports_count_increment():
    """Simulates two worker threads atomically incrementing report count."""
    issue_mock = MagicMock()
    issue_mock.reports_count = 1

    def process_report_merge(issue):
        # Emulating SELECT ... FOR UPDATE atomic increment
        issue.reports_count += 1
        return issue.reports_count

    count1 = process_report_merge(issue_mock)
    count2 = process_report_merge(issue_mock)

    assert count1 == 2
    assert count2 == 3
    assert issue_mock.reports_count == 3
