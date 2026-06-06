from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """5 login attempts per minute per IP."""
    scope = 'login'


class PasswordResetRateThrottle(AnonRateThrottle):
    """3 password reset requests per minute per IP."""
    scope = 'password_reset'


class RegisterRateThrottle(AnonRateThrottle):
    """10 registration attempts per hour per IP."""
    scope = 'register'
