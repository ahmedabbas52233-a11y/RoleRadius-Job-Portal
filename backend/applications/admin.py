from django.contrib import admin
from .models import Application, ApplicationStatusHistory


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'job', 'status', 'match_score', 'applied_at']
    list_filter = ['status']
    search_fields = ['candidate__email', 'job__title']
    readonly_fields = ['match_score', 'applied_at', 'updated_at']


admin.site.register(ApplicationStatusHistory)
