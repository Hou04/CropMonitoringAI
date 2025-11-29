from django.contrib import admin
from .models import FarmProfile, FieldPlot, SensorReading, AnomalyEvent, AgentRecommendation

@admin.register(FarmProfile)
class FarmProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'location']
    search_fields = ['name', 'owner__username']

@admin.register(FieldPlot)
class FieldPlotAdmin(admin.ModelAdmin):
    list_display = ['name', 'farm', 'area_hectares']
    list_filter = ['farm']

@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ['plot', 'sensor_type', 'value', 'timestamp']
    list_filter = ['sensor_type', 'plot__farm']
    readonly_fields = ['timestamp']

@admin.register(AnomalyEvent)
class AnomalyEventAdmin(admin.ModelAdmin):
    list_display = ['plot', 'anomaly_type', 'severity', 'confidence', 'timestamp']
    list_filter = ['severity', 'anomaly_type']

@admin.register(AgentRecommendation)
class AgentRecommendationAdmin(admin.ModelAdmin):
    list_display = ['anomaly', 'confidence_level', 'generated_at']
    readonly_fields = ['generated_at']