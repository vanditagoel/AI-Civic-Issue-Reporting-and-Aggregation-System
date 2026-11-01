from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.conf import settings
from .models import Report, ReportStatus
from .serializers import ReportSerializer, ReportCreateSerializer
from apps.accounts.permissions import IsOwnerOrAdmin
from apps.ai_processing.models import ProcessingJob, JobStatus
from services.agent_orchestrator import AgentOrchestrator

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'report_submission'

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Report.objects.none()
        # Admin sees all reports, citizens only see their own
        if getattr(user, 'role', None) == 'ADMIN' or user.is_staff:
            return Report.objects.all().select_related('citizen', 'consolidated_issue')
        return Report.objects.filter(citizen=user).select_related('consolidated_issue')

    def create(self, request, *args, **kwargs):
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        report = serializer.save(
            citizen=user,
            citizen_name=f"{user.first_name} {user.last_name}".strip() or user.username,
            citizen_email=user.email or "citizen@civiclens.org",
            status=ReportStatus.PENDING_ANALYSIS
        )

        # Enqueue ProcessingJob
        job = ProcessingJob.objects.create(
            report=report,
            status=JobStatus.QUEUED
        )

        # Check execution mode: if inline, process immediately
        job_runner = getattr(settings, 'JOB_RUNNER', 'inline').lower()
        if job_runner == 'inline':
            orchestrator = AgentOrchestrator()
            orchestrator.process_report_job(str(job.id))
            report.refresh_from_db()

        headers = self.get_success_headers(serializer.data)
        return Response(
            ReportSerializer(report).data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
