from rest_framework import serializers
from .models import Application, ApplicationStatusHistory
from jobs.serializers import JobListSerializer
from accounts.serializers import CandidateProfileSerializer, UserSerializer


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'from_status', 'to_status', 'note', 'changed_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['cover_letter', 'cv']

    def validate(self, data):
        request = self.context['request']
        job = self.context['job']
        if Application.objects.filter(job=job, candidate=request.user).exists():
            raise serializers.ValidationError('You have already applied to this job.')
        return data


class ApplicationCandidateSerializer(serializers.ModelSerializer):
    """Serializer for candidate viewing their own applications."""
    job = JobListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    history = ApplicationStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'status', 'status_display', 'status_step',
            'cover_letter', 'match_score', 'applied_at', 'updated_at',
            'interview_date', 'history'
        ]
        read_only_fields = ['status', 'match_score', 'applied_at', 'updated_at']


class ApplicationRecruiterSerializer(serializers.ModelSerializer):
    """Serializer for recruiters viewing applications to their jobs."""
    candidate = UserSerializer(read_only=True)
    candidate_profile = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    cv_download_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'candidate', 'candidate_profile', 'status', 'status_display',
            'status_step', 'cover_letter', 'match_score', 'recruiter_notes',
            'rejection_reason', 'interview_date', 'applied_at', 'updated_at',
            'history', 'cv_download_url'
        ]

    def get_candidate_profile(self, obj):
        try:
            profile = obj.candidate.candidate_profile
            return {
                'id': str(profile.id),
                'headline': profile.headline,
                'location': profile.location,
                'skills': profile.skills,
                'experience_years': profile.experience_years,
                'avatar_url': profile.avatar.url if profile.avatar else None,
            }
        except Exception:
            return None

    def get_cv_download_url(self, obj):
        if obj.cv:
            return obj.cv.url
        try:
            cv = obj.candidate.candidate_profile.cv
            return cv.url if cv else None
        except Exception:
            return None


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    note = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Application
        fields = ['status', 'recruiter_notes', 'rejection_reason', 'interview_date', 'note']

    def validate_status(self, value):
        valid = [c[0] for c in Application.STATUS_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f'Invalid status. Choose from: {valid}')
        return value
