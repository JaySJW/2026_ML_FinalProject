import streamlit as st
import pandas as pd
import numpy as np

# 1. 웹 브라우저 탭 세팅
st.set_page_config(page_title="Today to-do list", page_icon="🌱")

# 2. 메인 타이틀
st.title("🌱 MyList")
st.write("I will make today to-do list based on your mood and energy today")

st.divider() # 가로줄 긋기

# 3. 사용자 입력 받기 (화면을 반으로 나누기)
col1, col2 = st.columns(2)

with col1:
    # 기분 선택 슬라이더
    mood = st.select_slider(
        "How's your feeling today?",
        options=["Low", "Mid", "High"],
        value="Mid"
    )

with col2:
    # 에너지 선택 슬라이더
    energy = st.select_slider(
        "How's your energy today?",
        options=["Low", "Mid", "High"],
        value="Mid"
    )

st.divider() # 가로줄 긋기

# 4. 버튼과 임시 결과 화면
if st.button("Make today to-do list"):
    # 버튼을 누르면 이 아래 코드들이 실행됩니다.
    st.success(f"Your mood is **{mood}**, and your energy is **{energy}** today! (AI connection will add soon)")
    
    # AI가 만들어줄 체크리스트의 '가짜' 빈 껍데기
    st.write("### 📝 Today to-do list")
    st.checkbox("drink water")
    st.checkbox("open window")
    st.checkbox("listen to 1 favourite music")