import logging

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db import transaction, models

from .models import Application, ApplicationStatusHistory, InterviewRound
from .serializers import (
    ApplicationCreateSerializer, ApplicationCandidateSerializer,
    ApplicationRecruiterSerializer, ApplicationStatusUpdateSerializer,
    InterviewRoundRecruiterSerializer, InterviewRoundCreateSerializer,
)
from jobs.models import Job
<<<<<<< Updated upstream
from accounts.permissions import IsCandidate, IsRecruiter
=======
from accounts.permissions import IsCandidate, IsRecruiter, CanManageJobs
>>>>>>> Stashed changes

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
        if application.status in Application.TERMINAL_STATUSES:
            return Response({'detail': 'Cannot withdraw a concluded application.'}, status=400)
        old_status = application.status
        # Declining an extended offer is a distinct, more meaningful outcome
        # than a generic withdrawal — keeps offer-acceptance-rate accurate.
        new_status = Application.OFFER_DECLINED if old_status == Application.OFFERED else Application.WITHDRAWN
        application.status = new_status
        application.save(update_fields=['status'])
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=new_status,
            note='Offer declined by candidate' if new_status == Application.OFFER_DECLINED else 'Withdrawn by candidate',
            changed_by=request.user,
        )
        return Response({'detail': 'Offer declined.' if new_status == Application.OFFER_DECLINED else 'Application withdrawn.'})


class CandidateApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationCandidateSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):
        qs = Application.objects.filter(
            candidate=self.request.user
        ).select_related('job__recruiter__recruiter_profile').prefetch_related('history', 'interview_rounds')
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
        ).prefetch_related('history', 'interview_rounds')


class JobApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationRecruiterSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        job = get_object_or_404(Job.objects.manageable_by(self.request.user), pk=self.kwargs['job_id'])
        qs = Application.objects.filter(job=job).select_related(
            'candidate__candidate_profile'
        ).prefetch_related('history', 'interview_rounds').order_by('-match_score', '-applied_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class UpdateApplicationStatusView(APIView):
    permission_classes = [IsRecruiter, CanManageJobs]

    def patch(self, request, pk):
        application = get_object_or_404(
            Application, pk=pk, job__in=Job.objects.manageable_by(request.user)
        )
        serializer = ApplicationStatusUpdateSerializer(
            application, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        old_status = application.status
        new_status = serializer.validated_data.get('status', old_status)
        if not application.can_transition_to(new_status):
            return Response(
                {'detail': f'Cannot move from "{old_status}" to "{new_status}".'},
                status=400,
            )
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


class BulkUpdateApplicationStatusView(APIView):
    """
    Move many applications to a new status in one call.
    Body: {"application_ids": [...], "status": "rejected", "note": "..."}
    Every ID is re-verified as belonging to a job the recruiter can manage
    (their own job, or a teammate's job in the same Company -- see
    Job.objects.manageable_by()), never trusting the client-supplied list.
    The same transition rules as the single-application endpoint apply per
    application — an application that can't legally make the move is
    skipped and reported back, not silently forced or allowed to break the
    whole batch.
    """
<<<<<<< Updated upstream
    permission_classes = [IsRecruiter]
=======
    permission_classes = [IsRecruiter, CanManageJobs]
>>>>>>> Stashed changes

    @transaction.atomic
    def patch(self, request):
        application_ids = request.data.get('application_ids') or []
        new_status = request.data.get('status')
        note = request.data.get('note', '')

        if not isinstance(application_ids, list) or not application_ids:
            return Response({'detail': 'application_ids must be a non-empty list.'}, status=400)
        valid_statuses = [c[0] for c in Application.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'detail': f'Invalid status. Choose from: {valid_statuses}'}, status=400)

        applications = list(
            Application.objects.filter(
                id__in=application_ids, job__in=Job.objects.manageable_by(request.user)
            )
        )
        found_ids = {str(a.id) for a in applications}
        not_found = [str(i) for i in application_ids if str(i) not in found_ids]

        updated, skipped = [], []
        for application in applications:
            old_status = application.status
            if not application.can_transition_to(new_status):
                skipped.append({'id': str(application.id), 'reason': f'Cannot move from "{old_status}" to "{new_status}".'})
                continue
            if old_status != new_status:
                application.status = new_status
                application.save(update_fields=['status'])
                ApplicationStatusHistory.objects.create(
                    application=application,
                    from_status=old_status,
                    to_status=new_status,
                    note=note,
                    changed_by=request.user,
                )
            updated.append(str(application.id))

        return Response({
            'updated': updated,
            'skipped': skipped,
            'not_found': not_found,
        })


class RecruiterDashboardStatsView(APIView):
    permission_classes = [IsRecruiter]

    def get(self, request):
        from django.db.models import Count
        jobs = Job.objects.manageable_by(request.user)
        applications = Application.objects.filter(job__in=jobs)

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


class InterviewRoundListCreateView(APIView):
    """
    List or create interview rounds for one application. Recruiter-only —
    scoped to applications on jobs the requesting recruiter can manage
    (their own job, or a teammate's job in the same Company), never
    trusting a client-supplied application ID without that check.
    """
    permission_classes = [IsRecruiter]

    def get(self, request, application_pk):
        application = get_object_or_404(
            Application, pk=application_pk, job__in=Job.objects.manageable_by(request.user)
        )
        rounds = application.interview_rounds.all()
        return Response(InterviewRoundRecruiterSerializer(rounds, many=True).data)

    def post(self, request, application_pk):
<<<<<<< Updated upstream
=======
        # GET stays open to a team's read-only VIEWER role (they should be
        # able to see the interview schedule); only creating a round is
        # gated -- checked explicitly here rather than at class level,
        # since permission_classes on an APIView applies to every method.
        profile = request.user.recruiter_profile
        if not profile.can_manage_jobs:
            return Response(
                {'detail': 'Your role on this team is read-only and cannot make changes.'},
                status=status.HTTP_403_FORBIDDEN
            )
>>>>>>> Stashed changes
        application = get_object_or_404(
            Application, pk=application_pk, job__in=Job.objects.manageable_by(request.user)
        )
        serializer = InterviewRoundCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # round_number is always server-assigned (next available number for
        # this application), never taken from client input — prevents a
        # client from creating gaps, duplicates, or an out-of-order sequence.
        with transaction.atomic():
            last_round = application.interview_rounds.order_by('-round_number').first()
            next_number = (last_round.round_number + 1) if last_round else 1
            round_obj = serializer.save(application=application, round_number=next_number)

        return Response(
            InterviewRoundRecruiterSerializer(round_obj).data,
            status=status.HTTP_201_CREATED
        )


class InterviewRoundDetailView(APIView):
    """Update (outcome/feedback/score/reschedule) or delete a single interview round."""
<<<<<<< Updated upstream
    permission_classes = [IsRecruiter]
=======
    permission_classes = [IsRecruiter, CanManageJobs]
>>>>>>> Stashed changes

    def _get_round(self, request, application_pk, round_pk):
        return get_object_or_404(
            InterviewRound,
            pk=round_pk, application_id=application_pk,
            application__job__in=Job.objects.manageable_by(request.user)
        )

    def patch(self, request, application_pk, round_pk):
        round_obj = self._get_round(request, application_pk, round_pk)
        serializer = InterviewRoundRecruiterSerializer(round_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, application_pk, round_pk):
        round_obj = self._get_round(request, application_pk, round_pk)
        round_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
