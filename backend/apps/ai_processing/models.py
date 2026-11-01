import uuid
from django.db import models
from django.conf import settings

class JobStatus(models.TextChoices):
    QUEUED = 'queued', 'Queued'
    PROCESSING = 'processing', 'Processing'
    SUCCEEDED = 'succeeded', 'Succeeded'
    FAILED = 'failed', 'Failed'
    NEEDS_REVIEW = 'needs_review', 'Needs Human Review'

class ProcessingJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        'reports.Report',
        on_delete=models.CASCADE,
        related_name='processing_jobs',
        db_index=True
    )
    status = models.CharField(
        max_length=32,
        choices=JobStatus.choices,
        default=JobStatus.QUEUED,
        db_index=True
    )
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    last_error = models.TextField(blank=True, null=True)

    locked_at = models.DateTimeField(blank=True, null=True, db_index=True)
    locked_by = models.CharField(max_length=128, blank=True, null=True)

    started_at = models.DateTimeField(blank=True, null=True)
    finished_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['status', 'locked_at']),
        ]

    def __str__(self):
        return f"Job {self.id} for Report {self.report_id} [{self.status}]"

class AgentName(models.TextChoices):
    LISTENER = 'listener', 'Listener Agent'
    RECURRENCE = 'recurrence', 'Recurrence Agent'
    SEVERITY = 'severity', 'Severity Agent'
    PRIORITY = 'priority', 'Priority Agent'

class AgentOutput(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        'reports.Report',
        on_delete=models.CASCADE,
        related_name='agent_outputs',
        null=True,
        blank=True,
        db_index=True
    )
    issue = models.ForeignKey(
        'issues.ConsolidatedIssue',
        on_delete=models.CASCADE,
        related_name='agent_outputs_log',
        null=True,
        blank=True,
        db_index=True
    )
    agent_name = models.CharField(max_length=32, choices=AgentName.choices, db_index=True)
    prompt_version = models.CharField(max_length=32, default='v1.0')
    model_name = models.CharField(max_length=64, default='gemini-2.5-flash')
    input_hash = models.CharField(max_length=64, db_index=True)

    output_json = models.JSONField(default=dict)
    validation_status = models.CharField(max_length=32, default='VALID')  # VALID, FALLBACK, INVALID
    latency_ms = models.IntegerField(default=0)
    token_count = models.IntegerField(default=0)
    error = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['agent_name', 'created_at']),
            models.Index(fields=['validation_status']),
        ]

    def __str__(self):
        return f"{self.agent_name} output ({self.validation_status}) at {self.created_at}"

class ReviewQueueItem(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    report = models.ForeignKey(
        'reports.Report',
        on_delete=models.CASCADE,
        related_name='review_queue_entries'
    )
    suggested_issue = models.ForeignKey(
        'issues.ConsolidatedIssue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='candidate_review_entries'
    )
    suggested_action = models.CharField(max_length=32, default='MERGE')
    confidence_score = models.FloatField(default=0.5)
    similarity_score = models.FloatField(default=0.5)
    reasoning = models.TextField()

    status = models.CharField(max_length=32, default='PENDING', db_index=True)  # PENDING, RESOLVED, DISMISSED
    decision = models.CharField(max_length=32, blank=True, null=True)
    decision_notes = models.TextField(blank=True, null=True)
    officer_name = models.CharField(max_length=128, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"REV-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id}: Report {self.report_id} ({self.status})"
