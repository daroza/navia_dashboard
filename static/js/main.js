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
    const routeResult = document.getElementById('routeResult');
    if (routeResult) routeResult.innerHTML = '';
    status.textContent = '';

    // Call backend /api/route endpoint to get recommended tool (no JWT needed)
    try {
      const routeRes = await fetch('https://daroza-promptified-backend.hf.space/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          media_type: modality === 'auto' ? 'image' : modality, // fallback to image if auto
          criteria: {},
          user_id: 'demo'
        })
      });
      const routeData = await routeRes.json();
      if (routeData.selected_tool) {
        let html = `<b>Recommended Tool:</b> ${routeData.selected_tool.ToolName}<br>`;
        html += `<b>Cost:</b> ${routeData.selected_tool.Cost}<br>`;
        if (routeData.selected_tool.ExpectedTime)
          html += `<b>Expected Time:</b> ${routeData.selected_tool.ExpectedTime}<br>`;
        if (routeData.selected_tool.QualityExpectation)
          html += `<b>Quality:</b> ${routeData.selected_tool.QualityExpectation}<br>`;
        if (routeData.selected_tool.Strengths)
          html += `<b>Strengths:</b> ${routeData.selected_tool.Strengths}<br>`;
        routeResult.innerHTML = html;
      } else if (routeData.error) {
        routeResult.innerHTML = `<span style='color:red'>Error: ${routeData.error}</span>`;
      } else {
        routeResult.innerHTML = '<span style="color:orange">No tool recommendation received.</span>';
      }
    } catch (err) {
      routeResult.innerHTML = `<span style='color:red'>Error contacting router backend: ${err.message}</span>`;
    }
    // Do NOT show image previews or update status for Generate
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
