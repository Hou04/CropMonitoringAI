# agriculture/models.py
# Model definitions for the AI-Enhanced Crop Monitoring System

from django.db import models
from django.contrib.auth.models import User
from .enumerations import SensorType, AnomalyType, SeverityLevel, ConfidenceLevel  # Added ConfidenceLevel if defined

class FarmProfile(models.Model):
    """
    Model for farm profiles.
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    crop_type = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'farm_profile'

class FieldPlot(models.Model):
    """
    Model for field plots within farms.
    """
    farm = models.ForeignKey(FarmProfile, on_delete=models.CASCADE, related_name='plots')
    name = models.CharField(max_length=100)
    crop_variety = models.CharField(max_length=100, blank=True)
    area_hectares = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.name} - {self.farm.name}"

    class Meta:
        db_table = 'field_plot'

class SensorReading(models.Model):
    """
    Model for sensor readings from plots.
    """
    plot = models.ForeignKey(FieldPlot, on_delete=models.CASCADE, related_name='readings')
    sensor_type = models.CharField(max_length=3, choices=SensorType.choices)
    value = models.DecimalField(max_digits=6, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=20, default='simulator')

    class Meta:
        db_table = 'sensor_reading'
        ordering = ['-timestamp']
        indexes = [models.Index(fields=['plot', 'sensor_type', '-timestamp'])]

    def __str__(self):
        return f"{self.get_sensor_type_display()}: {self.value} at {self.timestamp.strftime('%H:%M')}"

class AnomalyEvent(models.Model):
    """
    Model for detected anomaly events.
    """
    plot = models.ForeignKey(FieldPlot, on_delete=models.CASCADE, related_name='anomalies')
    anomaly_type = models.CharField(max_length=12, choices=AnomalyType.choices)
    severity = models.CharField(max_length=6, choices=SeverityLevel.choices)
    confidence = models.DecimalField(max_digits=4, decimal_places=2)  # 0.95 = 95%
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)

    class Meta:
        db_table = 'anomaly_event'
        ordering = ['-timestamp']

class AgentRecommendation(models.Model):
    """
    Model for AI-generated recommendations linked to anomalies.
    """
    anomaly = models.OneToOneField(AnomalyEvent, on_delete=models.CASCADE, related_name='recommendation')
    recommended_action = models.TextField()
    explanation = models.TextField()
    confidence_level = models.CharField(max_length=6, choices=SeverityLevel.choices)  # Reused SeverityLevel, or use ConfidenceLevel if separate enum
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'agent_recommendation'