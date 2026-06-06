from django.urls import path
from . import views

urlpatterns = [
    path('jobs/', views.MatchedJobsView.as_view(), name='matched_jobs'),
    path('candidates/<uuid:job_id>/', views.MatchedCandidatesView.as_view(), name='matched_candidates'),
]
