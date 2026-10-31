from django.db import models
from django.contrib.auth.models import User

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
    id = models.CharField(max_length=32, primary_key=True)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    citizen_name = models.CharField(max_length=255)
    citizen_email = models.EmailField()
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=64, choices=CivicCategory.choices)
    address = models.CharField(max_length=512)
    ward = models.CharField(max_length=128)
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    photo_url = models.URLField(blank=True, null=True)
    citizen_urgency = models.CharField(max_length=32, default='MEDIUM')
    status = models.CharField(max_length=32, choices=ReportStatus.choices, default=ReportStatus.PENDING_ANALYSIS)
    
    # ForeignKey to ConsolidatedIssue
    consolidated_issue = models.ForeignKey(
        'issues.ConsolidatedIssue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    
    # Structured JSON AI outputs
    listener_output = models.JSONField(blank=True, null=True)
    recurrence_output = models.JSONField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ward', 'category']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.id}: {self.title}"
