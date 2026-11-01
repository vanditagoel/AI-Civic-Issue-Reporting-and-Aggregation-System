import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class IssueStatus(models.TextChoices):
    NEW = 'NEW', 'New'
    TRIAGED = 'TRIAGED', 'Triaged'
    IN_REVIEW = 'IN_REVIEW', 'In Review'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    RESOLVED = 'RESOLVED', 'Resolved'
    CLOSED = 'CLOSED', 'Closed'

class PriorityTier(models.TextChoices):
    P1_CRITICAL = 'P1_CRITICAL', 'P1 Critical'
    P2_HIGH = 'P2_HIGH', 'P2 High'
    P3_MEDIUM = 'P3_MEDIUM', 'P3 Medium'
    P4_LOW = 'P4_LOW', 'P4 Low'

class ConsolidatedIssue(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=64, db_index=True)
    description = models.TextField()
    summary = models.CharField(max_length=512)
    address = models.CharField(max_length=512)
    ward = models.CharField(max_length=128, db_index=True)
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)

    status = models.CharField(
        max_length=32,
        choices=IssueStatus.choices,
        default=IssueStatus.NEW,
        db_index=True
    )
    priority_tier = models.CharField(
        max_length=32,
        choices=PriorityTier.choices,
        default=PriorityTier.P3_MEDIUM,
        db_index=True
    )
    priority_score = models.IntegerField(
        default=50,
        db_index=True,
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    severity_score = models.IntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    severity_level = models.CharField(max_length=32, default='MEDIUM')
    assigned_department = models.CharField(max_length=128, default='Public Works Department')

    reports_count = models.IntegerField(default=1)
    agent_outputs = models.JSONField(default=dict, blank=True)
    score_breakdown = models.JSONField(default=dict, blank=True)

    first_reported_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_reported_at = models.DateTimeField(auto_now=True, db_index=True)
    estimated_resolution_days = models.IntegerField(default=3)

    class Meta:
        ordering = ['-priority_score', '-last_reported_at']
        indexes = [
            models.Index(fields=['status', 'priority_score']),
            models.Index(fields=['category', 'ward']),
            models.Index(fields=['first_reported_at']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(priority_score__gte=1) & models.Q(priority_score__lte=100),
                name='check_valid_priority_score_range'
            ),
            models.CheckConstraint(
                condition=models.Q(severity_score__gte=1) & models.Q(severity_score__lte=100),
                name='check_valid_severity_score_range'
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=[s[0] for s in IssueStatus.choices]),
                name='check_valid_issue_status'
            )
        ]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"ISSUE-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} [{self.priority_tier} - Score {self.priority_score}]: {self.title}"

class IssueActivity(models.Model):
    issue = models.ForeignKey(ConsolidatedIssue, on_delete=models.CASCADE, related_name='activities', db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.CharField(max_length=128)
    action = models.CharField(max_length=128)
    details = models.TextField()
    activity_type = models.CharField(max_length=64, default='SYSTEM')

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['issue', 'timestamp']),
        ]

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.actor}: {self.action}"

class IssueComment(models.Model):
    issue = models.ForeignKey(ConsolidatedIssue, on_delete=models.CASCADE, related_name='comments', db_index=True)
    author = models.CharField(max_length=128)
    role = models.CharField(max_length=32, default='ADMIN')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(default=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.author} on {self.issue_id}: {self.text[:30]}"
