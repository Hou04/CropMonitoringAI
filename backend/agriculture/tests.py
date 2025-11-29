from django.test import TestCase
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from .models import FarmProfile, FieldPlot, SensorReading, AnomalyEvent, AgentRecommendation
from .detector import detect_anomaly
from .agent import generate_recommendation
import time


class AnomalyDetectorTestCase(TestCase):
    """Test cases for anomaly detection model"""
    
    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.farm = FarmProfile.objects.create(
            owner=self.user,
            name="Test Farm",
            location="Tunis",
            crop_type="Wheat"
        )
        self.plot = FieldPlot.objects.create(
            farm=self.farm,
            name="Plot A1",
            size_hectares=2.5,
            crop_variety="Winter Wheat"
        )
    
    def test_low_moisture_detection(self):
        """Test detection of critically low moisture"""
        reading = SensorReading.objects.create(
            plot=self.plot,
            sensor_type='MOI',
            value=25.0,  # Below threshold of 32
            source='test'
        )
        
        anomaly_detected = detect_anomaly(reading)
        self.assertTrue(anomaly_detected, "Should detect low moisture anomaly")
        
        # Check anomaly was created
        anomaly = AnomalyEvent.objects.filter(plot=self.plot, anomaly_type='LOW_MOISTURE').first()
        self.assertIsNotNone(anomaly, "Anomaly should be created in database")
        self.assertEqual(anomaly.severity, 'HIGH', "Low moisture should be HIGH severity")
    
    def test_normal_moisture_no_detection(self):
        """Test that normal readings don't trigger false alarms"""
        reading = SensorReading.objects.create(
            plot=self.plot,
            sensor_type='MOI',
            value=60.0,  # Normal range
            source='test'
        )
        
        initial_count = AnomalyEvent.objects.count()
        anomaly_detected = detect_anomaly(reading)
        
        self.assertFalse(anomaly_detected, "Normal reading should not trigger anomaly")
        self.assertEqual(AnomalyEvent.objects.count(), initial_count, "No anomaly should be created")
    
    def test_heat_stress_detection(self):
        """Test detection of extreme temperature"""
        reading = SensorReading.objects.create(
            plot=self.plot,
            sensor_type='TMP',
            value=40.0,  # Above 37.5°C threshold
            source='test'
        )
        
        anomaly_detected = detect_anomaly(reading)
        self.assertTrue(anomaly_detected, "Should detect heat stress")
        
        anomaly = AnomalyEvent.objects.filter(plot=self.plot, anomaly_type='HEAT').first()
        self.assertIsNotNone(anomaly)
    
    def test_sudden_drop_detection(self):
        """Test detection of sudden moisture drops"""
        # Create historical high moisture
        now = datetime.now()
        for i in range(10):
            SensorReading.objects.create(
                plot=self.plot,
                sensor_type='MOI',
                value=70.0,
                source='test',
                timestamp=now - timedelta(minutes=i*5)
            )
        
        # Create sudden drop
        reading = SensorReading.objects.create(
            plot=self.plot,
            sensor_type='MOI',
            value=50.0,  # 20% drop
            source='test'
        )
        
        anomaly_detected = detect_anomaly(reading)
        self.assertTrue(anomaly_detected, "Should detect sudden drop")


class AIAgentTestCase(TestCase):
    """Test cases for AI agent recommendations"""
    
    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser2', password='12345')
        self.farm = FarmProfile.objects.create(
            owner=self.user,
            name="Test Farm 2",
            location="Tunis",
            crop_type="Corn"
        )
        self.plot = FieldPlot.objects.create(
            farm=self.farm,
            name="Plot B1",
            size_hectares=1.5,
            crop_variety="Sweet Corn"
        )
    
    def test_recommendation_generation(self):
        """Test that agent generates recommendations"""
        anomaly = AnomalyEvent.objects.create(
            plot=self.plot,
            anomaly_type='LOW_MOISTURE',
            severity='HIGH',
            confidence=0.95,
            details={'trigger_value': 28}
        )
        
        generate_recommendation(anomaly)
        
        rec = AgentRecommendation.objects.filter(anomaly=anomaly).first()
        self.assertIsNotNone(rec, "Recommendation should be created")
        self.assertIn('irrigation', rec.recommended_action.lower(), "Should recommend irrigation")
        self.assertEqual(rec.confidence_level, 'HIGH', "Confidence should match anomaly")
    
    def test_decision_latency(self):
        """Test that agent responds quickly (<1 second)"""
        anomaly = AnomalyEvent.objects.create(
            plot=self.plot,
            anomaly_type='HEAT',
            severity='HIGH',
            confidence=0.93,
            details={'temperature': 40}
        )
        
        start = time.time()
        generate_recommendation(anomaly)
        latency = time.time() - start
        
        self.assertLess(latency, 1.0, f"Agent latency {latency:.3f}s exceeds 1 second")
    
    def test_recommendation_relevance(self):
        """Test that recommendations match anomaly types"""
        # Test DROP anomaly
        drop_anomaly = AnomalyEvent.objects.create(
            plot=self.plot,
            anomaly_type='DROP',
            severity='HIGH',
            confidence=0.99,
            details={'drop_amount': 15, 'previous_high': 70}
        )
        
        generate_recommendation(drop_anomaly)
        rec = AgentRecommendation.objects.filter(anomaly=drop_anomaly).first()
        
        self.assertIsNotNone(rec)
        self.assertIn('INSPECTION', rec.recommended_action.upper(), 
                     "DROP should recommend inspection")


class SystemIntegrationTestCase(TestCase):
    """End-to-end system tests"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='integration_test', password='12345')
        self.farm = FarmProfile.objects.create(
            owner=self.user,
            name="Integration Test Farm",
            location="Tunis"
        )
        self.plot = FieldPlot.objects.create(
            farm=self.farm,
            name="Integration Plot",
            size_hectares=3.0
        )
    
    def test_end_to_end_pipeline(self):
        """Test full pipeline: Reading → Detection → Recommendation"""
        # Create sensor reading
        reading = SensorReading.objects.create(
            plot=self.plot,
            sensor_type='MOI',
            value=28.0,
            source='simulator'
        )
        
        # Detection should happen automatically via signals
        # But we'll test manually too
        detected = detect_anomaly(reading)
        self.assertTrue(detected)
        
        # Check anomaly created
        anomaly = AnomalyEvent.objects.filter(plot=self.plot).latest('timestamp')
        self.assertIsNotNone(anomaly)
        
        # Generate recommendation
        generate_recommendation(anomaly)
        
        # Verify recommendation exists
        rec = AgentRecommendation.objects.filter(anomaly=anomaly).first()
        self.assertIsNotNone(rec, "End-to-end pipeline should create recommendation")
        
        # Verify all fields populated
        self.assertIsNotNone(rec.recommended_action)
        self.assertIsNotNone(rec.explanation)
        self.assertIn(rec.confidence_level, ['HIGH', 'MEDIUM', 'LOW'])
    
    def test_data_consistency(self):
        """Test that all sensor readings are stored correctly"""
        initial_count = SensorReading.objects.count()
        
        # Create multiple readings
        readings = []
        for i in range(10):
            reading = SensorReading.objects.create(
                plot=self.plot,
                sensor_type='MOI',
                value=50.0 + i,
                source='test'
            )
            readings.append(reading)
        
        # Verify all stored
        self.assertEqual(SensorReading.objects.count(), initial_count + 10)
        
        # Verify all retrievable
        for reading in readings:
            retrieved = SensorReading.objects.get(id=reading.id)
            self.assertEqual(retrieved.value, reading.value)
