from rest_framework import serializers
from .models import Job, SavedJob


class JobListSerializer(serializers.ModelSerializer):
    salary_display    = serializers.SerializerMethodField()
    application_count = serializers.SerializerMethodField()
    is_saved          = serializers.SerializerMethodField()
    has_applied       = serializers.SerializerMethodField()
    recruiter_company = serializers.CharField(source='recruiter.recruiter_profile.company_name', read_only=True)
    recruiter_logo    = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company_name', 'company_logo', 'location',
            'job_type', 'experience_level', 'work_mode', 'salary_min',
            'salary_max', 'salary_currency', 'salary_display', 'category',
            'skills_required', 'tags', 'application_deadline', 'is_active',
            'is_expired', 'views_count', 'application_count', 'is_saved',
            'has_applied', 'recruiter_company', 'recruiter_logo', 'created_at',
        ]

    def get_salary_display(self, obj):
        return obj.get_salary_display()

    def get_application_count(self, obj):
        # Uses annotated value from queryset — zero extra DB queries
        return getattr(obj, 'application_count_annotated', None) \
               if hasattr(obj, 'application_count_annotated') \
               else obj.applications.count()

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_candidate:
            saved_ids = self.context.get('saved_ids')
            if saved_ids is not None:
                return obj.id in saved_ids          # O(1) set lookup — no DB hit
            return SavedJob.objects.filter(candidate=request.user, job=obj).exists()
        return False

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_candidate:
            applied_ids = self.context.get('applied_ids')
            if applied_ids is not None:
                return obj.id in applied_ids        # O(1) set lookup — no DB hit
            return obj.applications.filter(candidate=request.user).exists()
        return False

    def get_recruiter_logo(self, obj):
        try:
            logo = obj.recruiter.recruiter_profile.company_logo
            return logo.url if logo else None
        except Exception:
            return None


class JobDetailSerializer(JobListSerializer):
    class Meta(JobListSerializer.Meta):
        fields = JobListSerializer.Meta.fields + [
            'description', 'requirements', 'responsibilities', 'recruiter'
        ]


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        exclude = ['id', 'recruiter', 'company_name', 'views_count', 'deleted_at', 'created_at', 'updated_at']

    def validate_skills_required(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Skills must be a list.')
        return value

    def validate(self, data):
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError(
                    {'salary_min': 'Min salary cannot exceed max salary.'}
                )
        return data


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobListSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'saved_at']
