from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .engine import get_matched_jobs_for_candidate, get_matched_candidates_for_job
from jobs.models import Job
from jobs.serializers import JobListSerializer
from accounts.permissions import IsCandidate, IsRecruiter


def _parse_int_param(request, name, default, lo, hi):
    """Parse + clamp an int query param. Never raises -- bad input just falls back to default."""
    raw = request.query_params.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


def _parse_float_param(request, name, default, lo, hi):
    """Parse + clamp a float query param. Never raises -- bad input just falls back to default."""
    raw = request.query_params.get(name)
    if raw is None:
        return default
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


class MatchedJobsView(APIView):
    """Return top matched jobs for the logged-in candidate, with match explainability."""
    permission_classes = [IsCandidate]

    def get(self, request):
        top_n = _parse_int_param(request, 'top', default=10, lo=1, hi=50)
        min_score = _parse_float_param(request, 'min_score', default=10.0, lo=0.0, hi=100.0)
        results = get_matched_jobs_for_candidate(request.user, top_n=top_n, min_score=min_score)
        data = []
        for item in results:
            # Explicit dict() wrap: DRF's serializer.data (a ReturnDict) is
            # itself a dict subclass at runtime, but some stub versions type
            # it ambiguously enough that string-key assignment below reads
            # as invalid to the type checker. This has zero runtime effect,
            # it just gives Pylance/Pyright an unambiguous concrete dict.
            job_data = dict(JobListSerializer(item['job'], context={'request': request}).data)
            job_data['match_score'] = item['score']
            job_data['matched_skills'] = item['matched_skills']
            job_data['missing_skills'] = item['missing_skills']
            job_data['location_compatible'] = item['location_compatible']
            job_data['experience_fit'] = item['experience_fit']
            job_data['job_type_compatible'] = item['job_type_compatible']
            job_data['salary_compatible'] = item['salary_compatible']
            data.append(job_data)
        return Response({'count': len(data), 'results': data})


class MatchedCandidatesView(APIView):
    """Return top matched candidates for a recruiter's job, with match explainability."""
    permission_classes = [IsRecruiter]

    def get(self, request, job_id):
        job = get_object_or_404(Job.objects.manageable_by(request.user), pk=job_id)
        top_n = _parse_int_param(request, 'top', default=20, lo=1, hi=100)
        min_score = _parse_float_param(request, 'min_score', default=15.0, lo=0.0, hi=100.0)
        results = get_matched_candidates_for_job(job, top_n=top_n, min_score=min_score)
        data = []
        for item in results:
            profile = item['profile']
            data.append({
                'user_id': str(profile.user.id),
                'full_name': profile.user.full_name,
                'headline': profile.headline,
                'location': profile.location,
                'skills': profile.skills,
                'experience_years': profile.experience_years,
                'avatar_url': profile.avatar.url if profile.avatar else None,
                'match_score': item['score'],
                'matched_skills': item['matched_skills'],
                'missing_skills': item['missing_skills'],
                'location_compatible': item['location_compatible'],
                'experience_fit': item['experience_fit'],
                'job_type_compatible': item['job_type_compatible'],
                'salary_compatible': item['salary_compatible'],
                'open_to_work': profile.open_to_work,
            })
        return Response({'count': len(data), 'results': data})
