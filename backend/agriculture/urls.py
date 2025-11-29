
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    FarmProfileViewSet, FieldPlotViewSet, SensorReadingViewSet,
    AnomalyEventViewSet, AgentRecommendationViewSet,
    login_view, register_view, run_batch_process
)

router = DefaultRouter()
router.register(r'farms', FarmProfileViewSet, basename='farm')
router.register(r'plots', FieldPlotViewSet, basename='plot')
router.register(r'sensor-readings', SensorReadingViewSet, basename='sensorreading')
router.register(r'anomalies', AnomalyEventViewSet, basename='anomaly')
router.register(r'recommendations', AgentRecommendationViewSet, basename='recommendation')

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('run-batch/', run_batch_process, name='run-batch'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
