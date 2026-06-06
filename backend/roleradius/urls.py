from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
)


def health_check(request):
    """Simple health check for Docker and load balancers."""
    return JsonResponse({
        'status': 'ok',
        'service': 'roleradius-api',
        'version': '1.0.0',
    })


urlpatterns = [
    path('admin/',        admin.site.urls),

    # Health check — used by Docker HEALTHCHECK and load balancers
    path('api/health/',   health_check, name='health_check'),

    # Application APIs
    path('api/auth/',         include('accounts.urls')),
    path('api/jobs/',         include('jobs.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/matching/',     include('matching.urls')),

    # Auto-generated API documentation
    path('api/schema/',             SpectacularAPIView.as_view(),       name='schema'),
    path('api/schema/swagger-ui/',  SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/',       SpectacularRedocView.as_view(url_name='schema'),   name='redoc'),
]
