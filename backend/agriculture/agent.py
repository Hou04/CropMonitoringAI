# agriculture/agent.py
# Improved AI agent: More dynamic recommendations with variability and multi-language support

from .models import AnomalyEvent, AgentRecommendation, FarmProfile
from random import choice  # For variability in phrasing

def generate_recommendation(anomaly: AnomalyEvent, language: str = "fr"):
    """
    Generates a recommendation for the anomaly.
    - language: 'fr' for French (default), 'en' for English.
    """
    plot = anomaly.plot
    farm = plot.farm  # Get farm details for crop_type
    type_ = anomaly.anomaly_type
    confidence = anomaly.confidence
    details = anomaly.details
    timestamp = anomaly.timestamp.strftime("%Y-%m-%d %H:%M")  # Formatted time

    # Language-specific templates (action and explanation pairs)
    templates = {
        "LOW_MOISTURE": {
            "fr": [
                ("Démarrer l'irrigation immédiatement + Vérifier le système de pompage", 
                 f"La parcelle '{plot.name}' souffre d'un déficit hydrique critique ({details.get('trigger_value', '?')}% humidité) depuis {timestamp}. Risque élevé de stress hydrique sur les {farm.crop_type}."),
                ("Activer l'arrosage d'urgence et inspecter les capteurs", 
                 f"Niveau d'humidité critique détecté ({details.get('trigger_value', '?')}%) dans '{plot.name}'. Les cultures {farm.crop_type} pourraient être endommagées sans intervention rapide."),
            ],
            "en": [
                ("Start irrigation immediately + Check pumping system", 
                 f"Plot '{plot.name}' is experiencing critical moisture deficit ({details.get('trigger_value', '?')}% humidity) since {timestamp}. High risk of water stress on {farm.crop_type} crops."),
                ("Activate emergency watering and inspect sensors", 
                 f"Critical humidity level detected ({details.get('trigger_value', '?')}%) in '{plot.name}'. {farm.crop_type} crops could be damaged without quick intervention."),
            ]
        },
        "DROP": {
            "fr": [
                ("INSPECTION URGENTE DU SYSTÈME D'IRRIGATION REQUISE", 
                 f"Chute brutale de {details.get('drop_amount', '?')}% détectée en moins d'1 heure (de {details.get('previous_high', '?')} à {details.get('trigger_value', '?')}%) à {timestamp}.\nCause probable : fuite, rupture de canalisation ou panne de pompe dans '{plot.name}'."),
                ("Vérifier immédiatement l'irrigation et les pipes", 
                 f"Baisse soudaine d'humidité ({details.get('drop_amount', '?')}%) observée dans la parcelle '{plot.name}'. Potentiel problème technique ; agissez vite pour {farm.crop_type}."),
            ],
            "en": [
                ("URGENT INSPECTION OF IRRIGATION SYSTEM REQUIRED", 
                 f"Sudden drop of {details.get('drop_amount', '?')}% detected in less than 1 hour (from {details.get('previous_high', '?')} to {details.get('trigger_value', '?')}%) at {timestamp}.\nLikely cause: leak, pipe rupture, or pump failure in '{plot.name}'."),
                ("Immediately check irrigation and pipes", 
                 f"Abrupt moisture decline ({details.get('drop_amount', '?')}%) observed in plot '{plot.name}'. Potential technical issue; act fast for {farm.crop_type}."),
            ]
        },
        "HEAT": {
            "fr": [
                ("Augmenter fréquence d'irrigation + Ombrage d'urgence si possible", 
                 f"Température extrême détectée : {details.get('temperature', '?')}°C à {timestamp}.\nLes plantes {farm.crop_type} dans '{plot.name}' sont en stress thermique sévère. Action immédiate requise."),
                ("Mettre en place ombrage et arroser plus souvent", 
                 f"Chaleur excessive ({details.get('temperature', '?')}°C) menaçant la parcelle '{plot.name}'. Protégez les cultures {farm.crop_type} contre le coup de chaleur."),
            ],
            "en": [
                ("Increase irrigation frequency + Emergency shading if possible", 
                 f"Extreme temperature detected: {details.get('temperature', '?')}°C at {timestamp}.\nPlants {farm.crop_type} in '{plot.name}' are under severe heat stress. Immediate action required."),
                ("Set up shading and water more often", 
                 f"Excessive heat ({details.get('temperature', '?')}°C) threatening plot '{plot.name}'. Protect {farm.crop_type} crops from heatstroke."),
            ]
        },
        "OUTLIER": {
            "fr": [
                ("Vérifier le capteur + Surveillance accrue", 
                 f"Valeur statistiquement anormale détectée (z-score: {details.get('z_score', '?')}) à {timestamp}.\nPossibilité de dysfonctionnement capteur ou événement exceptionnel dans '{plot.name}'."),
                ("Inspecter les capteurs et monitorer étroitement", 
                 f"Anomalie outlier identifiée avec z-score {details.get('z_score', '?')} dans la parcelle '{plot.name}'. Vérifiez l'équipement pour {farm.crop_type}."),
            ],
            "en": [
                ("Check sensor + Increased monitoring", 
                 f"Statistically abnormal value detected (z-score: {details.get('z_score', '?')}) at {timestamp}.\nPossible sensor malfunction or exceptional event in '{plot.name}'."),
                ("Inspect sensors and monitor closely", 
                 f"Outlier anomaly identified with z-score {details.get('z_score', '?')} in plot '{plot.name}'. Check equipment for {farm.crop_type}."),
            ]
        },
        "SENSOR_ERROR": {
            "fr": [
                ("Remplacer ou calibrer le capteur défectueux", 
                 f"Erreur capteur probable détectée à {timestamp} dans '{plot.name}'. Valeur invalide ({details.get('trigger_value', '?')})."),
            ],
            "en": [
                ("Replace or calibrate defective sensor", 
                 f"Likely sensor error detected at {timestamp} in '{plot.name}'. Invalid value ({details.get('trigger_value', '?')})."),
            ]
        },
    }

    # Default if type not found
    if type_ not in templates:
        type_ = "OUTLIER"  # Fallback to outlier

    # Choose a random template for variability
    action, explanation = choice(templates[type_].get(language, templates[type_]["fr"]))

    # Confidence level
    confidence_level = "HIGH" if confidence >= 0.9 else "MEDIUM" if confidence >= 0.7 else "LOW"

    # Create recommendation
    AgentRecommendation.objects.create(
        anomaly=anomaly,
        recommended_action=action,
        explanation=explanation,
        confidence_level=confidence_level
    )

    print(f"🧠 AI RECOMMENDATION GENERATED → {action} (Confidence: {confidence_level})")