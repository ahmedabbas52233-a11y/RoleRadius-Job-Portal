from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .engine import get_matched_jobs_for_candidate, get_matched_candidates_for_job
from jobs.models import Job
from jobs.serializers import JobListSerializer
from accounts.models import User
from accounts.permissions import IsCandidate, IsRecruiter






class MatchedJobsView(APIView):
    """Return top matched jobs for the logged-in candidate."""
    permission_classes = [IsCandidate]

    def get(self, request):
        top_n = int(request.query_params.get('top', 10))
        min_score = float(request.query_params.get('min_score', 10.0))
        results = get_matched_jobs_for_candidate(request.user, top_n=top_n, min_score=min_score)
        data = []
        for item in results:
            job_data = JobListSerializer(item['job'], context={'request': request}).data
            job_data['match_score'] = item['score']
            data.append(job_data)
        return Response({'count': len(data), 'results': data})


class MatchedCandidatesView(APIView):
    """Return top matched candidates for a recruiter's job."""
    permission_classes = [IsRecruiter]

    def get(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id, recruiter=request.user)
        top_n = int(request.query_params.get('top', 20))
        min_score = float(request.query_params.get('min_score', 15.0))
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
                'open_to_work': profile.open_to_work,
            })
        return Response({'count': len(data), 'results': data})
