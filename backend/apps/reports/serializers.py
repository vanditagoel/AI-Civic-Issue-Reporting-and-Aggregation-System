from rest_framework import serializers
from .models import Report, CivicCategory, ReportStatus

class ReportSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(read_only=True)
    citizen_email = serializers.EmailField(read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'citizen_name', 'citizen_email', 'title', 'description',
            'category', 'address', 'ward', 'latitude', 'longitude',
            'photo_url', 'citizen_urgency', 'status', 'consolidated_issue',
            'listener_output', 'recurrence_output', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'consolidated_issue', 'listener_output', 'recurrence_output', 'created_at', 'updated_at']

class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'title', 'description', 'category', 'address', 'ward',
            'latitude', 'longitude', 'photo_url', 'citizen_urgency'
        ]
