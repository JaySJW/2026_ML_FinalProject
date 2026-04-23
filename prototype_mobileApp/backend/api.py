# ==========================================
# ADHD Routine AI - FastAPI Backend
# ==========================================
# This is the "brain" server that receives user inputs
# from the mobile app, calls Llama 3 via Hugging Face,
# and returns a personalized micro-routine as JSON.
# ==========================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

# ------------------------------------------
# 1. Environment setup
# ------------------------------------------
load_dotenv()
hf_token = os.getenv("HF_TOKEN")
repo_id = "meta-llama/Meta-Llama-3-8B-Instruct"
client = InferenceClient(model=repo_id, token=hf_token)

# ------------------------------------------
# 2. FastAPI app initialization
# ------------------------------------------
app = FastAPI(
    title="ADHD Routine AI Server",
    description="CBT-based micro-routine generator for ADHD & learning difficulties",
    version="1.0.0"
)

# ------------------------------------------
# 3. CORS setup
# ------------------------------------------
# This allows the mobile app (running on a different origin)
# to call this API without being blocked by the browser/network.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # prototype scope: allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------
# 4. Request schema (what the app sends us)
# ------------------------------------------
class RoutineRequest(BaseModel):
    ideal_state: str
    energy_level: int           # 0-10
    moods: list[str]            # up to 3 mood tags

# ------------------------------------------
# 5. Health check endpoint (for testing)
# ------------------------------------------
@app.get("/")
async def root():
    return {"status": "online", "message": "ADHD Routine AI Server is running 🌱"}

# ------------------------------------------
# 6. Main routine generation endpoint
# ------------------------------------------
@app.post("/get-routine")
async def generate_routine(req: RoutineRequest):
    # --- 6-1. Defensive defaults ---
    ideal_state = req.ideal_state.strip() if req.ideal_state.strip() \
        else "Feeling balanced, healthy, and moving forward."
    moods_text = ", ".join(req.moods) if req.moods else "Neutral"

    # --- 6-2. Energy-based intensity routing ---
    # This is the core "dynamic checklist" logic:
    # the same goal produces different tasks depending on today's capacity.
    if req.energy_level <= 3:
        task_intensity = (
            "SURVIVAL MODE: Extremely tiny, micro-sized tasks (1 to 3 mins max). "
            "Focus solely on basic self-care, grounding, and overcoming inertia. "
            "No high cognitive load."
        )
    elif 4 <= req.energy_level <= 7:
        task_intensity = (
            "MAINTENANCE MODE: Manageable, bite-sized tasks (5 to 15 mins). "
            "Keep it balanced and steady. Small steps toward the ideal state."
        )
    else:  # 8-10
        task_intensity = (
            "CHALLENGE MODE: Standard tasks (20 to 45 mins). "
            "Capitalize on high energy to make concrete progress toward the ideal state."
        )

    # --- 6-3. Prompt engineering ---
    system_prompt = f"""You are a compassionate CBT assistant for a user with ADHD. 
Your task is to bridge the gap between their abstract 'Ideal State' and their CURRENT reality.

CURRENT REALITY:
- Energy Level: {req.energy_level}/10. Therefore, task intensity MUST be: {task_intensity}
- Current Moods: {moods_text}. You MUST tailor the routine to support or regulate these specific emotions (e.g., add grounding if anxious, rest if exhausted).

CRITICAL RULES:
1. Output EXACTLY 3 bullet points.
2. Translate elements of their 'Ideal State' into the tiniest possible physical actions appropriate for their energy level.
3. Each point MUST start with a relevant Emoji.
4. Keep it EXTREMELY short: Maximum 6 words per item. Action-oriented phrases only.
5. DO NOT use full sentences.
6. Respond strictly in English with NO intro or outro text."""

    user_prompt = (
        f"My Ideal State is: '{ideal_state}'. "
        f"Give me 3 routines for today based on my energy "
        f"({req.energy_level}/10) and mood ({moods_text})."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    # --- 6-4. Call the model ---
    try:
        response = client.chat_completion(messages=messages, max_tokens=150)
        raw = response.choices[0].message.content

        # Clean up bullets / stars / blank lines into a neat list
        routines = [
            line.replace("-", "").replace("*", "").strip()
            for line in raw.split("\n")
            if line.strip()
        ]

        return {
            "status": "success",
            "mode": task_intensity.split(":")[0],   # "SURVIVAL MODE" etc.
            "routines": routines,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")