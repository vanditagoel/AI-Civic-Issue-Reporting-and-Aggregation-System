from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsolidatedIssueViewSet

router = DefaultRouter()
router.register(r'', ConsolidatedIssueViewSet, basename='issue')

urlpatterns = [
    path('', include(router.urls)),
]
