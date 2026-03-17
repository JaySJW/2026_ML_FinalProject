import streamlit as st
from huggingface_hub import InferenceClient

# AI setup
hf_token = "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"
repo_id = "meta-llama/Meta-Llama-3-8B-Instruct"
client = InferenceClient(model=repo_id, token=hf_token)

# UI setup
st.set_page_config(page_title="My Daily Routine Tool", page_icon="🌱")
st.title("🌱 My Personalized Routine Maker")
st.write("Tell me your goals and your current state, and I'll craft a manageable routine just for you!")
st.divider()

# Input - personal goals
st.subheader("🎯 My Goals")
st.write("Enter 3 long-term goals or habits you want to build.")

col_g1, col_g2, col_g3 = st.columns(3)
with col_g1:
    goal1 = st.text_input("Goal 1", placeholder="e.g., 30 min workout")
with col_g2:
    goal2 = st.text_input("Goal 2", placeholder="e.g., Study Python")
with col_g3:
    goal3 = st.text_input("Goal 3", placeholder="e.g., Keep room clean")

st.divider()

# Input - current state
st.subheader("🌡️ Today's State")
col1, col2 = st.columns(2)
with col1:
    mood = st.select_slider("How is your mood today?", options=["Low", "Mid", "High"], value="Mid")
with col2:
    energy = st.select_slider("How is your energy today?", options=["Low", "Mid", "High"], value="Mid")
st.divider()

# Button and call AI
if st.button("Get Today's Custom Routine"):
    
    # Goals list
    goals_list = [g for g in [goal1, goal2, goal3] if g.strip()]
    goals_text = ", ".join(goals_list) if goals_list else "Maintain general health and productivity"

    # Adjust task intensity
    if energy == "Low" or mood == "Low":
        task_intensity = "extremely tiny, micro-sized tasks (1 to 5 mins max)"
    elif energy == "High" and mood == "High":
        task_intensity = "standard, moderately challenging tasks (20 to 45 mins)"
    else:
        task_intensity = "manageable, bite-sized tasks (10 to 15 mins)"

    with st.spinner('Llama 3 is analyzing your goals and condition to create your routine... 💭'):
        
        # Control pormpt with clear instructions
        messages = [
            {"role": "system", "content": f"""You are a helpful CBT assistant for a user with ADHD. Break down the user's long-term goals into 3 daily routines.
            Based on the user's current capacity, the task intensity MUST be: {task_intensity}.
            
            CRITICAL RULES:
            1. Output EXACTLY 3 bullet points.
            2. Each point MUST start with a relevant Emoji.
            3. Keep it EXTREMELY short: Maximum 5 words per item. Action-oriented phrases only.
            4. DO NOT use full sentences. (e.g., '🏃‍♂️ Walk for 5 mins' or '💻 Open laptop')
            5. Respond strictly in English with NO intro or outro text."""},
            {"role": "user", "content": f"My current goals are: {goals_text}. Today, my energy level is '{energy}' and my mood is '{mood}'. Recommend 3 daily routines for TODAY."}
        ]
        
        try:
            response = client.chat_completion(messages=messages, max_tokens=150)
            ai_answer = response.choices[0].message.content
            
            st.success("Ta-da! Here is your custom routine for today.")
            st.write("### 📝 Daily Checklist")
            
            lines = ai_answer.split('\n')
            for line in lines:
                if line.strip():
                    # remove 
                    clean_line = line.replace("-", "").replace("*", "").strip()
                    
                    # bold
                    st.checkbox(f"**{clean_line}**")
                    
        except Exception as e:
            st.error("Oops, an error occurred! Please check your token or Llama 3 access. \nError details: " + str(e))