from django.db import models

class SensorType(models.TextChoices):
    MOI = 'MOI', 'Soil Moisture (%)'
    TMP = 'TMP', 'Air Temperature (°C)'
    HUM = 'HUM', 'Air Humidity (%)'

class AnomalyType(models.TextChoices):
    LOW_MOISTURE = 'LOW_MOI', 'Critical Low Moisture'
    SUDDEN_DROP = 'DROP', 'Sudden Moisture Drop (Irrigation Failure)'
    HEAT_STRESS = 'HEAT', 'Extreme Heat Stress'
    SENSOR_ERROR = 'SENSOR_ERR', 'Sensor Malfunction Detected'
    STAT_OUTLIER = 'OUTLIER', 'Statistical Anomaly'

class SeverityLevel(models.TextChoices):
    LOW = 'LOW', 'Low Risk'
    MEDIUM = 'MED', 'Medium Risk'
    HIGH = 'HIGH', 'Critical Risk'

class ConfidenceLevel(models.TextChoices):
    LOW = 'LOW', 'Low Confidence'
    MEDIUM = 'MED', 'Medium Confidence'
    HIGH = 'HIGH', 'High Confidence'