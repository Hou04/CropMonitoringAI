# agriculture/detector.py
#Hedha li fih logic metier taa el detctor kifezch el projet ydetecti koll anomaly a travers 4 layers  

import numpy as np
from sklearn.ensemble import IsolationForest
from django.utils import timezone
from datetime import timedelta
from .models import SensorReading, AnomalyEvent

# Global cache for trained models (one per plot)
_isolation_forest_models = {}

def detect_anomaly(reading):
    plot = reading.plot
    value = float(reading.value)
    sensor_type = reading.sensor_type
    now = timezone.now()

    confidence = 0.0
    anomaly_type = None
    details = {"trigger_value": value, "sensor_type": sensor_type}

    try:
        if sensor_type == "MOI":
            # Rule 1: Critical low moisture
            if value < 32:
                anomaly_type = "LOW_MOISTURE"
                # Dynamic confidence based on deviation
                # 32 = 0.7 (Low), 20 = 0.9 (High)
                deviation = 32 - value
                confidence = 0.7 + min(deviation / 20.0, 0.29)  # Cap at 0.99

            # Rule 2: Sudden drop detection
            one_hour_ago = now - timedelta(hours=1)
            recent = SensorReading.objects.filter(
                plot=plot,
                sensor_type="MOI",
                timestamp__gte=one_hour_ago
            ).order_by('-timestamp')[:15]

            if len(recent) >= 5:
                values = [float(r.value) for r in recent if r.value is not None]
                if values and value < max(values) - 14:
                    anomaly_type = "DROP"
                    # Dynamic: larger drop = higher confidence
                    drop_size = max(values) - value
                    confidence = 0.8 + min((drop_size - 14) / 20.0, 0.19)
                    details["previous_high"] = max(values)
                    details["drop_amount"] = round(drop_size, 2)

            # Rule 3: Z-score outlier
            day_ago = now - timedelta(hours=24)
            history = SensorReading.objects.filter(
                plot=plot,
                sensor_type="MOI",
                timestamp__gte=day_ago
            ).values_list('value', flat=True)

            history = [float(v) for v in history if v is not None]

            if len(history) > 20:
                mean = np.mean(history)
                std = np.std(history) if np.std(history) > 0 else 1
                z_score = abs(value - mean) / std
                if z_score > 3.0: # Lowered threshold slightly to catch more
                    anomaly_type = anomaly_type or "OUTLIER"
                    # Dynamic: 3.0 -> 0.6, 6.0 -> 0.99
                    confidence = max(confidence, min(0.6 + (z_score - 3.0) * 0.1, 0.99))
                    details["z_score"] = round(z_score, 2)

            # Rule 4: Isolation Forest
            if len(history) >= 50:
                if plot.id not in _isolation_forest_models:
                    X = np.array(history).reshape(-1, 1)
                    model = IsolationForest(contamination=0.08, random_state=42, n_estimators=100)
                    model.fit(X)
                    _isolation_forest_models[plot.id] = model

                if plot.id in _isolation_forest_models:
                    prediction = _isolation_forest_models[plot.id].predict([[value]])[0]
                    if prediction == -1:  # -1 means anomaly
                        anomaly_type = anomaly_type or "OUTLIER"
                        confidence = max(confidence, 0.95)
                        details["ml_detection"] = "Isolation Forest confirmed anomaly"

        # Temperature heat stress
        elif sensor_type == "TMP" and value > 37.5:
            anomaly_type = "HEAT"
            # 37.5 -> 0.75, 45 -> 0.99
            confidence = 0.75 + min((value - 37.5) / 10.0, 0.24)
            details["temperature"] = value

        # Humidity sensor error
        elif sensor_type == "HUM" and (value < 15 or value > 95):
            anomaly_type = "SENSOR_ERROR"
            confidence = 0.90

        # CREATE ANOMALY IF CONFIDENCE HIGH ENOUGH
        if anomaly_type and confidence >= 0.7:
            severity = "HIGH" if confidence >= 0.9 else "MEDIUM" if confidence >= 0.8 else "LOW"

            AnomalyEvent.objects.create(
                plot=plot,
                anomaly_type=anomaly_type,
                severity=severity,
                confidence=round(confidence, 3),
                details=details
            )
            print(f"🚨 ANOMALY DETECTED → {anomaly_type} | Confidence {confidence:.1%} | Value: {value}")
            return True

    except Exception as e:
        print(f"Detector error: {e}")

    return False