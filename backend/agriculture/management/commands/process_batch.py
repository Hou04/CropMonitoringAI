from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from agriculture.models import SensorReading, AnomalyEvent
from agriculture.detector import detect_anomaly
from agriculture.agent import generate_recommendation
from tqdm import tqdm

class Command(BaseCommand):
    help = 'Batch process sensor readings for anomaly detection'

    def add_arguments(self, parser):
        parser.add_argument('--minutes', type=int, default=60, help='Process readings from the last X minutes')
        parser.add_argument('--all', action='store_true', help='Process all historical readings')

    def handle(self, *args, **options):
        self.stdout.write("🚀 Starting batch processing...")

        if options['all']:
            readings = SensorReading.objects.all().order_by('timestamp')
            self.stdout.write(f"   Target: ALL historical data ({readings.count()} readings)")
        else:
            minutes = options['minutes']
            cutoff = timezone.now() - timedelta(minutes=minutes)
            readings = SensorReading.objects.filter(timestamp__gte=cutoff).order_by('timestamp')
            self.stdout.write(f"   Target: Last {minutes} minutes ({readings.count()} readings)")

        if not readings.exists():
            self.stdout.write(self.style.WARNING("⚠️  No readings found to process."))
            return

        anomalies_found = 0
        
        # Process with progress bar
        for reading in tqdm(readings, desc="Processing", unit="reading"):
            # 1. Detect Anomaly
            was_anomaly = detect_anomaly(reading)
            
            if was_anomaly:
                anomalies_found += 1
                # 2. Generate Recommendation (if anomaly created)
                # Note: detect_anomaly creates the AnomalyEvent, so we fetch it
                anomaly = AnomalyEvent.objects.filter(plot=reading.plot).order_by('-timestamp').first()
                if anomaly and anomaly.timestamp >= reading.timestamp:
                     generate_recommendation(anomaly)

        self.stdout.write(self.style.SUCCESS(f"✅ Batch complete. Found {anomalies_found} anomalies."))
