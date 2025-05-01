from flask import Flask, render_template, request, jsonify, url_for
import os
import openai
import requests

app = Flask(__name__)

# Set your OpenAI API key in the environment variable 'OPENAI_API_KEY'
openai.api_key = os.getenv('OPENAI_API_KEY')

# System prompt for intent detection
INTENT_SYSTEM_PROMPT = (
    "You are an intent classifier. Given a user prompt, respond with only one word: 'image', 'video', or 'music' to indicate the intended modality for generation."
)

# System prompt for prompt enhancement (example)
ENHANCER_SYSTEM_PROMPT = (
    "You are a prompt enhancer specialized in {modality} prompts. Given a user prompt, rewrite it to maximize quality for {modality} generation."
)

def detect_intent_with_gpt4mini(prompt_text):
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": INTENT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt_text}
        ],
        max_tokens=1,
        temperature=0
    )
    intent = response.choices[0].message.content.strip().lower()
    if intent not in ('image', 'video', 'music'):
        intent = 'image'  # fallback
    return intent

def enhance_prompt_with_agent(prompt_text, modality):
    """
    Call the external backend server to improve the prompt.
    Uses hardcoded demo/demo credentials for now.
    """
    backend_url = "https://daroza-promptified-backend.hf.space"
    username = "demo"
    password = "demo"
    # 1. Login to get JWT token
    login_resp = requests.post(
        f"{backend_url}/api/login",
        json={"username": username, "password": password},
        timeout=15
    )
    if not login_resp.ok or not login_resp.json().get("token"):
        raise Exception(f"Backend login failed: {login_resp.text}")
    token = login_resp.json()["token"]
    # 2. Call improve-prompt endpoint
    improve_resp = requests.post(
        f"{backend_url}/api/improve-prompt",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "prompt": prompt_text,
            "mode": modality,
            "verbosity": "concise"
        },
        timeout=30
    )
    if not improve_resp.ok:
        raise Exception(f"Backend improve-prompt failed: {improve_resp.text}")
    improve_data = improve_resp.json()
    # Return only the improved prompt (ignore notes for now)
    return improve_data.get("improvedPrompt", "")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/enhance', methods=['POST'])
def enhance():
    data = request.json or {}
    prompt = data.get('prompt', '').strip()
    modality = data.get('modality')
    # Auto intent detection if not provided or set to 'auto'
    if not modality or modality == 'auto':
        modality = detect_intent_with_gpt4mini(prompt)
    # Enhance prompt using detected intent
    enhanced = enhance_prompt_with_agent(prompt, modality)
    return jsonify({'enhanced_prompt': enhanced, 'modality': modality})

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json or {}
    prompt = data.get('prompt', '').strip()
    modality = data.get('modality')
    return jsonify({'status': 'ok', 'message': f'Generating {modality} for: {prompt}'})

@app.route('/save', methods=['POST'])
def save_prompt():
    data = request.json or {}
    original = data.get('original', '')
    enhanced = data.get('enhanced', '')
    modality = data.get('modality')
    return jsonify({'status': 'saved'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
