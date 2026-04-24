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
class UserProfile(BaseModel):
    name: str | None = None
    age_range: str | None = None
    challenges: list[str] = []
    role: str | None = None
    drains: list[str] = []
    grounds: list[str] = []


class HistorySummary(BaseModel):
    days_tracked: int = 0
    avg_energy: float | None = None
    top_moods: list[str] = []
    completion_rate: int | None = None  # 0-100


class RoutineRequest(BaseModel):
    ideal_state: str
    energy_level: int                             # 0-10
    moods: list[str]                              # up to 3 mood tags
    user_profile: UserProfile | None = None       # optional background
    history_summary: HistorySummary | None = None # optional past pattern

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

    # --- 6-2. Energy-based intensity routing (base) ---
    # This is the core "dynamic checklist" logic:
    # the same goal produces different tasks depending on today's capacity.
    INTENSITY_TEXT = {
        "SURVIVAL": (
            "SURVIVAL MODE: Extremely tiny, micro-sized tasks (1 to 3 mins max). "
            "Focus solely on basic self-care, grounding, and overcoming inertia. "
            "No high cognitive load."
        ),
        "MAINTENANCE": (
            "MAINTENANCE MODE: Manageable, bite-sized tasks (5 to 15 mins). "
            "Keep it balanced and steady. Small steps toward the ideal state."
        ),
        "CHALLENGE": (
            "CHALLENGE MODE: Standard tasks (20 to 45 mins). "
            "Capitalize on high energy to make concrete progress toward the ideal state."
        ),
    }

    if req.energy_level <= 3:
        base_mode = "SURVIVAL"
    elif 4 <= req.energy_level <= 7:
        base_mode = "MAINTENANCE"
    else:
        base_mode = "CHALLENGE"

    # --- 6-2a. Adaptive override based on recent pattern ---
    # A rule-based decision layer that can downgrade (or slightly upgrade)
    # the mode *before* we call the LLM, based on the user's real history.
    final_mode = base_mode
    override_reason = None

    if req.history_summary and req.history_summary.days_tracked >= 2:
        h = req.history_summary
        rate = h.completion_rate
        avg_e = h.avg_energy

        # Rule 1: low completion → force one step down
        if rate is not None and rate < 40:
            if base_mode == "CHALLENGE":
                final_mode = "MAINTENANCE"
                override_reason = "low_completion_downgrade"
            elif base_mode == "MAINTENANCE":
                final_mode = "SURVIVAL"
                override_reason = "low_completion_downgrade"
            # already SURVIVAL → stay

        # Rule 2: chronically low energy pattern → bias toward rest
        elif avg_e is not None and avg_e < 3.5 and base_mode != "SURVIVAL":
            final_mode = "SURVIVAL"
            override_reason = "low_energy_pattern"

        # Rule 3: high completion + high energy → allow slight push
        elif rate is not None and rate >= 80 and req.energy_level >= 6 and base_mode == "MAINTENANCE":
            final_mode = "CHALLENGE"
            override_reason = "high_consistency_upgrade"

    task_intensity = INTENSITY_TEXT[final_mode]

    # --- 6-2d. Build adapted note for the UI ---
    adapted_note = None
    if override_reason == "low_completion_downgrade":
        adapted_note = f"Recent completion has been low — today is eased to {final_mode.lower()} mode."
    elif override_reason == "low_energy_pattern":
        adapted_note = "Your recent energy has been consistently low — keeping things restorative."
    elif override_reason == "high_consistency_upgrade":
        adapted_note = "You've been very consistent — leaning into that momentum today."
    elif req.history_summary and req.history_summary.days_tracked >= 2:
        # No override but history exists → gentle acknowledgement
        adapted_note = f"Tailored using your last {req.history_summary.days_tracked} days."

    # --- 6-2b. User background (if provided) ---
    profile_block = ""
    if req.user_profile:
        p = req.user_profile
        parts = []
        if p.name: parts.append(f"Name: {p.name}")
        if p.age_range: parts.append(f"Age range: {p.age_range}")
        if p.role: parts.append(f"Current role: {p.role}")
        if p.challenges:
            parts.append(f"Navigating: {', '.join(p.challenges)}")
        if p.drains:
            parts.append(f"Usually drained by: {', '.join(p.drains)}")
        if p.grounds:
            parts.append(f"Usually grounded by: {', '.join(p.grounds)}")
        if parts:
            profile_block = "\nUSER BACKGROUND:\n- " + "\n- ".join(parts) + "\n"

    # --- 6-2c. History pattern (if provided) ---
    history_block = ""
    if req.history_summary and req.history_summary.days_tracked > 0:
        h = req.history_summary
        hparts = [f"Days tracked: {h.days_tracked}"]
        if h.avg_energy is not None:
            hparts.append(f"Average energy: {h.avg_energy}/10")
        if h.top_moods:
            hparts.append(f"Most frequent moods: {', '.join(h.top_moods)}")
        if h.completion_rate is not None:
            hparts.append(f"Completion rate: {h.completion_rate}%")
        history_block = "\nRECENT PATTERN:\n- " + "\n- ".join(hparts) + "\n"

    # --- 6-3. Prompt engineering ---
    system_prompt = f"""You are a compassionate CBT assistant for a user with ADHD. 
Your task is to bridge the gap between their abstract 'Ideal State' and their CURRENT reality.
{profile_block}{history_block}
CURRENT REALITY:
- Energy Level: {req.energy_level}/10. Therefore, task intensity MUST be: {task_intensity}
- Current Moods: {moods_text}. You MUST tailor the routine to support or regulate these specific emotions (e.g., add grounding if anxious, rest if exhausted).

PERSONALISATION RULES (when background is provided):
- Prefer grounding actions drawn from what the user said grounds them.
- Avoid or minimise task types from what drains them.
- Keep language age-appropriate and aligned with their current role.

ADAPTATION RULES (when recent pattern is provided):
- If recent completion rate is low (<40%), reduce task intensity further — favour the smallest possible wins.
- If recent completion rate is high (>=80%), you may extend slightly within the current energy band.
- If recent average energy has been consistently low, bias toward restorative tasks even today.
- Never reference the history explicitly in the output; the user only sees the 3 bullets.

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
            "mode": f"{final_mode} MODE",
            "base_mode": f"{base_mode} MODE",
            "overridden": base_mode != final_mode,
            "routines": routines,
            "adapted_note": adapted_note,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")