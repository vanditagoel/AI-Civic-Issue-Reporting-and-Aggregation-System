from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewQueueViewSet, RetryJobView, AIMonitorStatsView

router = DefaultRouter()
router.register(r'review-queue', ReviewQueueViewSet, basename='review-queue')

urlpatterns = [
    path('jobs/<uuid:job_id>/retry/', RetryJobView.as_view(), name='retry-job'),
    path('monitor/', AIMonitorStatsView.as_view(), name='ai-monitor'),
    path('', include(router.urls)),
]
