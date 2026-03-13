from huggingface_hub import InferenceClient

# 1. 아까 복사해 둔 본인의 토큰을 아래 따옴표 안에 넣으세요!
hf_token = "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"

# 2. 대화형 모델 선택
repo_id = "mistralai/Mistral-7B-Instruct-v0.2"

# 3. 클라이언트 생성
client = InferenceClient(model=repo_id, token=hf_token)

# 4. '채팅' 형식으로 질문(프롬프트) 만들기
# 나중에는 여기에 "system" 역할을 추가해서 '너는 CBT 전문가야'라고 설정할 수 있습니다.
messages = [
    {"role": "user", "content": "My energy level is very low today. Can you recommend 3 very simple and tiny daily routines for me? Please keep it short."}
]

print("AI가 답변을 생각하는 중입니다...\n")

# 5. 대화형 명령어(chat_completion) 사용!
# max_tokens는 AI가 대답할 수 있는 최대 단어 수입니다.
response = client.chat_completion(messages=messages, max_tokens=200)

print("=== AI의 답변 ===")
# AI가 준 복잡한 응답 데이터 중에서 '메시지 내용'만 쏙 뽑아옵니다.
print(response.choices[0].message.content)