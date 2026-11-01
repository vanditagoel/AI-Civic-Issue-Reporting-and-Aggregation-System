from rest_framework import viewsets, views, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.db.models import Avg, Count
from .models import ProcessingJob, AgentOutput, ReviewQueueItem, JobStatus
from .serializers import (
    ProcessingJobSerializer,
    AgentOutputSerializer,
    ReviewQueueItemSerializer,
    ReviewDecisionSerializer
)
from apps.reports.models import Report, ReportStatus
from apps.issues.models import ConsolidatedIssue, IssueStatus, IssueActivity
from apps.accounts.permissions import IsAdminUserRole
from services.agent_orchestrator import AgentOrchestrator

class ReviewQueueViewSet(viewsets.ModelViewSet):
    queryset = ReviewQueueItem.objects.all().select_related('report', 'suggested_issue')
    serializer_class = ReviewQueueItemSerializer
    permission_classes = [IsAdminUserRole]

    @action(detail=True, methods=['post'])
    def decision(self, request, pk=None):
        item = self.get_object()
        serializer = ReviewDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dec = serializer.validated_data['decision']
        notes = serializer.validated_data.get('notes', '')
        officer = serializer.validated_data.get('officer_name', request.user.username)
        target_id = serializer.validated_data.get('target_issue_id')

        report = item.report

        with transaction.atomic():
            if dec == 'MERGE':
                target_issue = None
                if target_id:
                    target_issue = ConsolidatedIssue.objects.filter(id=target_id).first()
                elif item.suggested_issue:
                    target_issue = item.suggested_issue

                if not target_issue:
                    return Response({'error': 'No valid target issue to merge with.'}, status=status.HTTP_400_BAD_REQUEST)

                report.consolidated_issue = target_issue
                report.status = ReportStatus.ASSOCIATED
                report.save(update_fields=['consolidated_issue', 'status'])

                target_issue.reports_count += 1
                target_issue.save(update_fields=['reports_count'])

                IssueActivity.objects.create(
                    issue=target_issue,
                    actor=officer,
                    action=f"Manually merged report {report.id} from Review Queue",
                    details=f"Officer Decision: MERGE. Notes: {notes}",
                    activity_type="HUMAN_TRIAGE"
                )

            elif dec == 'CREATE_NEW':
                target_issue = ConsolidatedIssue.objects.create(
                    title=report.title,
                    category=report.category,
                    description=report.description,
                    summary=report.description[:120],
                    address=report.address,
                    ward=report.ward,
                    reports_count=1,
                    status=IssueStatus.TRIAGED,
                    assigned_department='Public Works Department'
                )
                report.consolidated_issue = target_issue
                report.status = ReportStatus.PROCESSED
                report.save(update_fields=['consolidated_issue', 'status'])

                IssueActivity.objects.create(
                    issue=target_issue,
                    actor=officer,
                    action=f"Spawned new docket from Review Queue report {report.id}",
                    details=f"Officer Decision: CREATE_NEW. Notes: {notes}",
                    activity_type="HUMAN_TRIAGE"
                )

            elif dec == 'DISMISS':
                report.status = ReportStatus.REJECTED
                report.save(update_fields=['status'])

            item.status = 'RESOLVED'
            item.decision = dec
            item.decision_notes = notes
            item.officer_name = officer
            item.resolved_at = timezone.now()
            item.save()

        return Response(ReviewQueueItemSerializer(item).data)

class RetryJobView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, job_id):
        job = ProcessingJob.objects.filter(id=job_id).first()
        if not job:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        orchestrator = AgentOrchestrator()
        success = orchestrator.process_report_job(str(job.id))
        job.refresh_from_db()
        return Response({
            'success': success,
            'job': ProcessingJobSerializer(job).data
        })

class AIMonitorStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_jobs = ProcessingJob.objects.count()
        succeeded_jobs = ProcessingJob.objects.filter(status=JobStatus.SUCCEEDED).count()
        failed_jobs = ProcessingJob.objects.filter(status=JobStatus.FAILED).count()
        review_jobs = ProcessingJob.objects.filter(status=JobStatus.NEEDS_REVIEW).count()

        agent_latencies = AgentOutput.objects.values('agent_name').annotate(
            avg_latency=Avg('latency_ms'),
            call_count=Count('id')
        )

        recent_logs = AgentOutput.objects.order_by('-created_at')[:30]

        return Response({
            'total_jobs': total_jobs,
            'succeeded_jobs': succeeded_jobs,
            'failed_jobs': failed_jobs,
            'review_jobs': review_jobs,
            'success_rate': round((succeeded_jobs / total_jobs * 100), 1) if total_jobs > 0 else 100.0,
            'agent_latencies': list(agent_latencies),
            'recent_logs': AgentOutputSerializer(recent_logs, many=True).data
        })
