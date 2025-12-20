# agriculture/views.py
# View definitions for the AI-Enhanced Crop Monitoring System

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Avg, Min, Max, Count, Q
from django.utils import timezone
from datetime import timedelta
from .serializers import UserSerializer, FarmProfileSerializer, FieldPlotSerializer, SensorReadingSerializer, AnomalyEventSerializer, AgentRecommendationSerializer
from .models import FarmProfile, FieldPlot, SensorReading, AnomalyEvent, AgentRecommendation
from rq import Queue
from redis import Redis
from agriculture.tasks import run_batch  # Assuming tasks.py exists with run_batch defined
import os
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
q = Queue(connection=Redis(host=REDIS_HOST, port=6379, db=0))  # Connect to Redis for RQ

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    User Login endpoint
    POST /api/login/
    Body: {"username": "...", "password": "..."}
    """
    username = request.data.get('username')
    password = request.data.get('password')

    print(f"🔍 LOGIN ATTEMPT: username='{username}', password='{password}'")

    # Validation
    if not username or not password:
        print("❌ Missing credentials")
        return Response({'error': 'Username and password are required'}, status=400)

    # Authenticate user
    user = authenticate(username=username, password=password)

    if user is None:
        print(f"❌ Authentication failed for '{username}'")
        # Check if user exists at all
        if User.objects.filter(username=username).exists():
            u = User.objects.get(username=username)
            print(f"   User exists. Active: {u.is_active}. Password valid: {u.check_password(password)}")
        else:
            print("   User does not exist")
        
        return Response({'error': 'Invalid credentials'}, status=401)
    
    print(f"✅ Login successful for {user.username}")

    # Generate tokens
    refresh = RefreshToken.for_user(user)

    return Response({
        'message': 'Login successful',
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    User Registration endpoint
    POST /api/register/
    Body: {"username": "...", "email": "...", "password": "..."}
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Validation
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)

    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=400)

    # Check if email already exists (if provided)
    if email and User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=400)

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email or '',
            password=password
        )

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'User created successfully',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def run_batch_process(request):
    """
    Trigger batch processing for ML anomaly detection.
    POST /api/run-batch/
    Body: {"minutes": 60}  # Optional, default 60
    """
    minutes = request.data.get('minutes', 60)
    job = q.enqueue(run_batch, minutes)  # Queue the task
    return Response({'status': 'Batch queued', 'job_id': job.id})


# ============== FARM VIEWSET ==============

class FarmProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Farm Management
    
    Endpoints:
    - GET /api/farms/ - List user's farms
    - POST /api/farms/ - Create new farm
    - GET /api/farms/{id}/ - Get farm details
    - PUT/PATCH /api/farms/{id}/ - Update farm
    - DELETE /api/farms/{id}/ - Delete farm
    
    Query Params:
    - ?crop_type=wheat - Filter by crop type
    - ?search=olive - Search in name or location
    """
    queryset = FarmProfile.objects.none()  # Fixed: Add static queryset (use .none() for dynamic filtering)
    serializer_class = FarmProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter farms by authenticated user and apply search/filters."""
        if getattr(self, 'swagger_fake_view', False) or self.request.user.is_anonymous:
            return FarmProfile.objects.none()
        queryset = FarmProfile.objects.filter(owner=self.request.user)
        crop_type = self.request.query_params.get('crop_type')
        if crop_type:
            queryset = queryset.filter(crop_type__icontains=crop_type)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(location__icontains=search))
        queryset = queryset.select_related('owner')
        return queryset.order_by('-id')

    def perform_create(self, serializer):
        """Auto-populate owner field."""
        serializer.save(owner=self.request.user)


# ============== PLOT VIEWSET ==============

class FieldPlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Plot Management
    
    Query Params:
    - ?farm=1 - Filter by farm ID
    - ?search=A1 - Search in plot name
    """
    queryset = FieldPlot.objects.none()  # Fixed: Add static queryset
    serializer_class = FieldPlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter plots by user's farms and apply filters."""
        if getattr(self, 'swagger_fake_view', False) or self.request.user.is_anonymous:
            return FieldPlot.objects.none()
        queryset = FieldPlot.objects.filter(farm__owner=self.request.user)
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            queryset = queryset.filter(farm_id=farm_id)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(crop_variety__icontains=search))
        queryset = queryset.select_related('farm', 'farm__owner')
        return queryset.order_by('farm', 'name')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='generate-test-data')
    def generate_test_data(self, request, pk=None):
        """
        Generate test sensor data for demonstration purposes.
        POST /api/plots/{id}/generate-test-data/
        """
        import random
        from django.db import transaction
       
        plot = self.get_object()
       
        # Parse parameters
        try:
            print(f"⚡ Generating test data for plot {pk}...")
            days = int(request.data.get('days', 7))
            readings_per_hour = int(request.data.get('readings_per_hour', 2))
            print(f"   Days: {days}, Rate: {readings_per_hour}")
        except (ValueError, TypeError) as e:
            print(f"❌ Param error: {e}")
            return Response(
                {'error': 'Invalid parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        # Validate
        if not (1 <= days <= 30) or not (1 <= readings_per_hour <= 12):
            return Response(
                {'error': 'Days must be 1-30, readings_per_hour must be 1-12'},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        # Generate data
        total_per_sensor = days * 24 * readings_per_hour
        interval_min = 60 / readings_per_hour
        print(f"   Total per sensor: {total_per_sensor}")
       
        sensors = {
            'MOI': {'base': 50.0, 'var': 8.0, 'min': 20.0, 'max': 80.0},
            'TMP': {'base': 23.0, 'var': 4.0, 'min': 10.0, 'max': 40.0},
            'HUM': {'base': 65.0, 'var': 12.0, 'min': 30.0, 'max': 95.0}
        }
       
        try:
            with transaction.atomic():
                print("   Starting transaction...")
                readings = []
                now = timezone.now()
                current = {st: cfg['base'] for st, cfg in sensors.items()}
               
                for i in range(total_per_sensor):
                    ts = now - timedelta(days=days) + timedelta(minutes=i * interval_min)
                   
                    for st, cfg in sensors.items():
                        # Random walk
                        current[st] += random.uniform(-cfg['var']/2, cfg['var']/2) + random.uniform(-0.5, 0.5)
                        current[st] = max(cfg['min'], min(cfg['max'], current[st]))

                        # INJECT ANOMALIES (15% chance per hour, roughly)
                        if random.random() < 0.05:
                            if st == 'MOI' and random.random() < 0.5:
                                current[st] = random.uniform(15.0, 30.0)  # Low Moisture
                                print(f"   ⚠️ Injecting LOW MOISTURE: {current[st]}")
                            elif st == 'TMP' and random.random() < 0.5:
                                current[st] = random.uniform(38.0, 45.0)  # Heat Spike
                                print(f"   ⚠️ Injecting HEAT: {current[st]}")
                            elif st == 'HUM' and random.random() < 0.3:
                                current[st] = random.uniform(5.0, 14.0)   # Low Humidity
                        
                        readings.append(SensorReading(
                            plot=plot,
                            sensor_type=st,
                            value=round(current[st], 2),
                            timestamp=ts,
                            source='test_data_generator'
                        ))
                
                print(f"   Created {len(readings)} objects in memory. Bulk inserting...")
                
                # Bulk create
                created_objs = SensorReading.objects.bulk_create(readings, ignore_conflicts=True)
                print(f"✅ Successfully inserted {len(created_objs)} readings.")
                
                # Trigger detection manually (signals don't fire on bulk_create)
                # We only check the injected anomalies to save time, or check all if fast enough
                from agriculture.detector import detect_anomaly
                from agriculture.agent import generate_recommendation
                
                print("🔍 Running anomaly detection on generated data...")
                anomalies_found = 0
                for reading in created_objs:
                    # Optimization: Only check readings that are likely anomalies (we know what we injected)
                    # But for correctness, let's check the ones we suspect or just check all (might be slow if thousands)
                    # Given it's a demo with ~300 readings (7 days * 24 * 2), checking all is fine.
                    if detect_anomaly(reading):
                        anomalies_found += 1
                        # Retrieve the anomaly created by detector
                        anomaly = AnomalyEvent.objects.filter(plot=plot).order_by('-timestamp').first()
                        if anomaly:
                            generate_recommendation(anomaly)
                            
                print(f"🚨 Generated {anomalies_found} anomalies and recommendations.")
           
            return Response({
                'message': 'Successfully generated test data',
                'count': len(created_objs),
                'plot_id': plot.id,
                'plot_name': plot.name,
                'period_days': days
            }, status=status.HTTP_201_CREATED)
           
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"❌ Error generating data: {e}")
            import logging
            logging.getLogger(__name__).error(f"Error generating data: {e}")
            return Response(
                {'error': f'Failed to generate test data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============== SENSOR READING VIEWSET ==============

class SensorReadingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Sensor Data
    
    Query Params:
    - ?plot=1 - Filter by plot ID
    - ?sensor_type=MOI - Filter by sensor type (MOI, TMP, HUM)
    - ?hours=24 - Last N hours (default: 24)
    - ?start=2025-01-01T00:00:00Z - Start datetime
    - ?end=2025-01-01T23:59:59Z - End datetime
    
    Custom Actions:
    - POST /api/sensor-readings/bulk/ - Bulk create
    - GET /api/sensor-readings/statistics/ - Get aggregated stats
    - GET /api/sensor-readings/latest/ - Get latest reading per sensor type
    """
    queryset = SensorReading.objects.none()  # Fixed: Add static queryset
    serializer_class = SensorReadingSerializer
    permission_classes = [AllowAny]  # Allow simulator without auth

    def get_queryset(self):
        """Filter sensor readings with optimizations."""
        queryset = SensorReading.objects.all()
        if self.request.user.is_authenticated:
            queryset = queryset.filter(plot__farm__owner=self.request.user)
        plot_id = self.request.query_params.get('plot')
        if plot_id:
            queryset = queryset.filter(plot_id=plot_id)
        sensor_type = self.request.query_params.get('sensor_type')
        if sensor_type:
            queryset = queryset.filter(sensor_type=sensor_type)
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start and end:
            queryset = queryset.filter(timestamp__range=[start, end])
        else:
            hours = int(self.request.query_params.get('hours', 24))
            start_time = timezone.now() - timedelta(hours=hours)
            queryset = queryset.filter(timestamp__gte=start_time)
        queryset = queryset.select_related('plot', 'plot__farm')
        return queryset.order_by('-timestamp')[:1000]

    def perform_create(self, serializer):
        """Auto-detect source from user agent and save sensor reading."""
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        source = 'simulator' if 'python' in user_agent.lower() else 'web'
        serializer.save(source=source)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def bulk(self, request):
        """Bulk create sensor readings.
        Expected payload: list of sensor reading objects.
        """
        serializer = SensorReadingSerializer(data=request.data, many=True)
        if serializer.is_valid():
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            source = 'simulator' if 'python' in user_agent.lower() else 'web'
            serializer.save(source=source)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def statistics(self, request):
        """GET /api/sensor-readings/statistics/?plot=1&hours=24
        Returns aggregated statistics for a plot.
        """
        plot_id = request.query_params.get('plot')
        if not plot_id:
            return Response({'error': 'plot parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        hours = int(request.query_params.get('hours', 24))
        start_time = timezone.now() - timedelta(hours=hours)
        stats = SensorReading.objects.filter(
            plot_id=plot_id,
            timestamp__gte=start_time
        ).aggregate(
            avg_moisture=Avg('value', filter=Q(sensor_type='MOI')),
            avg_temp=Avg('value', filter=Q(sensor_type='TMP')),
            avg_humidity=Avg('value', filter=Q(sensor_type='HUM')),
            min_moisture=Min('value', filter=Q(sensor_type='MOI')),
            max_temp=Max('value', filter=Q(sensor_type='TMP')),
            min_temp=Min('value', filter=Q(sensor_type='TMP')),
            max_humidity=Max('value', filter=Q(sensor_type='HUM')),
            total_readings=Count('id')
        )
        return Response(stats)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def latest(self, request):
        """GET /api/sensor-readings/latest/?plot=1
        Returns latest reading for each sensor type.
        """
        plot_id = request.query_params.get('plot')
        if not plot_id:
            return Response({'error': 'plot parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        latest_readings = {}
        for sensor_type in ['MOI', 'TMP', 'HUM']:
            reading = SensorReading.objects.filter(plot_id=plot_id, sensor_type=sensor_type).order_by('-timestamp').first()
            if reading:
                latest_readings[sensor_type.lower()] = {'value': float(reading.value), 'timestamp': reading.timestamp}
        return Response(latest_readings)

# ============== ANOMALY VIEWSET ==============

class AnomalyEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Anomaly Events (Read-Only)
    
    Query Params:
    - ?plot=1 - Filter by plot
    - ?severity=HIGH - Filter by severity (HIGH, MEDIUM, LOW)
    - ?type=LOW_MOISTURE - Filter by anomaly type
    - ?unresolved=true - Show only unresolved anomalies
    - ?limit=10 - Limit results (default: all)
    
    Custom Actions:
    - GET /api/anomalies/recent/ - Get recent anomalies
    - GET /api/anomalies/summary/ - Get anomaly summary by severity
    """
    queryset = AnomalyEvent.objects.none()  # Fixed: Add static queryset
    serializer_class = AnomalyEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter anomalies by user's plots with various filters."""
        if getattr(self, 'swagger_fake_view', False) or self.request.user.is_anonymous:
            return AnomalyEvent.objects.none()
        queryset = AnomalyEvent.objects.filter(plot__farm__owner=self.request.user)
        plot_id = self.request.query_params.get('plot')
        if plot_id:
            queryset = queryset.filter(plot_id=plot_id)
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity.upper())
        anomaly_type = self.request.query_params.get('type')
        if anomaly_type:
            queryset = queryset.filter(anomaly_type=anomaly_type.upper())
        unresolved = self.request.query_params.get('unresolved')
        if unresolved and unresolved.lower() == 'true':
            queryset = queryset.filter(resolved=False)
        queryset = queryset.select_related('plot', 'plot__farm').prefetch_related('recommendation')
        queryset = queryset.order_by('-timestamp')
        limit = self.request.query_params.get('limit')
        if limit:
            queryset = queryset[:int(limit)]
        return queryset

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """GET /api/anomalies/recent/?hours=24&limit=5
        Returns most recent anomalies.
        """
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 10))
        start_time = timezone.now() - timedelta(hours=hours)
        anomalies = self.get_queryset().filter(timestamp__gte=start_time)[:limit]
        serializer = self.get_serializer(anomalies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """GET /api/anomalies/summary/?hours=168
        Returns summary of anomalies by severity and type.
        """
        hours = int(request.query_params.get('hours', 168))
        start_time = timezone.now() - timedelta(hours=hours)
        by_severity = AnomalyEvent.objects.filter(plot__farm__owner=request.user, timestamp__gte=start_time).values('severity').annotate(count=Count('id')).order_by('-count')
        by_type = AnomalyEvent.objects.filter(plot__farm__owner=request.user, timestamp__gte=start_time).values('anomaly_type').annotate(count=Count('id')).order_by('-count')
        total = AnomalyEvent.objects.filter(plot__farm__owner=request.user, timestamp__gte=start_time).count()
        return Response({'by_severity': list(by_severity), 'by_type': list(by_type), 'total': total})

# ============== RECOMMENDATION VIEWSET ==============

class AgentRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for AI Agent Recommendations (Read-Only)
    
    Query Params:
    - ?plot=1 - Filter by plot
    - ?confidence=HIGH - Filter by confidence level
    """
    queryset = AgentRecommendation.objects.none()  # Fixed: Add static queryset
    serializer_class = AgentRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter recommendations by user's plots."""
        if getattr(self, 'swagger_fake_view', False) or self.request.user.is_anonymous:
            return AgentRecommendation.objects.none()
        queryset = AgentRecommendation.objects.filter(anomaly__plot__farm__owner=self.request.user)
        plot_id = self.request.query_params.get('plot')
        if plot_id:
            queryset = queryset.filter(anomaly__plot_id=plot_id)
        confidence = self.request.query_params.get('confidence')
        if confidence:
            queryset = queryset.filter(confidence_level=confidence.upper())
        queryset = queryset.select_related('anomaly', 'anomaly__plot', 'anomaly__plot__farm')
        return queryset.order_by('-generated_at')