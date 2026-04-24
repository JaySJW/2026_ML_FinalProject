# 🌱 ML-Driven Daily Support Tool for ADHD & Learning Difficulties
**By [Jiwon Shon]**

> A CBT-informed, adaptive micro-routine generator for people whose daily energy and focus fluctuate.

---

## 📖 Overview

Most productivity apps assume users have consistent capacity. This project starts from the opposite assumption: **capacity varies day by day, and the same goal needs differently-sized actions depending on today's state.**

The app takes an abstract "ideal self" statement, collects the user's current energy (0–10) and mood, and returns three tiny, mood-aware, capacity-appropriate actions. An adaptive layer then learns from past completion patterns and adjusts future suggestions accordingly.

The design is **autoethnographic** — it began as a tool the developer needed for themselves, and was then generalised into a prototype usable by others navigating ADHD, learning difficulties, anxiety, or burnout.

---

## ✨ Key Features

### 🎯 Dynamic Checklist
The same goal produces different intensity tasks based on today's energy level:
- **SURVIVAL MODE** (energy 0–3) → 1–3 minute micro-tasks
- **MAINTENANCE MODE** (energy 4–7) → 5–15 minute bite-sized tasks
- **CHALLENGE MODE** (energy 8–10) → 20–45 minute standard tasks

### 👤 Personalised Onboarding
On first launch, six quick questions collect persistent context — name, age range, main challenges, current role, what drains the user, and what grounds them. This profile is injected into every subsequent prompt.

### 📊 Session History & Insight Card
Every generation is stored locally. The app shows a real-time summary card of the user's last 7 days: days tracked, average energy, completion rate, and most frequent moods.

### 🔁 Two-Layer Adaptive System
The heart of the project. Before the LLM is called, a rule-based layer analyses recent patterns and can override the mode:
- **Low recent completion (<40%)** → intensity is stepped down (e.g. MAINTENANCE → SURVIVAL)
- **Chronically low energy (avg <3.5)** → forces restorative tasks
- **High consistency (≥80%, energy ≥6)** → allows a slight step up

This creates a closed feedback loop: *user actions → stored data → pattern analysis → next-day adaptation.*

### 🎬 Demo Mode
A "Load demo data" button seeds 7 days of realistic fake history, letting the adaptive features be demonstrated immediately without waiting for organic data to accumulate.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile UI | React Native + Expo |
| Navigation | React Navigation (native-stack) |
| Local storage | @react-native-async-storage/async-storage |
| Backend framework | FastAPI (Python) |
| ASGI server | Uvicorn |
| Data validation | Pydantic |
| LLM | Meta Llama 3 8B Instruct (via Hugging Face Inference API) |
| Language | TypeScript / JavaScript (frontend), Python (backend) |

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- A **Hugging Face account** with access to `meta-llama/Meta-Llama-3-8B-Instruct`
- iPhone or Android phone with the **Expo Go** app (on the same Wi-Fi as your development machine)

---

### 1. Backend (FastAPI)

```bash
cd prototype_mobileApp/backend

# Create and activate virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file with your Hugging Face token
# HF_TOKEN=hf_xxxxxxxxxxxxxxxx

# Run the server (listen on all interfaces so the phone can reach it)
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

Verify by opening `http://localhost:8000/docs` in a browser. You should see Swagger UI with `GET /` and `POST /get-routine`.

---

### 2. Frontend (React Native + Expo)

In a separate terminal:

```bash
cd prototype_mobileApp/frontend

# Install dependencies
npm install

# Start the Expo dev server
npx expo start
```

A QR code appears. Open the Camera app on iPhone (or Expo Go on Android) and scan it.

> ⚠️ **Before running, edit `screens/HomeScreen.js`** and change the `API_URL` constant at the top to your development machine's local IPv4 address (e.g. `http://192.168.1.x:8000/get-routine`). Run `ipconfig` (Windows) or `ifconfig` (macOS) to find it.

---

## 🧪 Demo Flow (for evaluation)

The app ships with a "Load demo data" button for immediate demonstration of the adaptive features. Recommended flow:

1. Complete onboarding (any answers).
2. On the home screen, scroll down and tap **"Load demo data"** — this seeds 7 days of history with a low completion rate.
3. Set **Energy = 7** (this would normally trigger MAINTENANCE mode).
4. Pick any mood and tap **"Get Today's Custom Routine"**.
5. Observe the adaptive override in action:
   - Mode shows **SURVIVAL MODE**  
   - A small tag shows `(adjusted from MAINTENANCE MODE)`  
   - A note appears: *"Recent completion has been low — today is eased to survival mode."*

This demonstrates the rule-based adaptation layer overriding the energy-based default, driven by the user's actual usage pattern.

---

## 🙏 Acknowledgements

- **Meta AI** for the Llama 3 open model  
- **Hugging Face** for Inference API access  
- **FastAPI, Expo, and React Native** communities for excellent documentation  
- **Module tutor** for feedback on the autoethnographic direction and ML scope

---

## 📝 License

This project is a student submission for academic assessment. Code is provided for review purposes; external reuse should credit the original author.

---

