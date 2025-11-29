from rest_framework import serializers
from .models import FarmProfile, FieldPlot, SensorReading, AnomalyEvent, AgentRecommendation
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class FarmProfileSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    class Meta:
        model = FarmProfile
        fields = '__all__'

class FieldPlotSerializer(serializers.ModelSerializer):
    farm = FarmProfileSerializer(read_only=True)
    farm_id = serializers.PrimaryKeyRelatedField(
        queryset=FarmProfile.objects.all(), source='farm', write_only=True
    )

    class Meta:
        model = FieldPlot
        fields = '__all__'

class SensorReadingSerializer(serializers.ModelSerializer):
    plot_id = serializers.PrimaryKeyRelatedField(
        queryset=FieldPlot.objects.all(), source='plot', write_only=True
    )
    plot = FieldPlotSerializer(read_only=True)

    class Meta:
        model = SensorReading
        fields = '__all__'
        read_only_fields = ['timestamp', 'source']

class AnomalyEventSerializer(serializers.ModelSerializer):
    plot = FieldPlotSerializer(read_only=True)

    class Meta:
        model = AnomalyEvent
        fields = '__all__'
        read_only_fields = ['timestamp', 'confidence', 'details']

class AgentRecommendationSerializer(serializers.ModelSerializer):
    anomaly = AnomalyEventSerializer(read_only=True)

    class Meta:
        model = AgentRecommendation
        fields = '__all__'
        read_only_fields = ['generated_at']