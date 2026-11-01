from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import ConsolidatedIssue, IssueActivity, IssueComment, IssueStatus
from .serializers import (
    ConsolidatedIssueSerializer,
    IssueStatusUpdateSerializer,
    PriorityOverrideSerializer,
    IssueMergeSerializer,
    IssueCommentSerializer
)
from apps.accounts.permissions import IsAdminUserRole
from apps.notifications.models import Notification, NotificationType

class ConsolidatedIssueViewSet(viewsets.ModelViewSet):
    queryset = ConsolidatedIssue.objects.all().prefetch_related('reports', 'activities', 'comments')
    serializer_class = ConsolidatedIssueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        ward = self.request.query_params.get('ward')
        status_param = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        search = self.request.query_params.get('search')

        if category:
            qs = qs.filter(category__iexact=category)
        if ward:
            qs = qs.filter(ward__icontains=ward)
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if priority:
            qs = qs.filter(priority_tier=priority.upper())
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(address__icontains=search)
        return qs

    @action(detail=True, methods=['patch', 'post'], permission_classes=[IsAdminUserRole])
    def update_status(self, request, pk=None):
        issue = self.get_object()
        serializer = IssueStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        new_dept = serializer.validated_data.get('assigned_department')
        actor = serializer.validated_data.get('actor_name') or request.user.username
        notes = serializer.validated_data.get('notes', '')

        old_status = issue.status
        issue.status = new_status
        if new_dept:
            issue.assigned_department = new_dept
        issue.save()

        # Log Activity
        IssueActivity.objects.create(
            issue=issue,
            actor=actor,
            action=f"Status changed from {old_status} to {new_status}",
            details=notes or f"Updated via Municipal Dispatch by {actor}.",
            activity_type="STATUS_CHANGE"
        )

        # Notify linked citizens of resolution or work order progress
        if new_status in [IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED]:
            for rep in issue.reports.all():
                Notification.objects.create(
                    user=rep.citizen,
                    issue=issue,
                    report=rep,
                    title=f"Work Order Update: {new_status}",
                    message=f"Docket #{issue.id} ('{issue.title}') has progressed to {new_status}.",
                    notification_type=NotificationType.STATUS_UPDATE
                )

        return Response(ConsolidatedIssueSerializer(issue).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def override_priority(self, request, pk=None):
        issue = self.get_object()
        serializer = PriorityOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_score = serializer.validated_data['priority_score']
        new_tier = serializer.validated_data['priority_tier']
        reason = serializer.validated_data['override_reason']
        actor = serializer.validated_data['actor_name']

        old_score = issue.priority_score
        old_tier = issue.priority_tier

        issue.priority_score = new_score
        issue.priority_tier = new_tier
        if not issue.score_breakdown:
            issue.score_breakdown = {}
        issue.score_breakdown['manual_override'] = {
            'overridden_by': actor,
            'reason': reason,
            'previous_score': old_score,
            'previous_tier': old_tier,
            'timestamp': timezone.now().isoformat(),
        }
        issue.save()

        IssueActivity.objects.create(
            issue=issue,
            actor=actor,
            action=f"Priority Overridden: {old_tier} ({old_score}) -> {new_tier} ({new_score})",
            details=f"Reason: {reason}",
            activity_type="PRIORITY_OVERRIDE"
        )

        return Response(ConsolidatedIssueSerializer(issue).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def merge_into(self, request, pk=None):
        """
        Merges one or more source issues into this primary issue using
        transaction.atomic and select_for_update.
        """
        primary_issue = self.get_object()
        serializer = IssueMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_ids = serializer.validated_data['source_issue_ids']
        merge_reason = serializer.validated_data['merge_reason']
        actor = serializer.validated_data['actor_name']

        with transaction.atomic():
            locked_primary = ConsolidatedIssue.objects.select_for_update().get(id=primary_issue.id)
            source_issues = list(ConsolidatedIssue.objects.select_for_update().filter(id__in=source_ids))

            total_absorbed_reports = 0
            for src in source_issues:
                # Reassign all reports to locked_primary
                absorbed_count = src.reports.update(consolidated_issue=locked_primary)
                total_absorbed_reports += absorbed_count

                IssueActivity.objects.create(
                    issue=locked_primary,
                    actor=actor,
                    action=f"Merged issue {src.id} into this docket",
                    details=f"Absorbed {absorbed_count} citizen reports. Reason: {merge_reason}",
                    activity_type="MERGE_CONSOLIDATION"
                )

                # Close the source issue
                src.status = IssueStatus.CLOSED
                src.save(update_fields=['status'])

            locked_primary.reports_count += total_absorbed_reports
            locked_primary.save(update_fields=['reports_count'])

        return Response(ConsolidatedIssueSerializer(locked_primary).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comments(self, request, pk=None):
        issue = self.get_object()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Comment text cannot be blank.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = IssueComment.objects.create(
            issue=issue,
            author=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            role=getattr(request.user, 'role', 'CITIZEN'),
            text=text,
            is_internal=request.data.get('is_internal', True)
        )
        return Response(IssueCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
