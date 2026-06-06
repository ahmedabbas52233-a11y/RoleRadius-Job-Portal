"""Shared utility functions for the accounts app."""
import io
import logging
from django.conf import settings
from django.core import signing
from django.core.mail import send_mail

logger = logging.getLogger('roleradius')


def extract_text_from_cv(file) -> str:
    """Extract plain text from PDF, DOCX, or TXT CV file."""
    try:
        name = getattr(file, 'name', '').lower()
        if name.endswith('.pdf'):
            from pdfminer.high_level import extract_text
            file.seek(0)
            return extract_text(io.BytesIO(file.read())) or ''
        elif name.endswith('.docx'):
            import docx
            file.seek(0)
            doc = docx.Document(io.BytesIO(file.read()))
            return '\n'.join(p.text for p in doc.paragraphs)
        elif name.endswith('.txt'):
            file.seek(0)
            return file.read().decode('utf-8', errors='ignore')
    except Exception as exc:
        logger.warning('extract_text_from_cv failed for %s: %s', getattr(file, 'name', '?'), exc)
    return ''


def send_verification_email(user) -> None:
    """Send an email verification link to the user."""
    token = signing.dumps({'user_id': str(user.id)}, salt='email-verify')
    verify_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/verify-email/{token}"
    try:
        send_mail(
            subject='Verify your RoleRadius email address',
            message=(
                f'Hi {user.full_name},\n\n'
                f'Please verify your email by clicking the link below:\n\n'
                f'{verify_url}\n\n'
                f'This link expires in 24 hours.\n\n'
                f'If you did not create a RoleRadius account, you can ignore this email.\n\n'
                f'— The RoleRadius Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
        logger.info('Verification email sent to %s', user.email)
    except Exception as exc:
        logger.warning('Could not send verification email to %s: %s', user.email, exc)


def make_cookie_response(response, refresh_token):
    """Attach httpOnly JWT cookies to a response object."""
    from django.conf import settings as s
    response.set_cookie(
        s.JWT_COOKIE_ACCESS_NAME,
        str(refresh_token.access_token),
        max_age  = s.JWT_COOKIE_ACCESS_MAX_AGE,
        httponly = s.JWT_COOKIE_HTTPONLY,
        secure   = s.JWT_COOKIE_SECURE,
        samesite = s.JWT_COOKIE_SAMESITE,
        path     = '/',
    )
    response.set_cookie(
        s.JWT_COOKIE_REFRESH_NAME,
        str(refresh_token),
        max_age  = s.JWT_COOKIE_REFRESH_MAX_AGE,
        httponly = s.JWT_COOKIE_HTTPONLY,
        secure   = s.JWT_COOKIE_SECURE,
        samesite = s.JWT_COOKIE_SAMESITE,
        path     = '/api/auth/token/refresh/',
    )
    return response


def clear_cookie_response(response):
    """Delete JWT cookies from a response (used on logout)."""
    from django.conf import settings as s
    response.delete_cookie(s.JWT_COOKIE_ACCESS_NAME,  path='/')
    response.delete_cookie(s.JWT_COOKIE_REFRESH_NAME, path='/api/auth/token/refresh/')
    return response
