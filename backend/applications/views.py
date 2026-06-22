import logging

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db import transaction, models

from .models import Application, ApplicationStatusHistory
from .serializers import (
    ApplicationCreateSerializer, ApplicationCandidateSerializer,
    ApplicationRecruiterSerializer, ApplicationStatusUpdateSerializer
)
from jobs.models import Job
from accounts.models import User
from accounts.permissions import IsCandidate, IsRecruiter

logger = logging.getLogger('roleradius')


class ApplyToJobView(APIView):
    permission_classes = [IsCandidate]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic   # Both Application + StatusHistory succeed or both roll back
    def post(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id, is_active=True)
        serializer = ApplicationCreateSerializer(
            data=request.data,
            context={'request': request, 'job': job}
        )
        serializer.is_valid(raise_exception=True)

        match_score = None
        try:
            from matching.engine import compute_match_score
            match_score = compute_match_score(request.user, job)
        except Exception as exc:
            logger.warning('Match score failed for user %s / job %s: %s', request.user.id, job_id, exc)

        application = serializer.save(
            job=job,
            candidate=request.user,
            match_score=match_score
        )

        # Link candidate's stored CV if no new file uploaded
        if not application.cv:
            try:
                profile = request.user.candidate_profile
                if profile.cv:
                    application.cv_url = profile.cv.url
                    application.save(update_fields=['cv_url'])
            except Exception:
                pass

        ApplicationStatusHistory.objects.create(
            application=application,
            from_status='',
            to_status=Application.PENDING,
            note='Application submitted',
            changed_by=request.user,
        )

        return Response(
            ApplicationCandidateSerializer(application).data,
            status=status.HTTP_201_CREATED
        )


class WithdrawApplicationView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request, pk):
        application = get_object_or_404(Application, pk=pk, candidate=request.user)
        if application.status in [Application.OFFERED, Application.REJECTED]:
            return Response({'detail': 'Cannot withdraw a concluded application.'}, status=400)
        old_status = application.status
        application.status = Application.WITHDRAWN
        application.save(update_fields=['status'])
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=Application.WITHDRAWN,
            note='Withdrawn by candidate',
            changed_by=request.user,
        )
        return Response({'detail': 'Application withdrawn.'})


class CandidateApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationCandidateSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):
        qs = Application.objects.filter(
            candidate=self.request.user
        ).select_related('job__recruiter__recruiter_profile').prefetch_related('history')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class CandidateApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = ApplicationCandidateSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):
        return Application.objects.filter(
            candidate=self.request.user
        ).prefetch_related('history')


class JobApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationRecruiterSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        job = get_object_or_404(Job, pk=self.kwargs['job_id'], recruiter=self.request.user)
        qs = Application.objects.filter(job=job).select_related(
            'candidate__candidate_profile'
        ).prefetch_related('history').order_by('-match_score', '-applied_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class UpdateApplicationStatusView(APIView):
    permission_classes = [IsRecruiter]

    def patch(self, request, pk):
        application = get_object_or_404(
            Application, pk=pk, job__recruiter=request.user
        )
        serializer = ApplicationStatusUpdateSerializer(
            application, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        old_status = application.status
        note = serializer.validated_data.pop('note', '')
        serializer.save()
        if old_status != application.status:
            ApplicationStatusHistory.objects.create(
                application=application,
                from_status=old_status,
                to_status=application.status,
                note=note,
                changed_by=request.user,
            )
        return Response(ApplicationRecruiterSerializer(application).data)


class RecruiterDashboardStatsView(APIView):
    permission_classes = [IsRecruiter]

    def get(self, request):
        from django.db.models import Count
        jobs = Job.objects.filter(recruiter=request.user)
        applications = Application.objects.filter(job__recruiter=request.user)

        # Single aggregate query instead of one COUNT per status choice
        counts_by_status = dict(
            applications.values('status').annotate(n=Count('id')).values_list('status', 'n')
        )
        status_breakdown = {
            choice[0]: counts_by_status.get(choice[0], 0)
            for choice in Application.STATUS_CHOICES
        }

        # Single aggregate query instead of two separate .count() calls
        job_counts = jobs.aggregate(total=Count('id'), active=Count('id', filter=models.Q(is_active=True)))

        recent = ApplicationRecruiterSerializer(
            applications.select_related(
                'candidate__candidate_profile', 'job'
            ).order_by('-applied_at')[:5],
            many=True
        ).data
        return Response({
            'total_jobs':         job_counts['total'],
            'active_jobs':        job_counts['active'],
            'total_applications': sum(status_breakdown.values()),
            'status_breakdown':   status_breakdown,
            'recent_applications': recent,
        })


class CandidateDashboardStatsView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request):
        from django.db.models import Count
        applications = Application.objects.filter(candidate=request.user)

        # Single aggregate query instead of one COUNT per status choice
        counts_by_status = dict(
            applications.values('status').annotate(n=Count('id')).values_list('status', 'n')
        )
        status_breakdown = {
            choice[0]: counts_by_status.get(choice[0], 0)
            for choice in Application.STATUS_CHOICES
        }
        return Response({
            'total_applications': sum(status_breakdown.values()),
            'status_breakdown':   status_breakdown,
        })
