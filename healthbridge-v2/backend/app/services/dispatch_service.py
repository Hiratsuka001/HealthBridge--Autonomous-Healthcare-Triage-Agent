import os
import io
import json
import base64
import qrcode
import httpx
from xml.sax.saxutils import escape as xml_escape
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

def _fallback_facilities(severity: str) -> list:
    if severity == "Severe":
        return [
            {
                "name": "Dhaka Medical College Hospital (Emergency Care Unit)",
                "type": "Specialized Trauma & Cardiac ER",
                "distance": "2.4 km",
                "eta": "11 mins",
                "landmark": "Near Shaheed Minar / Bakshibazar Gate",
                "phone": "+8801711000999"
            },
            {
                "name": "NICVD (National Institute of Cardiovascular Diseases)",
                "type": "Cardiac Emergency ER",
                "distance": "3.1 km",
                "eta": "14 mins",
                "landmark": "Sher-e-Bangla Nagar, College Gate",
                "phone": "+8801711000888"
            }
        ]
    elif severity == "Moderate":
        return [
            {
                "name": "Brac Healthcare Outpatient Clinic",
                "type": "Primary Care Clinic",
                "distance": "0.9 km",
                "eta": "5 mins",
                "landmark": "Mohakhali Wireless Gate",
                "phone": "+8809678191919"
            }
        ]
    else:
        return [
            {
                "name": "Lazz Pharma (24/7 Registered Pharmacist)",
                "type": "Local Pharmacy & ORS Station",
                "distance": "0.3 km",
                "eta": "2 mins",
                "landmark": "Main Road Corner, beside City Bank ATM",
                "phone": "+8801700000111"
            }
        ]

async def find_nearby_facilities(severity: str, lat: float = 23.7771, lng: float = 90.3994) -> list:
    """
    Uses Google Maps Places API to match the patient's severity to nearby
    pharmacies (Mild), local clinics (Moderate), or specialized ERs (Severe).
    """
    gmaps_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    provider_mode = os.getenv("AI_PROVIDER_MODE", "mock")

    # Realistic Dhaka facilities fallback for Mock Mode or missing API key
    if provider_mode == "mock" or not gmaps_key or gmaps_key == "your_google_maps_key":
        return _fallback_facilities(severity)

    # Live Google Maps Places API query with auto-fallback
    place_type = "hospital" if severity in ["Severe", "Moderate"] else "pharmacy"
    url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lng}&radius=3000&type={place_type}&key={gmaps_key}"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            data = resp.json()
            if resp.status_code != 200 or data.get("status") not in ["OK", "ZERO_RESULTS"]:
                return _fallback_facilities(severity)
            results = []
            for place in data.get("results", [])[:3]:
                results.append({
                    "name": place.get("name"),
                    "type": place_type.capitalize(),
                    "distance": "Nearby",
                    "eta": "< 15 mins",
                    "landmark": place.get("vicinity", "Dhaka"),
                    "phone": "999"
                })
            return results or _fallback_facilities(severity)
    except Exception:
        return _fallback_facilities(severity)

async def get_ambulance_route(
    start_lat: float = 23.7258,
    start_lng: float = 90.3976,
    dest_lat: float = 23.7250,
    dest_lng: float = 90.3975
) -> dict:
    """
    Returns real road network waypoints and driving time from Geoapify Routing API.
    Falls back to interpolated road points if offline or without key.
    """
    geo_key = os.getenv("GEOAPIFY_API_KEY", "")
    if geo_key and not geo_key.startswith("your_"):
        url = (
            f"https://api.geoapify.com/v1/routing"
            f"?waypoints={start_lat},{start_lng}|{dest_lat},{dest_lng}&mode=drive&apiKey={geo_key}"
        )
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    features = data.get("features", [])
                    if features:
                        raw_coords = features[0].get("geometry", {}).get("coordinates", [[]])[0]
                        props = features[0].get("properties", {})
                        # Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
                        leaflet_coords = [[c[1], c[0]] for c in raw_coords]
                        return {
                            "coordinates": leaflet_coords,
                            "distance_meters": props.get("distance", 1200),
                            "time_seconds": props.get("time", 360),
                            "source": "Geoapify Live Road Routing"
                        }
        except Exception as e:
            print(f"[Geoapify Route Error] {e}")

    # Fallback simulated road coordinates across Old Dhaka (Bakshibazar to DMCH)
    steps = 15
    sim_coords = [
        [
            start_lat + (dest_lat - start_lat) * (i / steps),
            start_lng + (dest_lng - start_lng) * (i / steps)
        ]
        for i in range(steps + 1)
    ]
    return {
        "coordinates": sim_coords,
        "distance_meters": 1400,
        "time_seconds": 420,
        "source": "Simulated Route Fallback"
    }

def generate_soap_qr_packet(
    conversation_history: list,
    severity: str,
    decision_flip_info: str,
    vitals: Optional[Dict[str, Any]] = None,
    esi_level: Optional[int] = None
) -> dict:
    """
    Compiles the Bengali/English interview into a standardized English Clinical SOAP Note
    and encodes it into a scan-ready Base64 QR code for instant ER nurse intake.
    """
    user_statements = [m["content"] for m in conversation_history if m.get("role") == "user"]
    symptom_summary = " | ".join(user_statements) if user_statements else "Acute symptom presentation"

    assigned_esi = f"ESI Level {esi_level}" if esi_level else ("ESI Level 2 (Emergent)" if severity.upper() == "SEVERE" else "ESI Level 4 (Routine)")

    vitals_objective = (
        f"HR {vitals.get('heart_rate', 75)} bpm | BP {vitals.get('systolic_bp', 120)}/{vitals.get('diastolic_bp', 80)} mmHg | SpO2 {vitals.get('spo2', 98)}% | Temp {vitals.get('temperature', 37.0)}°C | AVPU: {vitals.get('avpu', 'Alert')} | NEWS2 Score: {vitals.get('news2_score', 0)}"
        if vitals else
        "Bilingual AI Triage completed. Visual/Red-flag check executed."
    )

    soap_note = {
        "protocol": "HealthBridge Zero-Wait ER Pre-Arrival Intake",
        "triage_severity": severity.upper(),
        "esi_level": assigned_esi,
        "subjective": f"Patient reported: {symptom_summary}",
        "objective": vitals_objective,
        "assessment": f"Decision Flip Trigger: {decision_flip_info}",
        "plan": (
            "Immediate ER Triage Bypass - Direct to Resuscitation/Acute Bay"
            if severity.upper() == "SEVERE"
            else "Outpatient / Primary Clinic Review"
        )
    }

    # Generate QR Code image in memory
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(json.dumps(soap_note, ensure_ascii=False))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return {
        "soap_note": soap_note,
        "qr_code_data_url": f"data:image/png;base64,{qr_base64}"
    }

async def trigger_ambulance_voice_dispatch(facility: dict, soap_note: dict, lat: float, lng: float) -> dict:
    """
    Generates the Bengali voice script and triggers (or simulates in mock mode)
    the automated Twilio voice call to the ambulance dispatcher with GPS landmarks.
    shortcut: direct Twilio REST POST without the twilio SDK package; upgrade to official SDK if adding status webhooks
    """
    landmark = facility.get("landmark", "Near main road")
    voice_script_bn = (
        f"জরুরি অ্যাম্বুলেন্স ডিসপ্যাচ। হেলথ-ব্রিজ এআই কথা বলছি। "
        f"একজন গুরুতর রোগী ({soap_note['assessment']}) সাহায্য চাইছেন। "
        f"লোকেশন ল্যান্ডমার্ক: {landmark}, জিপিএস: {lat}, {lng}। "
        f"রোগীকে দ্রুত {facility['name']}-এ নেওয়া প্রয়োজন।"
    )
    voice_script_en = (
        f"Emergency Ambulance Dispatch from HealthBridge AI. "
        f"Critical patient ({soap_note['assessment']}). "
        f"Landmark: {landmark} (GPS: {lat}, {lng}). "
        f"Routing to {facility['name']}."
    )

    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_phone = os.getenv("TWILIO_FROM_PHONE", "")
    to_phone = os.getenv("EMERGENCY_DISPATCH_PHONE", facility.get("phone", "+8801711000999"))
    provider_mode = os.getenv("AI_PROVIDER_MODE", "mock")

    call_status = "VOICE_CALL_SIMULATED (Mock Mode)"
    call_sid = None

    if (
        provider_mode != "mock"
        and account_sid
        and not account_sid.startswith("your_")
        and auth_token
        and not auth_token.startswith("your_")
        and from_phone
    ):
        escaped_script_bn = xml_escape(voice_script_bn)
        twiml = f"<Response><Say language='bn-IN'>{escaped_script_bn}</Say></Response>"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json",
                    auth=(account_sid, auth_token),
                    data={"To": to_phone, "From": from_phone, "Twiml": twiml}
                )
                if res.status_code in [200, 201]:
                    call_status = "VOICE_CALL_DISPATCHED"
                    call_sid = res.json().get("sid")
                else:
                    call_status = f"TWILIO_API_ERROR_{res.status_code}"
        except Exception as e:
            call_status = f"DISPATCH_ERROR: {str(e)}"

    return {
        "dispatch_status": call_status,
        "call_sid": call_sid,
        "target_dispatcher": facility.get("name"),
        "dispatcher_phone": to_phone,
        "twiml_bengali_script": voice_script_bn,
        "english_transcript": voice_script_en
    }

