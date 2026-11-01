"""
CivicLens URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def health_check(request):
    """
    Health check endpoint verifying PostgreSQL database connectivity.
    Returns 200 with status: healthy if DB connection succeeds, otherwise 503.
    """
    db_ok = False
    error_message = None
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            if row and row[0] == 1:
                db_ok = True
    except Exception as e:
        error_message = str(e)

    if db_ok:
        return JsonResponse({
            'status': 'healthy',
            'database': 'postgresql',
            'system': 'CivicLens AI Municipal Aggregation Platform',
            'version': '1.0.0',
        }, status=200)
    else:
        return JsonResponse({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': error_message,
        }, status=503)

urlpatterns = [
    # Administration
    path('admin/', admin.site.urls),
    
    # System Health
    path('api/health/', health_check, name='health-check'),
    
    # OpenAPI Schema & Interactive Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Modular Domain APIs
    path('api/auth/', include('apps.accounts.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/issues/', include('apps.issues.urls')),
    path('api/ai/', include('apps.ai_processing.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]
