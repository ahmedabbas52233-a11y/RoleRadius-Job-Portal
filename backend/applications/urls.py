from django.urls import path
from . import views

urlpatterns = [
    # ── Candidate stats (MUST be before any <uuid:pk> pattern) ───────────────
    path('my/stats/', views.CandidateDashboardStatsView.as_view(), name='candidate_stats'),
    path('recruiter/stats/', views.RecruiterDashboardStatsView.as_view(), name='recruiter_stats'),

    # ── Candidate applications ─────────────────────────────────────────────
    path('my/', views.CandidateApplicationsView.as_view(), name='my_applications'),
    path('my/<uuid:pk>/', views.CandidateApplicationDetailView.as_view(), name='application_detail'),
    path('my/<uuid:pk>/withdraw/', views.WithdrawApplicationView.as_view(), name='withdraw_application'),

    # ── Apply to a job ──────────────────────────────────────────────────────
    path('apply/<uuid:job_id>/', views.ApplyToJobView.as_view(), name='apply_to_job'),

    # ── Recruiter ──────────────────────────────────────────────────────────
    path('job/<uuid:job_id>/', views.JobApplicationsView.as_view(), name='job_applications'),
    path('<uuid:pk>/status/', views.UpdateApplicationStatusView.as_view(), name='update_status'),
]
