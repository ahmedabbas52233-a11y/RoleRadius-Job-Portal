from django.urls import path
from . import views

urlpatterns = [
    path('register/',         views.RegisterView.as_view(),              name='register'),
    path('login/',            views.LoginView.as_view(),                 name='login'),
    path('logout/',           views.LogoutView.as_view(),                name='logout'),
    path('token/refresh/',    views.TokenRefreshCookieView.as_view(),    name='token_refresh'),

    path('me/',               views.MeView.as_view(),                   name='me'),
    path('me/change-password/', views.ChangePasswordView.as_view(),     name='change_password'),

    path('verify-email/<str:token>/', views.VerifyEmailView.as_view(),  name='verify_email'),
    path('verify-email/resend/',      views.ResendVerificationEmailView.as_view(), name='resend_verification'),

    path('profile/candidate/',     views.CandidateProfileView.as_view(),  name='candidate_profile'),
    path('profile/candidate/cv/',  views.CVUploadView.as_view(),          name='cv_upload'),
    path('profile/recruiter/',     views.RecruiterProfileView.as_view(),  name='recruiter_profile'),

    path('password-reset/',          views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/',  views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    path('candidates/<uuid:user_id>/', views.PublicCandidateProfileView.as_view(), name='public_candidate'),
    path('recruiters/<uuid:user_id>/', views.PublicRecruiterProfileView.as_view(), name='public_recruiter'),
]
