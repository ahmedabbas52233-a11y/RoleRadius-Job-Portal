"""
Custom JWT authentication that reads tokens from httpOnly cookies.

Why cookies instead of localStorage:
  - httpOnly cookies cannot be read by JavaScript → XSS attacks can't steal tokens
  - Cookies are sent automatically → no manual Authorization header management
  - SameSite=Lax prevents CSRF on modern browsers

Falls back to Authorization header so the Swagger UI and API clients still work.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Attempt cookie authentication first, then fall back to the standard
    Authorization: Bearer <token> header for API clients and Swagger UI.
    """

    def authenticate(self, request):
        access_token = request.COOKIES.get(
            getattr(settings, 'JWT_COOKIE_ACCESS_NAME', 'access_token')
        )
        if access_token:
            try:
                validated = self.get_validated_token(access_token)
                return self.get_user(validated), validated
            except (TokenError, InvalidToken):
                # Token expired or invalid — fall through to header check
                # The frontend's refresh interceptor will handle the 401
                pass

        # Fall back to Authorization header (for API clients / Swagger)
        return super().authenticate(request)
