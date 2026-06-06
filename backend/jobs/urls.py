from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('', views.JobListView.as_view(), name='job_list'),
    path('<uuid:pk>/', views.JobDetailView.as_view(), name='job_detail'),

    # Recruiter management
    path('my/', views.RecruiterJobListView.as_view(), name='my_jobs'),
    path('create/', views.JobCreateView.as_view(), name='job_create'),
    path('<uuid:pk>/update/', views.JobUpdateView.as_view(), name='job_update'),
    path('<uuid:pk>/delete/', views.JobDeleteView.as_view(), name='job_delete'),
    path('<uuid:pk>/toggle/', views.JobToggleActiveView.as_view(), name='job_toggle'),

    # Candidate saved jobs
    path('<uuid:pk>/save/', views.SaveJobView.as_view(), name='save_job'),
    path('saved/', views.SavedJobsListView.as_view(), name='saved_jobs'),
]
