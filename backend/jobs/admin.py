from django.contrib import admin
from .models import Job, SavedJob


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company_name', 'job_type', 'work_mode', 'location', 'is_active', 'created_at']
    list_filter = ['job_type', 'work_mode', 'experience_level', 'is_active']
    search_fields = ['title', 'company_name', 'location']
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    ordering = ['-created_at']


admin.site.register(SavedJob)
