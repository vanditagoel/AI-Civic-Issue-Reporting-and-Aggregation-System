from rest_framework import serializers
from .models import ProcessingJob, AgentOutput, ReviewQueueItem
from apps.reports.serializers import ReportSerializer

class ProcessingJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessingJob
        fields = '__all__'

class AgentOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentOutput
        fields = '__all__'

class ReviewQueueItemSerializer(serializers.ModelSerializer):
    report = ReportSerializer(read_only=True)

    class Meta:
        model = ReviewQueueItem
        fields = [
            'id', 'report', 'suggested_issue', 'suggested_action',
            'confidence_score', 'similarity_score', 'reasoning',
            'status', 'decision', 'decision_notes', 'officer_name',
            'created_at', 'resolved_at'
        ]

class ReviewDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=[
        ('MERGE', 'Merge with suggested issue'),
        ('CREATE_NEW', 'Create new independent docket'),
        ('DISMISS', 'Dismiss report as non-actionable')
    ])
    notes = serializers.CharField(required=False, allow_blank=True)
    officer_name = serializers.CharField(default="Admin Dispatcher")
    target_issue_id = serializers.CharField(required=False, allow_blank=True)
