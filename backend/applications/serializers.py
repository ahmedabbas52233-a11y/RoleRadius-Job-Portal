from rest_framework import serializers
from .models import Application, ApplicationStatusHistory, InterviewRound
from jobs.serializers import JobListSerializer
from accounts.serializers import UserSerializer


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'from_status', 'to_status', 'note', 'changed_at']


class InterviewRoundRecruiterSerializer(serializers.ModelSerializer):
    """Full view -- includes private scorecard fields (feedback, score, interviewer_name)."""
    round_type_display = serializers.CharField(source='get_round_type_display', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)

    class Meta:
        model = InterviewRound
        fields = [
            'id', 'round_number', 'round_type', 'round_type_display',
            'scheduled_at', 'interviewer_name', 'feedback', 'score',
            'outcome', 'outcome_display', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'round_number', 'created_at', 'updated_at']


class InterviewRoundCandidateSerializer(serializers.ModelSerializer):
    """
    Candidate-facing view -- deliberately excludes feedback, score, and
    interviewer_name. A candidate should be able to see their own
    interview schedule and outcome, not the recruiter's private scorecard
    or who specifically is interviewing them internally.
    """
    round_type_display = serializers.CharField(source='get_round_type_display', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)

    class Meta:
        model = InterviewRound
        fields = [
            'id', 'round_number', 'round_type', 'round_type_display',
            'scheduled_at', 'outcome', 'outcome_display',
        ]


class InterviewRoundCreateSerializer(serializers.ModelSerializer):
    """Used for POST (create) -- round_number is auto-assigned server-side, never client-supplied."""
    class Meta:
        model = InterviewRound
        fields = ['round_type', 'scheduled_at', 'interviewer_name']


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


def _get_match_breakdown(candidate, job):
    """
    Shared helper: live-recompute the explainable match breakdown for one
    application. This is a cheap 2-document TF-IDF fit (see
    matching/engine.py docstring) — fine to run per-row on a paginated
    list, but if PAGE_SIZE is ever raised substantially this should move
    to a prefetched/batched computation instead of one fit per row.
    """
    try:
        from matching.engine import compute_match_breakdown
        return compute_match_breakdown(candidate, job)
    except Exception:
        return None


class ApplicationCandidateSerializer(serializers.ModelSerializer):
    """Serializer for candidate viewing their own applications."""
    job = JobListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    match_breakdown = serializers.SerializerMethodField()
    interview_rounds = InterviewRoundCandidateSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'status', 'status_display', 'status_step',
            'cover_letter', 'match_score', 'match_breakdown', 'applied_at', 'updated_at',
            'interview_date', 'history', 'interview_rounds'
        ]
        read_only_fields = ['status', 'match_score', 'applied_at', 'updated_at']

    def get_match_breakdown(self, obj):
        return _get_match_breakdown(obj.candidate, obj.job)


class ApplicationRecruiterSerializer(serializers.ModelSerializer):
    """Serializer for recruiters viewing applications to their jobs."""
    candidate = UserSerializer(read_only=True)
    candidate_profile = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    cv_download_url = serializers.SerializerMethodField()
    match_breakdown = serializers.SerializerMethodField()
    interview_rounds = InterviewRoundRecruiterSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'candidate', 'candidate_profile', 'status', 'status_display',
            'status_step', 'cover_letter', 'match_score', 'match_breakdown', 'recruiter_notes',
            'rejection_reason', 'interview_date', 'applied_at', 'updated_at',
            'history', 'cv_download_url', 'interview_rounds'
        ]

    def get_candidate_profile(self, obj):
        try:
            profile = obj.candidate.candidate_profile
            return {
                'id': str(profile.id),
                'headline': profile.headline,
                'bio': profile.bio,
                'location': profile.location,
                'skills': profile.skills,
                'experience_years': profile.experience_years,
                'education': profile.education,
                'experience': profile.experience,
                'linkedin': profile.linkedin,
                'github': profile.github,
                'website': profile.website,
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

    def get_match_breakdown(self, obj):
        return _get_match_breakdown(obj.candidate, obj.job)


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
