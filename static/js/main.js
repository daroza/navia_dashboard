document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.onclick = () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  };

  const getModality = () => {
    const radios = document.querySelectorAll('input[name="modality"]');
    for (const r of radios) if (r.checked) return r.value;
    // If none selected, return 'auto' to trigger backend detection
    return 'auto';
  };


  const status = document.getElementById('status');
  const imagePreviews = document.getElementById('imagePreviews');
  if (imagePreviews) {
    imagePreviews.classList.add('hidden');
  }

  document.getElementById('enhanceBtn').onclick = async () => {
    const prompt = document.getElementById('promptInput').value;
    const modality = getModality();
    status.textContent = 'Enhancing...';
    const res = await fetch('/enhance', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ prompt, modality })
    });
    const data = await res.json();
    document.getElementById('enhancedOutput').value = data.enhanced_prompt;
    status.textContent = 'Prompt enhanced.';
  };

  document.getElementById('generateBtn').onclick = async () => {
    const prompt = document.getElementById('promptInput').value;
    const modality = getModality();
    status.textContent = 'Generating...';
    const res = await fetch('/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt, modality })
    });
    const data = await res.json();
    status.textContent = data.message;
    if (imagePreviews) {
      imagePreviews.classList.remove('hidden');
    }
  };

  document.getElementById('saveBtn').onclick = async () => {
    const original = document.getElementById('promptInput').value;
    const enhanced = document.getElementById('enhancedOutput').value;
    const modality = getModality();
    status.textContent = 'Saving...';
    await fetch('/save', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ original, enhanced, modality })
    });
    status.textContent = 'Saved successfully.';
  };

  document.getElementById('clearBtn').onclick = () => {
    document.getElementById('promptInput').value = '';
    document.getElementById('enhancedOutput').value = '';
    status.textContent = '';
    if (imagePreviews) {
      imagePreviews.classList.add('hidden');
    }
  };
});
