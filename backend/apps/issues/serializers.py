from rest_framework import serializers
from .models import ConsolidatedIssue, IssueActivity, IssueComment
from apps.reports.serializers import ReportSerializer

class IssueActivitySerializer(models_serializer := serializers.ModelSerializer):
    class Meta:
        model = IssueActivity
        fields = ['id', 'timestamp', 'actor', 'action', 'details', 'activity_type']

class IssueCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueComment
        fields = ['id', 'author', 'role', 'text', 'timestamp', 'is_internal']

class ConsolidatedIssueSerializer(serializers.ModelSerializer):
    reports = ReportSerializer(many=True, read_only=True)
    activities = IssueActivitySerializer(many=True, read_only=True)
    comments = IssueCommentSerializer(many=True, read_only=True)

    class Meta:
        model = ConsolidatedIssue
        fields = [
            'id', 'title', 'category', 'description', 'summary',
            'address', 'ward', 'latitude', 'longitude', 'status',
            'priority_tier', 'priority_score', 'severity_score', 'severity_level',
            'assigned_department', 'reports_count', 'agent_outputs',
            'score_breakdown', 'first_reported_at', 'last_reported_at',
            'estimated_resolution_days', 'reports', 'activities', 'comments'
        ]

class IssueStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        ('NEW', 'New'),
        ('TRIAGED', 'Triaged'),
        ('IN_REVIEW', 'In Review'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ])
    assigned_department = serializers.CharField(required=False, allow_blank=True)
    actor_name = serializers.CharField(required=False, default="Admin Officer")
    notes = serializers.CharField(required=False, allow_blank=True)

class PriorityOverrideSerializer(serializers.Serializer):
    priority_score = serializers.IntegerField(min_value=1, max_value=100)
    priority_tier = serializers.ChoiceField(choices=[
        ('P1_CRITICAL', 'P1 Critical'),
        ('P2_HIGH', 'P2 High'),
        ('P3_MEDIUM', 'P3 Medium'),
        ('P4_LOW', 'P4 Low'),
    ])
    override_reason = serializers.CharField(min_length=10)
    actor_name = serializers.CharField(default="Admin Dispatcher")

class IssueMergeSerializer(serializers.Serializer):
    source_issue_ids = serializers.ListField(
        child=serializers.CharField(),
        min_length=1
    )
    merge_reason = serializers.CharField(min_length=5)
    actor_name = serializers.CharField(default="Admin Dispatcher")
