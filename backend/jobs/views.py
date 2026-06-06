from rest_framework import generics, filters, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, ChoiceFilter, BooleanFilter
from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as django_filters

from .models import Job, SavedJob
from .serializers import (
    JobListSerializer, JobDetailSerializer,
    JobCreateUpdateSerializer, SavedJobSerializer
)
from accounts.models import User
from accounts.permissions import IsCandidate, IsRecruiter, IsRecruiterOrReadOnly


class JobFilter(FilterSet):
    title = CharFilter(field_name='title', lookup_expr='icontains')
    location = CharFilter(field_name='location', lookup_expr='icontains')
    company = CharFilter(field_name='company_name', lookup_expr='icontains')
    category = CharFilter(field_name='category', lookup_expr='icontains')
    job_type = ChoiceFilter(choices=Job.JOB_TYPE_CHOICES)
    experience_level = ChoiceFilter(choices=Job.EXPERIENCE_CHOICES)
    work_mode = ChoiceFilter(choices=Job.WORK_MODE_CHOICES)
    salary_min = django_filters.NumberFilter(field_name='salary_min', lookup_expr='gte')
    salary_max = django_filters.NumberFilter(field_name='salary_max', lookup_expr='lte')
    is_active = BooleanFilter(field_name='is_active')

    class Meta:
        model = Job
        fields = ['job_type', 'experience_level', 'work_mode', 'is_active']


def _annotate_jobs(queryset, user):
    """
    Annotate job queryset to avoid N+1 queries.

    - application_count: annotated via SQL COUNT, zero extra queries
    - saved_ids / applied_ids: fetched once per request and passed via context
    """
    return queryset.annotate(
        application_count_annotated=Count('applications', distinct=True)
    ).select_related('recruiter__recruiter_profile')


class JobListView(generics.ListAPIView):
    serializer_class = JobListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = JobFilter
    search_fields = ['title', 'company_name', 'description', 'skills_required', 'location', 'category']
    ordering_fields = ['created_at', 'salary_min', 'views_count']
    ordering = ['-created_at']

    def get_queryset(self):
        return _annotate_jobs(
            Job.objects.filter(is_active=True),
            self.request.user
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        if self.request.user.is_authenticated and self.request.user.role == User.CANDIDATE:
            ctx['saved_ids'] = set(
                SavedJob.objects.filter(candidate=self.request.user)
                .values_list('job_id', flat=True)
            )
            ctx['applied_ids'] = set(
                self.request.user.applications.values_list('job_id', flat=True)
            )
        return ctx


class JobDetailView(generics.RetrieveAPIView):
    serializer_class = JobDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Job.objects.select_related('recruiter__recruiter_profile')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        if self.request.user.is_authenticated and self.request.user.role == User.CANDIDATE:
            job_id = self.kwargs.get('pk')
            ctx['saved_ids'] = set(
                SavedJob.objects.filter(candidate=self.request.user, job_id=job_id)
                .values_list('job_id', flat=True)
            )
            ctx['applied_ids'] = set(
                self.request.user.applications.filter(job_id=job_id)
                .values_list('job_id', flat=True)
            )
        return ctx

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class RecruiterJobListView(generics.ListAPIView):
    serializer_class = JobListSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return _annotate_jobs(
            Job.objects.filter(recruiter=self.request.user),
            self.request.user
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class JobCreateView(generics.CreateAPIView):
    serializer_class = JobCreateUpdateSerializer
    permission_classes = [IsRecruiter]

    def perform_create(self, serializer):
        recruiter_profile = self.request.user.recruiter_profile
        serializer.save(
            recruiter=self.request.user,
            company_name=recruiter_profile.company_name,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            JobDetailSerializer(serializer.instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class JobUpdateView(generics.UpdateAPIView):
    serializer_class = JobCreateUpdateSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(JobDetailSerializer(instance, context={'request': request}).data)


class JobDeleteView(generics.DestroyAPIView):
    """
    Soft-delete: sets is_active=False and deleted_at timestamp.
    Hard deletion would cascade-delete all linked applications and lose history.
    """
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)

    def perform_destroy(self, instance):
        from django.utils import timezone
        instance.is_active = False
        if hasattr(instance, 'deleted_at'):
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['is_active', 'deleted_at'])
        else:
            instance.save(update_fields=['is_active'])


class JobToggleActiveView(APIView):
    permission_classes = [IsRecruiter]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk, recruiter=request.user)
        job.is_active = not job.is_active
        job.save(update_fields=['is_active'])
        return Response({'is_active': job.is_active, 'id': str(job.id)})


class SaveJobView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != User.CANDIDATE:
            return Response({'detail': 'Only candidates can save jobs.'}, status=403)
        job = get_object_or_404(Job, pk=pk, is_active=True)
        saved, created = SavedJob.objects.get_or_create(candidate=request.user, job=job)
        if not created:
            saved.delete()
            return Response({'saved': False})
        return Response({'saved': True})


class SavedJobsListView(generics.ListAPIView):
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedJob.objects.filter(
            candidate=self.request.user
        ).select_related('job__recruiter__recruiter_profile')
