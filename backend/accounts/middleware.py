"""
Security audit middleware — logs auth events, permission denials,
and suspicious requests to a dedicated security log.
"""
import logging
import time

security_log = logging.getLogger('security')


class SecurityAuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        # Log auth events
        if request.path.startswith('/api/auth/'):
            if request.method == 'POST' and 'login' in request.path:
                if response.status_code == 200:
                    security_log.info(
                        'LOGIN_SUCCESS ip=%s user=%s duration=%dms',
                        self._get_ip(request),
                        getattr(getattr(request, 'user', None), 'email', 'anonymous'),
                        duration_ms,
                    )
                elif response.status_code in (400, 401, 429):
                    security_log.warning(
                        'LOGIN_FAILURE ip=%s status=%d duration=%dms',
                        self._get_ip(request),
                        response.status_code,
                        duration_ms,
                    )

        # Log 403 permission denials
        if response.status_code == 403:
            security_log.warning(
                'PERMISSION_DENIED ip=%s method=%s path=%s user=%s',
                self._get_ip(request),
                request.method,
                request.path,
                getattr(getattr(request, 'user', None), 'email', 'anonymous'),
            )

        return response

    @staticmethod
    def _get_ip(request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
