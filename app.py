import streamlit as st
from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

# open .env
load_dotenv()

# AI setup
hf_token = os.getenv("HF_TOKEN") 
repo_id = "meta-llama/Meta-Llama-3-8B-Instruct"
client = InferenceClient(model=repo_id, token=hf_token)

#________________________________________________________________________________________________

# UI setup
st.set_page_config(page_title="My Daily Routine Tool", page_icon="🌱")
st.title("🌱 My Personalized Routine Maker")
st.write("Describe your ideal self, tell me how you're feeling today, and I'll bridge the gap with a manageable routine.")

#_______________________________________________________________________________________________

# Input - ideal state
st.subheader("✨ My Ideal State")
st.write("What does your ideal life, mindset, or day look like? (Can be abstract or concrete)")
ideal_state = st.text_area(
    "Describe your ideal state here:", 
    placeholder="e.g., I want to be a calm person who consistently works on my art portfolio without feeling rushed or overwhelmed.",
    height=100
)

# Input - personal goals
# st.subheader("🎯 My Ideal State")
# st.write("Enter 3 ")

# col_g1, col_g2, col_g3 = st.columns(3)
# with col_g1:
#     goal1 = st.text_input("Goal 1", placeholder="e.g., 30 min workout")
# with col_g2:
#     goal2 = st.text_input("Goal 2", placeholder="e.g., Study Python")
# with col_g3:
#     goal3 = st.text_input("Goal 3", placeholder="e.g., Keep room clean")

# Input - what Ive got to do
# st.subheader("What I've got to do")
# st.write("Write EVERYTHING you need to do today, big or small.")

st.divider()

#______________________________________________________________________________________________

# Input - current state (detailed)
st.subheader("🌡️ Today's Condition")

col1, col2 = st.columns(2)

with col1:
    # 0-10 Energy Slider
    energy_level = st.slider("⚡ Energy Level (0: Empty, 10: Full)", min_value=0, max_value=10, value=5)

with col2:
    # emotion list
    emotion_options = [
        "Calm", # [cite: 1]
        "Relaxed", # [cite: 48]
        "Happy", # [cite: 129]
        "Confident", # 
        "Hopeful", # [cite: 109]
        "Stressed", # [cite: 12]
        "Anxious", # [cite: 20]
        "Overwhelm", # [cite: 53]
        "Exhausted", # 
        "Frustrated", # [cite: 66]
        "Sad", # [cite: 113]
        "Lonely", # [cite: 172]
        "Numb", # [cite: 13, 217]
        "Achy" # [cite: 214]
    ]
    # multiselect for emotions
    moods = st.multiselect("🧠 Current Mood/Emotion (Select 1-3)", options=emotion_options, max_selections=3)

# Input - current state (simple)
# st.subheader("🌡️ Today's State")
# col1, col2 = st.columns(2)
# with col1:
#     mood = st.select_slider("How is your mood today?", options=["Low", "Mid", "High"], value="Mid")
# with col2:
#     energy = st.select_slider("How is your energy today?", options=["Low", "Mid", "High"], value="Mid")

st.divider()

#_______________________________________________________________________________________________

# Button and call AI
if st.button("Get Today's Custom Routine"):
    
    # exception handling: if ideal state is empty, set a default one
    if not ideal_state.strip():
        ideal_state = "Feeling balanced, healthy, and moving forward."
    
    # if not moods:
    moods_text = ", ".join(moods) if moods else "Neutral"

    # detailed task intensity control based on energy (0-10)
    if energy_level <= 3:
        task_intensity = "SURVIVAL MODE: Extremely tiny, micro-sized tasks (1 to 3 mins max). Focus solely on basic self-care, grounding, and overcoming inertia. No high cognitive load."
    elif 4 <= energy_level <= 7:
        task_intensity = "MAINTENANCE MODE: Manageable, bite-sized tasks (5 to 15 mins). Keep it balanced and steady. Small steps toward the ideal state."
    else: # 8-10
        task_intensity = "CHALLENGE MODE: Standard tasks (20 to 45 mins). Capitalize on high energy to make concrete progress toward the ideal state."

    with st.spinner('Llama 3 is designing a routine connecting your current state to your ideal state... 💭'):
        
        # interpret ideal state and tailor to emotions
        system_prompt = f"""You are a compassionate CBT assistant for a user with ADHD. 
        Your task is to bridge the gap between their abstract 'Ideal State' and their CURRENT reality.
        
        CURRENT REALITY:
        - Energy Level: {energy_level}/10. Therefore, task intensity MUST be: {task_intensity}
        - Current Moods: {moods_text}. You MUST tailor the routine to support or regulate these specific emotions (e.g., add grounding if anxious, rest if exhausted).
        
        CRITICAL RULES:
        1. Output EXACTLY 3 bullet points.
        2. Translate elements of their 'Ideal State' into the tiniest possible physical actions appropriate for their energy level.
        3. Each point MUST start with a relevant Emoji.
        4. Keep it EXTREMELY short: Maximum 6 words per item. Action-oriented phrases only.
        5. DO NOT use full sentences.
        6. Respond strictly in English with NO intro or outro text."""

        user_prompt = f"My Ideal State is: '{ideal_state}'. Give me 3 routines for today based on my energy ({energy_level}/10) and mood ({moods_text})."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = client.chat_completion(messages=messages, max_tokens=150)
            ai_answer = response.choices[0].message.content
            
            st.success("Ta-da! Here is your custom routine tailored to your energy and mood.")
            st.write("### 📝 Today's Micro-Steps")
            
            lines = ai_answer.split('\n')
            for line in lines:
                if line.strip():
                    clean_line = line.replace("-", "").replace("*", "").strip()
                    st.checkbox(f"**{clean_line}**")
                    
        except Exception as e:
            st.error("Oops, an error occurred! Please check your connection or .env setup. \nError details: " + str(e))