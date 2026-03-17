from huggingface_hub import InferenceClient

# my token
hf_token = "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"

# using model
repo_id = "meta-llama/Meta-Llama-3-8B-Instruct"

# generate client
client = InferenceClient(model=repo_id, token=hf_token)

# setting prompts
messages = [
    {"role": "system", "content": "You are a helpful and empathetic CBT assistant. Your goal is to help users build small, manageable habits. Keep your answers practical, short, and formatted as a simple checklist."},
    {"role": "user", "content": "My energy level is 'Low' and my mood is 'Low' today. Can you recommend 3 very simple and tiny daily routines to start my day?"}
]

print("Llama 3 is thinking of CBT-based routines...\n")

# API
try:
    response = client.chat_completion(messages=messages, max_tokens=200)
    print("=== Llama 3's Recommended Routines ===")
    print(response.choices[0].message.content)
except Exception as e:
    print("Oops, an error occurred! Please check the details:\n", e)