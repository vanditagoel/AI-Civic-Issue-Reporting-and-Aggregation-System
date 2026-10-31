from django.db import models

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
    id = models.CharField(max_length=32, primary_key=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=64, db_index=True)
    description = models.TextField()
    summary = models.CharField(max_length=512)
    address = models.CharField(max_length=512)
    ward = models.CharField(max_length=128, db_index=True)
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    
    status = models.CharField(max_length=32, choices=IssueStatus.choices, default=IssueStatus.NEW, db_index=True)
    priority_tier = models.CharField(max_length=32, choices=PriorityTier.choices, default=PriorityTier.P3_MEDIUM, db_index=True)
    priority_score = models.IntegerField(default=50, db_index=True)
    severity_score = models.IntegerField(default=50)
    severity_level = models.CharField(max_length=32, default='MEDIUM')
    assigned_department = models.CharField(max_length=128)
    
    reports_count = models.IntegerField(default=1)
    agent_outputs = models.JSONField(default=dict)
    
    first_reported_at = models.DateTimeField(auto_now_add=True)
    last_reported_at = models.DateTimeField(auto_now=True)
    estimated_resolution_days = models.IntegerField(default=3)

    class Meta:
        ordering = ['-priority_score', '-last_reported_at']
        indexes = [
            models.Index(fields=['priority_score', 'status']),
            models.Index(fields=['ward', 'priority_tier']),
        ]

    def __str__(self):
        return f"{self.id} [{self.priority_tier} - {self.priority_score}]: {self.title}"

class IssueActivity(models.Model):
    issue = models.ForeignKey(ConsolidatedIssue, on_delete=models.CASCADE, related_name='activities')
    timestamp = models.DateTimeField(auto_now_add=True)
    actor = models.CharField(max_length=128)
    action = models.CharField(max_length=128)
    details = models.TextField()
    activity_type = models.CharField(max_length=64)

class IssueComment(models.Model):
    issue = models.ForeignKey(ConsolidatedIssue, on_delete=models.CASCADE, related_name='comments')
    author = models.CharField(max_length=128)
    role = models.CharField(max_length=32, default='ADMIN')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(default=True)
