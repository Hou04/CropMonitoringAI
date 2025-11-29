# agriculture/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading, AnomalyEvent
from .detector import detect_anomaly
from .agent import generate_recommendation

@receiver(post_save, sender=SensorReading)
def on_new_reading(sender, instance, created, **kwargs):
    if not created:
        return  # Only react to fresh new data

    print("📡 New sensor reading received → Running detector...")

    # Step 1 — Run anomaly detector
    was_anomaly = detect_anomaly(instance)

    if not was_anomaly:
        return  # No anomaly → Nothing else to do

    # Step 2 — Retrieve the anomaly created by detector
    anomaly = (
        AnomalyEvent.objects
        .filter(plot=instance.plot)
        .order_by('-timestamp')
        .first()
    )

    if anomaly:
        print("🤖 Generating AI recommendation...")
        generate_recommendation(anomaly)
