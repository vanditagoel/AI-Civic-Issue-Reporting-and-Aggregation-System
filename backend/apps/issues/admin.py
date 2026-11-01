from django.contrib import admin
from .models import ConsolidatedIssue, IssueActivity, IssueComment

@admin.register(ConsolidatedIssue)
class ConsolidatedIssueAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'ward', 'priority_tier', 'priority_score', 'status', 'reports_count']
    list_filter = ['status', 'priority_tier', 'category', 'ward']
    search_fields = ['id', 'title', 'description', 'address']

@admin.register(IssueActivity)
class IssueActivityAdmin(admin.ModelAdmin):
    list_display = ['issue', 'timestamp', 'actor', 'action', 'activity_type']
    list_filter = ['activity_type']

@admin.register(IssueComment)
class IssueCommentAdmin(admin.ModelAdmin):
    list_display = ['issue', 'author', 'role', 'timestamp', 'is_internal']
