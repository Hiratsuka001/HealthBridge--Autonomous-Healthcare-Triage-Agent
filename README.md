# HealthBridge: Autonomous Bilingual Healthcare Triage & Emergency Dispatch Agent

**Theme:** Build for Your World  
**Built with Meta's Stack:** Muse Spark Series (`muse-spark-1.3`), SAM 3.1 (`sam-3.1`), and Muse Image (`muse-image-1`)

## The Problem
In Bangladesh and across developing countries, patients face **3.5+ hour average ER wait times** while **67% of ER visits could be resolved safely at local primary clinics or pharmacies** if triaged early. Furthermore, language barriers, panic, and lack of medical literacy cause critical warning signs (like stroke or myocardial infarction presenting as "dizziness") to be missed until it is too late.

## Our Solution
**HealthBridge** is a mobile-first, bilingual (Bengali/English) multimodal triage and emergency response agent that takes patients from symptom onset to verified clinical handoff in under 60 seconds:

1. **The "Missing-Question Engine" & Decision Flip Test (Muse Spark + WHO Protocol RAG):**
   - Conducts dynamic, one-question-at-a-time interviews in spoken or typed Bengali and English grounded in clinician-reviewed WHO pathways.
   - At each turn, selects the single next question most likely to change the safe clinical outcome.
   - Executes a **Decision Flip Test** before finalizing a Mild, Moderate, or Severe verdict:
     - *What unasked information could flip the recommended urgency?*
     - *Has the system explicitly verified that information?*
     - *Safety Guardrail:* Defaults to escalating care rather than offering false reassurance when critical variables are ambiguous.

2. **Visual Symptom & Bystander First-Aid Guidance (SAM 3.1 & Muse Image):**
   - Patients upload photos of visible symptoms (wounds, burns, rashes) or local prescription strips.
   - **SAM 3.1** segments and isolates the injury region for severity context, while **Muse Image** provides visual step-by-step first-aid guidance overlays.

3. **Autonomous Ambulance Voice Dispatch & Smart Facility Routing (Tool Calling):**
   - Uses strict JSON schema enforcement and Google Maps geolocation to route Mild/Moderate cases to nearby pharmacies or outpatient clinics.
   - For **Severe** cases, triggers an automated Bengali voice call to ambulance dispatchers, relaying the clinical triage summary, GPS coordinates, and nearby landmarks.

4. **"Zero-Wait" ER Pre-Arrival Handoff (SOAP Note QR Code):**
   - Compiles the Bengali triage interview and Decision Flip triggers into a standardized English Clinical SOAP Note encoded into a scannable QR code for instant intake.

---

## Quick Start (Local Development)

### 1. Start the FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows CMD/PowerShell: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Start the React (Vite) Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Switching Between Meta API, Open-Weights, and Fallback Mode
Edit `backend/.env`:
- Set `AI_PROVIDER_MODE="meta"` and add your `LLM_API_KEY` to run live against Meta Model API (`https://api.dev.meta.ai/v1`).
- Set `AI_PROVIDER_MODE="mock"` (or let auto-failover handle expired credits) to run the deterministic split-screen demo offline with zero API cost.

---

