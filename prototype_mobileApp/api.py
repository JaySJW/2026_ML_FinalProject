# Backend code
# get only backend part from 'prototype_web'

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

# open .env
load_dotenv()

# Set up Hugging face
hf_token = os.getenv("HF_TOKEN") 
repo_id = "meta-llama/Meta-Llama-3-8B-Instruct"
client = InferenceClient(model=repo_id, token=hf_token)

# Make FastAPI app
app = FastAPI(title="MY_LIST AI Server")

# Initialize the data, getting from the app
class MyListRequest(BaseModel):
    ideal_state: str
    energy_level: int
    moods: list[str]

# Make API endpoint
@app.post("/get-routine")
async def generate_routine(req: MyListRequest):
    
    # exception handling
    ideal_state = req.ideal_state if req.ideal_state.strip() else "Feeling balanced, healthy, and moving forward."
    moods_text = ", ".join(req.moods) if req.moods else "Neutral"

    # detailed task intensity control based on energy (0-10)
    if req.energy_level <= 3:
        task_intensity = "SURVIVAL MODE: Extremely tiny, micro-sized tasks (1 to 3 mins max). Focus solely on basic self-care, grounding, and overcoming inertia. No high cognitive load."
    elif 4 <= req.energy_level <= 7:
        task_intensity = "MAINTENANCE MODE: Manageable, bite-sized tasks (5 to 15 mins). Keep it balanced and steady. Small steps toward the ideal state."
    else:
        task_intensity = "CHALLENGE MODE: Standard tasks (20 to 45 mins). Capitalize on high energy to make concrete progress toward the ideal state."

    # Llama 3 prompt
    system_prompt = f"""You are a compassionate CBT assistant for a user with ADHD. 
    Your task is to bridge the gap between their abstract 'Ideal State' and their CURRENT reality.
    
    CURRENT REALITY:
    - Energy Level: {req.energy_level}/10. Task intensity MUST be: {task_intensity}
    - Current Moods: {moods_text}. Tailor the routine to support or regulate these specific emotions.
    
    CRITICAL RULES:
    1. Output EXACTLY 3 bullet points.
    2. Translate elements of their 'Ideal State' into the tiniest possible physical actions appropriate for their energy level.
    3. Each point MUST start with a relevant Emoji.
    4. Keep it EXTREMELY short: Maximum 6 words per item. Action-oriented phrases only.
    5. DO NOT use full sentences.
    6. Respond strictly in English with NO intro or outro text."""

    user_prompt = f"My Ideal State is: '{ideal_state}'. Give me 3 routines for today based on my energy ({req.energy_level}/10) and mood ({moods_text})."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        # call AI
        response = client.chat_completion(messages=messages, max_tokens=150)
        ai_answer = response.choices[0].message.content
        
        # make python list from text(ai answer)
        routine_list = [line.replace("-", "").replace("*", "").strip() for line in ai_answer.split('\n') if line.strip()]
        
        # return the routine list as JSON (for the app to easily understand)
        return {"status": "success", "routines": routine_list}
        
    except Exception as e:
        # if error, let the app know
        raise HTTPException(status_code=500, detail=str(e))