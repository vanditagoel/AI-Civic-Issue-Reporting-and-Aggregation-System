from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'ward', 'citizen_name', 'status', 'consolidated_issue', 'created_at']
    list_filter = ['status', 'category', 'ward']
    search_fields = ['id', 'title', 'description', 'address', 'citizen_name']
