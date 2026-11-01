import uuid
from django.db import models
from django.conf import settings

class NotificationType(models.TextChoices):
    STATUS_UPDATE = 'STATUS_UPDATE', 'Status Update'
    CONSOLIDATED = 'CONSOLIDATED', 'Consolidated Into Issue'
    ASSIGNED = 'ASSIGNED', 'Assigned to Bureau'
    RESOLVED = 'RESOLVED', 'Issue Resolved'
    AI_REVIEW = 'AI_REVIEW', 'Routed to Human Review'

class Notification(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    notification_type = models.CharField(
        max_length=32,
        choices=NotificationType.choices,
        default=NotificationType.STATUS_UPDATE
    )
    issue = models.ForeignKey(
        'issues.ConsolidatedIssue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_notifications'
    )
    report = models.ForeignKey(
        'reports.Report',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='report_notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"NOTIF-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({'Read' if self.is_read else 'Unread'})"
