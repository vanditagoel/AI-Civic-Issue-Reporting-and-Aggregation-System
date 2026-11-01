from django.urls import path
from .views import CouncilAnalyticsView

urlpatterns = [
    path('council/', CouncilAnalyticsView.as_view(), name='council-analytics'),
]
