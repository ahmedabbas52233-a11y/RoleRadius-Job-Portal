import logging

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404

from .models import User, CandidateProfile, RecruiterProfile, PasswordResetToken
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    CandidateProfileSerializer, CandidateProfileUpdateSerializer,
    RecruiterProfileSerializer, RecruiterProfileUpdateSerializer,
    ChangePasswordSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .throttles import LoginRateThrottle, PasswordResetRateThrottle, RegisterRateThrottle
from .utils import extract_text_from_cv, send_verification_email, make_cookie_response, clear_cookie_response

logger = logging.getLogger('roleradius')


def axes_lockout_response(request, credentials, *args, **kwargs):
    """Called by django-axes when an account is locked out."""
    from rest_framework.response import Response
    return Response(
        {'detail': 'Account temporarily locked after too many failed attempts. Try again in 30 minutes.'},
        status=status.HTTP_429_TOO_MANY_REQUESTS
    )


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email (non-blocking)
        send_verification_email(user)

        refresh = RefreshToken.for_user(user)
        response = Response({
            'user': UserSerializer(user).data,
            'detail': 'Account created. Please verify your email.'
        }, status=status.HTTP_201_CREATED)
        return make_cookie_response(response, refresh)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        response = Response({'user': UserSerializer(user).data})
        return make_cookie_response(response, refresh)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.JWT_COOKIE_REFRESH_NAME) or request.data.get('refresh')
            if refresh_token:
                RefreshToken(refresh_token).blacklist()
        except Exception:
            pass
        response = Response({'detail': 'Logged out successfully.'})
        return clear_cookie_response(response)


class TokenRefreshCookieView(APIView):
    """Refresh access token using the httpOnly refresh cookie."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_COOKIE_REFRESH_NAME)
        if not refresh_token:
            return Response({'detail': 'No refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
            response = Response({'detail': 'Token refreshed.'})
            return make_cookie_response(response, refresh)
        except Exception:
            return Response({'detail': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


class VerifyEmailView(APIView):
    """Activate a user's email from the signed verification link."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            data = signing.loads(token, salt='email-verify', max_age=86400)  # 24 hours
            user = User.objects.get(id=data['user_id'])
            if user.is_email_verified:
                return Response({'detail': 'Email already verified.'})
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
            logger.info('Email verified for %s', user.email)
            return Response({'detail': 'Email verified successfully. You can now use all features.'})
        except signing.SignatureExpired:
            return Response({'detail': 'Verification link has expired. Request a new one.'}, status=400)
        except (signing.BadSignature, User.DoesNotExist):
            return Response({'detail': 'Invalid verification link.'}, status=400)


class ResendVerificationEmailView(APIView):
    """Re-send the verification email for the logged-in user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_email_verified:
            return Response({'detail': 'Email is already verified.'})
        send_verification_email(request.user)
        return Response({'detail': 'Verification email sent.'})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CandidateProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CandidateProfileUpdateSerializer
        return CandidateProfileSerializer

    def get_object(self):
        return get_object_or_404(CandidateProfile, user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CandidateProfileSerializer(instance).data)


class CVUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != User.CANDIDATE:
            return Response({'detail': 'Only candidates can upload CVs.'}, status=403)
        cv_file = request.FILES.get('cv')
        if not cv_file:
            return Response({'detail': 'No file provided.'}, status=400)

        # Extension check
        allowed_exts = ['.pdf', '.docx', '.txt']
        name_lower = cv_file.name.lower()
        if not any(name_lower.endswith(ext) for ext in allowed_exts):
            return Response({'detail': 'Only PDF, DOCX, and TXT files are allowed.'}, status=400)

        # Size check
        if cv_file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File size cannot exceed 5 MB.'}, status=400)

        # MIME type verification via magic bytes (python-magic)
        try:
            import magic
            cv_file.seek(0)
            header = cv_file.read(2048)
            cv_file.seek(0)
            mime = magic.from_buffer(header, mime=True)
            allowed_mimes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain',
            ]
            if mime not in allowed_mimes:
                return Response({'detail': 'File content does not match its extension.'}, status=400)
        except ImportError:
            # python-magic not available — extension check is sufficient fallback
            pass
        except Exception:
            pass

        profile = request.user.candidate_profile
        profile.cv = cv_file
        profile.cv_text = extract_text_from_cv(cv_file)
        profile.save()
        cv_url = None
        try:
            cv_url = profile.cv.url
        except Exception:
            pass
        return Response({'cv_url': cv_url, 'detail': 'CV uploaded and indexed for AI matching.'})


class RecruiterProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RecruiterProfileUpdateSerializer
        return RecruiterProfileSerializer

    def get_object(self):
        return get_object_or_404(RecruiterProfile, user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(RecruiterProfileSerializer(instance).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Incorrect password.'}, status=400)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            token_obj = PasswordResetToken.objects.create(user=user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{token_obj.token}"
            send_mail(
                'RoleRadius – Reset Your Password',
                f'Hi {user.full_name},\n\nReset your password: {reset_url}\n\nThis link expires in 2 hours.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass
        return Response({'detail': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token_obj = PasswordResetToken.objects.get(token=serializer.validated_data['token'])
        except PasswordResetToken.DoesNotExist:
            return Response({'detail': 'Invalid reset token.'}, status=400)
        if not token_obj.is_valid():
            return Response({'detail': 'This reset link has expired or already been used.'}, status=400)
        token_obj.user.set_password(serializer.validated_data['new_password'])
        token_obj.user.save()
        token_obj.used = True
        token_obj.save()
        return Response({'detail': 'Password reset successfully.'})


class PublicCandidateProfileView(generics.RetrieveAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = CandidateProfile.objects.all()
    lookup_field = 'user__id'
    lookup_url_kwarg = 'user_id'


class PublicRecruiterProfileView(generics.RetrieveAPIView):
    serializer_class = RecruiterProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = RecruiterProfile.objects.all()
    lookup_field = 'user__id'
    lookup_url_kwarg = 'user_id'
