from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('CivicLens Profile', {'fields': ('role', 'ward', 'department', 'avatar_url', 'phone_number')}),
    )
    list_display = ['username', 'email', 'role', 'ward', 'is_staff']
    list_filter = ['role', 'ward', 'is_staff']
