import os
import unittest
import asyncio
from app.services.llm_engine import _fallback_triage_logic
from app.services.dispatch_service import (
    generate_soap_qr_packet,
    find_nearby_facilities,
    trigger_ambulance_voice_dispatch,
)

class TestHealthBridgeTriage(unittest.TestCase):
    def test_chest_pain_with_negation_in_sentence(self):
        """Verifies 'not' in user sentence does not accidentally suppress chest pain red flags."""
        history = [
            {"role": "user", "content": "I am not feeling well and my chest hurts"}
        ]
        res = _fallback_triage_logic(history)
        self.assertEqual(res.current_severity, "Severe")
        self.assertTrue(res.is_triage_complete)
        self.assertTrue(res.decision_flip_test.should_escalate)

    def test_explicitly_negated_chest_pain(self):
        """Verifies true chest pain negation properly completes the non-severe pathway."""
        history = [
            {"role": "user", "content": "আমার সকাল থেকে মাথা ঘুরছে (I feel dizzy since morning)"},
            {"role": "assistant", "content": "আপনার কি বুকে কোনো চাপ বা কথা জড়িয়ে যাওয়ার সমস্যা আছে?"},
            {"role": "user", "content": "না, বুকে কোনো ব্যথা নেই! সকাল থেকে রোদে ছিলাম আর নাস্তা করিনি"}
        ]
        res = _fallback_triage_logic(history)
        self.assertEqual(res.current_severity, "Mild")
        self.assertTrue(res.is_triage_complete)
        self.assertFalse(res.decision_flip_test.should_escalate)

    def test_critical_stroke_cardiac_symptoms(self):
        """Verifies severe neurological and cardiac symptoms immediately escalate."""
        history = [
            {"role": "user", "content": "আমার হঠাৎ খুব মাথা ঘুরছে"},
            {"role": "assistant", "content": "বুকে চাপ বা কথা বলতে সমস্যা হচ্ছে?"},
            {"role": "user", "content": "হ্যাঁ, আমার বুকে প্রচণ্ড চাপ লাগছে এবং কথা জড়িয়ে আসছে"}
        ]
        res = _fallback_triage_logic(history)
        self.assertEqual(res.current_severity, "Severe")
        self.assertTrue(res.is_triage_complete)
        self.assertTrue(res.decision_flip_test.should_escalate)

    def test_ambiguous_turn1_does_not_default_to_safe(self):
        """Verifies turn 1 requires follow-up question and does not mark triage complete."""
        history = [
            {"role": "user", "content": "আমার মাথা ঘুরছে"}
        ]
        res = _fallback_triage_logic(history)
        self.assertFalse(res.is_triage_complete)
        self.assertIsNotNone(res.next_question)
        self.assertTrue(res.decision_flip_test.should_escalate)

    def test_soap_qr_packet_generation(self):
        """Verifies SOAP note structure and base64 PNG QR code output."""
        history = [{"role": "user", "content": "Acute chest pain"}]
        packet = generate_soap_qr_packet(history, "Severe", "Cardiac warning sign")
        self.assertIn("soap_note", packet)
        self.assertEqual(packet["soap_note"]["triage_severity"], "SEVERE")
        self.assertTrue(packet["qr_code_data_url"].startswith("data:image/png;base64,"))

    def test_ambulance_voice_dispatch_simulation(self):
        """Verifies emergency ambulance voice dispatch script formatting."""
        facility = {
            "name": "Dhaka Medical College Hospital",
            "landmark": "Shaheed Minar",
            "phone": "+8801711000999"
        }
        soap_note = {"assessment": "Possible Myocardial Infarction"}
        result = asyncio.run(trigger_ambulance_voice_dispatch(facility, soap_note, 23.7771, 90.3994))

        self.assertIn("dispatch_status", result)
        self.assertIn("Dhaka Medical College Hospital", result["twiml_bengali_script"])
        self.assertIn("23.7771", result["twiml_bengali_script"])
        self.assertIn("Possible Myocardial Infarction", result["english_transcript"])

if __name__ == "__main__":
    unittest.main()
