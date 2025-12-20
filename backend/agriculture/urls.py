
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    FarmProfileViewSet, FieldPlotViewSet, SensorReadingViewSet,
    AnomalyEventViewSet, AgentRecommendationViewSet,
    login_view, register_view, run_batch_process
)

from rest_framework import permissions

from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Crop Monitoring API",
      default_version='v1',
      description="API documentation for the AI-Enhanced Crop Monitoring System",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@cropmonitor.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
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
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),  # Swagger UI
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),  # Redoc UI
    path('', include(router.urls)),
]

