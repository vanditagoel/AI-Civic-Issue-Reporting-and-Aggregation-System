import uuid
from django.db import models
from django.conf import settings

class CivicCategory(models.TextChoices):
    ROADS_BRIDGES = 'Roads & Bridges', 'Roads & Bridges'
    SANITATION = 'Sanitation & Solid Waste', 'Sanitation & Solid Waste'
    WATER_DRAINAGE = 'Water & Drainage', 'Water & Drainage'
    STREETLIGHTS = 'Streetlights & Electrical', 'Streetlights & Electrical'
    PUBLIC_SAFETY = 'Public Safety & Hazards', 'Public Safety & Hazards'
    PARKS_SPACES = 'Parks & Public Spaces', 'Parks & Public Spaces'
    TRAFFIC_SIGNAGE = 'Traffic & Signage', 'Traffic & Signage'

class ReportStatus(models.TextChoices):
    PENDING_ANALYSIS = 'PENDING_ANALYSIS', 'Pending Analysis'
    PROCESSED = 'PROCESSED', 'Processed'
    ASSOCIATED = 'ASSOCIATED', 'Associated with Issue'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    RESOLVED = 'RESOLVED', 'Resolved'
    REJECTED = 'REJECTED', 'Rejected'

class Report(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports',
        db_index=True
    )
    citizen_name = models.CharField(max_length=255)
    citizen_email = models.EmailField()
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=64, choices=CivicCategory.choices, db_index=True)
    address = models.CharField(max_length=512)
    ward = models.CharField(max_length=128, db_index=True)
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    photo_url = models.URLField(blank=True, null=True)
    citizen_urgency = models.CharField(max_length=32, default='MEDIUM')
    status = models.CharField(
        max_length=32,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING_ANALYSIS,
        db_index=True
    )

    # ForeignKey to ConsolidatedIssue
    consolidated_issue = models.ForeignKey(
        'issues.ConsolidatedIssue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports',
        db_index=True
    )

    # Structured JSON AI outputs
    listener_output = models.JSONField(blank=True, null=True)
    recurrence_output = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['ward', 'created_at']),
            models.Index(fields=['consolidated_issue', 'created_at']),
        ]
        constraints = [
            # Check constraint for valid status values
            models.CheckConstraint(
                condition=models.Q(status__in=[s[0] for s in ReportStatus.choices]),
                name='check_valid_report_status'
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id}: {self.title} ({self.status})"
