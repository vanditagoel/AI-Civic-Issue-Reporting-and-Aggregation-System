"""
CivicLens 4-Agent Orchestration Pipeline
Coordinates:
1. Listener Agent (Intake standardization)
2. Candidate Retrieval (Deterministic geographic & semantic query)
3. Recurrence Agent (Deduplication / Cluster Matching)
4. Severity Agent (Hazard & Vulnerability Audit)
5. Authoritative Priority Scoring & Qualitative Priority Agent
Atomically commits changes with transaction.atomic, select_for_update, and idempotency guarantees.
"""
from typing import Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from apps.reports.models import Report, ReportStatus
from apps.issues.models import ConsolidatedIssue, IssueStatus, IssueActivity
from apps.ai_processing.models import ProcessingJob, JobStatus, ReviewQueueItem
from apps.notifications.models import Notification, NotificationType
from .gemini_client import GeminiClient
from .issue_aggregation import retrieve_candidates_for_report
from .priority_scoring import compute_priority_score

class AgentOrchestrator:
    def __init__(self):
        self.gemini = GeminiClient()

    def process_report_job(self, job_id: str) -> bool:
        """
        Executes the entire multi-agent processing pipeline for a queued job.
        Idempotent: safe to retry without creating duplicate links.
        """
        try:
            job = ProcessingJob.objects.select_related('report', 'report__citizen').get(id=job_id)
        except ProcessingJob.DoesNotExist:
            return False

        report = job.report

        # Mark job as processing
        job.status = JobStatus.PROCESSING
        job.started_at = timezone.now()
        job.attempts += 1
        job.save(update_fields=['status', 'started_at', 'attempts'])

        try:
            # ------------------------------------------------------------------
            # STEP 1: Listener Agent (Intake Standardization)
            # ------------------------------------------------------------------
            listener_res = self.gemini.call_listener_agent(
                title=report.title,
                description=report.description,
                category=report.category,
                address=report.address,
                report_obj=report
            )

            report.listener_output = listener_res
            if listener_res.get('normalizedTitle'):
                report.title = listener_res['normalizedTitle']
            report.save(update_fields=['listener_output', 'title'])

            # ------------------------------------------------------------------
            # STEP 2: Candidate Retrieval (Deterministic, non-LLM)
            # ------------------------------------------------------------------
            candidates = retrieve_candidates_for_report({
                'id': report.id,
                'title': report.title,
                'category': report.category,
                'address': report.address,
                'ward': report.ward,
                'description': report.description,
            })

            # ------------------------------------------------------------------
            # STEP 3: Recurrence Agent (Deduplication)
            # ------------------------------------------------------------------
            recurrence_res = self.gemini.call_recurrence_agent(
                report_data={
                    'id': report.id,
                    'title': report.title,
                    'category': report.category,
                    'address': report.address,
                    'description': report.description,
                },
                candidate_issues=candidates,
                report_obj=report
            )

            report.recurrence_output = recurrence_res
            action = recurrence_res.get('action', 'new')
            matched_id = recurrence_res.get('matchedIssueId')

            # ------------------------------------------------------------------
            # STEP 4: Branching Decision (Review vs Match vs New)
            # ------------------------------------------------------------------
            if action == 'review':
                with transaction.atomic():
                    report.status = ReportStatus.UNDER_REVIEW
                    report.save(update_fields=['status', 'recurrence_output'])

                    suggested_issue = None
                    if matched_id:
                        suggested_issue = ConsolidatedIssue.objects.filter(id=matched_id).first()

                    ReviewQueueItem.objects.update_or_create(
                        report=report,
                        defaults={
                            'suggested_issue': suggested_issue,
                            'suggested_action': 'MERGE' if suggested_issue else 'CREATE_NEW',
                            'confidence_score': recurrence_res.get('confidence', 0.5),
                            'similarity_score': recurrence_res.get('similarityScore', 0.5),
                            'reasoning': recurrence_res.get('reasoning', 'Flagged for human triage review.'),
                            'status': 'PENDING',
                        }
                    )

                    job.status = JobStatus.NEEDS_REVIEW
                    job.finished_at = timezone.now()
                    job.save(update_fields=['status', 'finished_at'])

                    # Notify citizen of review triage
                    Notification.objects.create(
                        user=report.citizen,
                        report=report,
                        title="Notice Under Human Review",
                        message=f"Your notice regarding '{report.title}' has been routed to the municipal triage desk for location verification.",
                        notification_type=NotificationType.AI_REVIEW
                    )
                return True

            target_issue = None

            with transaction.atomic():
                if action == 'match' and matched_id:
                    # Select for update to prevent concurrent duplicate count increment
                    target_issue = ConsolidatedIssue.objects.select_for_update().filter(id=matched_id).first()

                if target_issue:
                    # Idempotency check: only link if not already linked
                    if report.consolidated_issue_id != target_issue.id:
                        report.consolidated_issue = target_issue
                        report.status = ReportStatus.ASSOCIATED
                        report.save(update_fields=['consolidated_issue', 'status', 'recurrence_output'])
                        
                        target_issue.reports_count += 1
                        target_issue.last_reported_at = timezone.now()
                        target_issue.save(update_fields=['reports_count', 'last_reported_at'])

                        IssueActivity.objects.create(
                            issue=target_issue,
                            actor="CivicLens AI Pipeline",
                            action=f"Clustered community report {report.id}",
                            details=f"Recurrence Agent matched report with confidence {recurrence_res.get('confidence', 0.9)}: {recurrence_res.get('reasoning')}",
                            activity_type="CLUSTER_MERGE"
                        )
                else:
                    # Action is NEW or matched issue did not exist: create new ConsolidatedIssue
                    target_issue = ConsolidatedIssue.objects.create(
                        title=report.title,
                        category=report.category,
                        description=report.description,
                        summary=listener_res.get('summary', report.description[:120]),
                        address=report.address,
                        ward=report.ward,
                        latitude=report.latitude,
                        longitude=report.longitude,
                        reports_count=1,
                        status=IssueStatus.TRIAGED,
                        assigned_department=self._default_department_for_category(report.category)
                    )

                    report.consolidated_issue = target_issue
                    report.status = ReportStatus.PROCESSED
                    report.save(update_fields=['consolidated_issue', 'status', 'recurrence_output'])

                    IssueActivity.objects.create(
                        issue=target_issue,
                        actor="CivicLens AI Pipeline",
                        action="Created Master Issue Docket",
                        details=f"Spawned new consolidated docket from initial report {report.id}.",
                        activity_type="INITIATION"
                    )

                # --------------------------------------------------------------
                # STEP 5: Severity Agent (Hazard Assessment)
                # --------------------------------------------------------------
                severity_res = self.gemini.call_severity_agent(
                    issue_context={
                        'category': target_issue.category,
                        'address': target_issue.address,
                        'ward': target_issue.ward,
                        'reports_count': target_issue.reports_count,
                        'description': target_issue.description,
                        'reports_evidence': f"Notice: {report.description}"
                    },
                    issue_obj=target_issue
                )

                sev_score = severity_res.get('severityScore', 55)
                target_issue.severity_score = sev_score
                target_issue.severity_level = severity_res.get('severityLevel', 'MEDIUM')

                # --------------------------------------------------------------
                # STEP 6: Authoritative Deterministic Priority Scoring
                # --------------------------------------------------------------
                priority_score, priority_tier, score_breakdown = compute_priority_score(
                    severity_score=sev_score,
                    reports_count=target_issue.reports_count,
                    ward_name=target_issue.ward,
                    first_reported_at=target_issue.first_reported_at,
                    last_reported_at=target_issue.last_reported_at
                )

                target_issue.priority_score = priority_score
                target_issue.priority_tier = priority_tier
                target_issue.score_breakdown = score_breakdown

                # --------------------------------------------------------------
                # STEP 7: Priority Agent (Qualitative Explanation & SLA Urgency)
                # --------------------------------------------------------------
                priority_agent_res = self.gemini.call_priority_agent(
                    issue_context={
                        'title': target_issue.title,
                        'category': target_issue.category,
                        'ward': target_issue.ward,
                        'severity_score': sev_score,
                        'reports_count': target_issue.reports_count,
                        'assigned_department': target_issue.assigned_department
                    },
                    deterministic_score=priority_score,
                    score_breakdown=score_breakdown,
                    issue_obj=target_issue
                )

                # Consolidate all agent outputs in target_issue
                target_issue.agent_outputs = {
                    'listener': listener_res,
                    'recurrence': recurrence_res,
                    'severityAssessment': severity_res,
                    'priorityAssessment': priority_agent_res,
                }
                target_issue.save()

                # Mark Job succeeded
                job.status = JobStatus.SUCCEEDED
                job.finished_at = timezone.now()
                job.last_error = None
                job.save(update_fields=['status', 'finished_at', 'last_error'])

                # Send citizen notification
                Notification.objects.create(
                    user=report.citizen,
                    issue=target_issue,
                    report=report,
                    title=f"Report Processed: Docket #{target_issue.id}",
                    message=f"Your notice has been integrated into Master Issue {target_issue.id} with priority {target_issue.priority_tier} (Score: {target_issue.priority_score}/100).",
                    notification_type=NotificationType.CONSOLIDATED
                )

            return True

        except Exception as e:
            job.status = JobStatus.FAILED
            job.last_error = str(e)
            job.finished_at = timezone.now()
            job.save(update_fields=['status', 'last_error', 'finished_at'])
            return False

    def _default_department_for_category(self, category: str) -> str:
        mapping = {
            'Roads & Bridges': 'Public Works Department',
            'Water & Drainage': 'Water & Sewerage Authority',
            'Streetlights & Electrical': 'Electrical & Street Lighting',
            'Sanitation & Solid Waste': 'Sanitation Directorate',
            'Traffic & Signage': 'Transportation & Traffic Bureau',
            'Parks & Public Spaces': 'Parks & Recreation Division',
            'Public Safety & Hazards': 'Emergency Infrastructure Taskforce',
        }
        return mapping.get(category, 'Public Works Department')
