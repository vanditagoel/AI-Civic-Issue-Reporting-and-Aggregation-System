from django.contrib import admin
from .models import ProcessingJob, AgentOutput, ReviewQueueItem

@admin.register(ProcessingJob)
class ProcessingJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'report', 'status', 'attempts', 'locked_at', 'created_at']
    list_filter = ['status']

@admin.register(AgentOutput)
class AgentOutputAdmin(admin.ModelAdmin):
    list_display = ['agent_name', 'validation_status', 'model_name', 'latency_ms', 'created_at']
    list_filter = ['agent_name', 'validation_status']

@admin.register(ReviewQueueItem)
class ReviewQueueItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'report', 'suggested_issue', 'suggested_action', 'confidence_score', 'status']
    list_filter = ['status', 'suggested_action']
