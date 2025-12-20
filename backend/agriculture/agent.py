from .models import AnomalyEvent, AgentRecommendation, FarmProfile
import logging

logger = logging.getLogger(__name__)

# ================= KNOWLEDGE BASE =================
# 3malna rule based agent . konna najmou netriniwh amma ynajjem ybeddedel batrcha hajet 
# Keys: Crop Type (lowercase) -> Anomaly Type -> Severity -> (Action, Explanation Template)

KNOWLEDGE_BASE = {
    "generic": {
        "LOW_MOISTURE": {
            "critical": ("IMMEDIATE IRRIGATION REQUIRED", "Critical moisture deficit ({value}%). Crops are at high risk of permanent wilting. Act immediately."),
            "warning": ("Schedule Irrigation Soon", "Moisture levels are dropping ({value}%). Plan irrigation within 24 hours to prevent stress."),
            "default": ("Check Moisture Sensors", "Abnormal moisture levels detected ({value}%). Verify sensor calibration."),
        },
        "HEAT": {
            "critical": ("ACTIVATE COOLING / SHADING", "Extreme heat ({value}°C) detected. Risk of heat stress and flower abortion."),
            "warning": ("Increase Watering Frequency", "High temperatures ({value}°C) observed. Increase water to help crops transpire."),
            "default": ("Monitor Temperature", "Temperature rising ({value}°C). Keep an eye on crop status."),
        },
        "DROP": {
            "critical": ("EMERGENCY SYSTEM INSPECTION", "Sudden moisture drop ({value}%). Likely pipe rupture or pump failure. Stop system and inspect."),
            "warning": ("Check for Leaks", "Rapid moisture decrease ({value}%). Inspect laterals and emitters for leaks."),
            "default": ("Inspect Irrigation System", "Sudden change in sensor readings. Possible technical issue."),
        }
    },
    # Specific overrides for crops
    "wheat": {
        "LOW_MOISTURE": {
            "critical": ("EMERGENCY IRRIGATION (Booting/Heading Stage)", "Wheat is extremely sensitive to drought during heading. Yield loss inevitable without water now ({value}%)."),
        }
    },
    "corn": {
        "HEAT": {
            "critical": ("IRRIGATE TO COOL CANOPY", "Corn pollen becomes sterile above 35°C. Current temp {value}°C puts pollination at risk."),
        }
    },
    "tomato": {
        "LOW_MOISTURE": {
            "warning": ("Increase Drip Irrigation Frequency", "Tomatoes require consistent moisture to prevent Blossom End Rot. Current: {value}%."),
        }
    }
}

def generate_recommendation(anomaly: AnomalyEvent, language: str = "en"):
    """
    Generates a deterministic, context-aware recommendation.
    """
    try:
        # 1. Extract Context
        plot = anomaly.plot
        farm = plot.farm
        crop_type = farm.crop_type.lower() if farm.crop_type else "generic"
        
        # Normalize inputs
        a_type = anomaly.anomaly_type  # e.g., LOW_MOISTURE
        severity = anomaly.severity.lower()  # e.g., high -> critical mapping needed? 
        # Map DB severity (LOW, MEDIUM, HIGH) to KB keys (warning, critical)
        severity_map = {
            "HIGH": "critical",
            "MEDIUM": "warning",
            "LOW": "warning" 
        }
        kb_severity = severity_map.get(anomaly.severity, "default")
        
        # Get triggering value for templates
        details = anomaly.details
        trigger_value = details.get('trigger_value', details.get('value', '?'))
        if a_type == 'HEAT':
             trigger_value = details.get('temperature', trigger_value)
        
        # 2. Rule Matching Engine
        
        # Try finding specific crop rule first
        rules = KNOWLEDGE_BASE.get(crop_type, {})
        type_rules = rules.get(a_type, {})
        recommendation_pair = type_rules.get(kb_severity)
        
        # Fallback 1: Generic crop rules (if crop mismatch)
        if not recommendation_pair:
            recommendation_pair = KNOWLEDGE_BASE["generic"].get(a_type, {}).get(kb_severity)
            
        # Fallback 2: Default Generic for ANY severity
        if not recommendation_pair:
             recommendation_pair = KNOWLEDGE_BASE["generic"].get(a_type, {}).get("default")
             
        # Fallback 3: Total Fallback
        if not recommendation_pair:
            recommendation_pair = ("Investigate Anomaly", f"An anomaly of type {a_type} was detected. Please inspect plot {plot.name}.")

        action_template, explanation_template = recommendation_pair

        # 3. Format Explanation
        explanation = explanation_template.format(value=trigger_value, crop=farm.crop_type, plot=plot.name)

        # 4. Save Recommendation
        confidence_level = anomaly.severity # Reuse severity as confidence for the recommendation strength
        
        AgentRecommendation.objects.create(
            anomaly=anomaly,
            recommended_action=action_template,
            explanation=explanation,
            confidence_level=confidence_level
        )

        logger.info(f"🧠 Agent Logic: {crop_type}/{a_type} -> {action_template}")
        
    except Exception as e:
        logger.error(f"Error generating recommendation: {e}")
        # Fail-safe
        AgentRecommendation.objects.create(
            anomaly=anomaly,
            recommended_action="Manual Inspection Required",
            explanation=f"System error generating specific advice. Anomaly: {anomaly.anomaly_type}",
            confidence_level="LOW"
        )
