// ═══════════════════════════════════════════════════════════════════
//  CREAR IMAGEN CON IA — Gemini 2.0 Flash
//  Pega este bloque al FINAL de tu script.js
// ═══════════════════════════════════════════════════════════════════

// ── Estado global ──────────────────────────────────────────────────
let generatedImageBase64 = null;
let generatedImageMime   = 'image/png';
let selectedRatio        = 'cuadrada 1:1';
let imageHistoryList     = []; // máximo 6 imágenes recientes

// ── Inyectar estilos CSS necesarios ────────────────────────────────
(function injectImageCreatorStyles() {
  if (document.getElementById('imageCreatorStyles')) return;
  const style = document.createElement('style');
  style.id = 'imageCreatorStyles';
  style.textContent = `
    @keyframes spinImg { to { transform: rotate(360deg); } }

    .prompt-chip {
      padding: 5px 12px;
      border-radius: 99px;
      border: 1px solid var(--border);
      background: var(--bg3);
      color: var(--text2);
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .prompt-chip:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(108,99,255,0.08);
    }

    .ratio-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg3);
      color: var(--text2);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ratio-btn:hover { border-color: var(--accent); color: var(--accent); }
    .ratio-btn.active-ratio {
      border-color: var(--accent);
      background: rgba(108,99,255,0.12);
      color: var(--accent);
      font-weight: 600;
    }

    .history-thumb {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid var(--border);
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .history-thumb:hover {
      border-color: var(--accent);
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
})();

// ── Seleccionar chip de sugerencia ─────────────────────────────────
function setPromptChip(text) {
  const textarea = document.getElementById('imagePrompt');
  if (textarea) {
    textarea.value = text;
    textarea.focus();
  }
}

// ── Seleccionar proporción ─────────────────────────────────────────
function selectRatio(btn) {
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active-ratio'));
  btn.classList.add('active-ratio');
  selectedRatio = btn.dataset.ratio;
}

// ── Generar imagen ─────────────────────────────────────────────────
async function generateImage() {
  const promptEl = document.getElementById('imagePrompt');
  const styleEl  = document.getElementById('imageStyle');
  const errorEl  = document.getElementById('generateError');
  const btn       = document.getElementById('generateImageBtn');

  const prompt = promptEl?.value?.trim();
  const style  = styleEl?.value  || '';

  // Validar
  if (!prompt) {
    showGenerateError('Escribe una descripción para la imagen primero');
    promptEl?.focus();
    return;
  }
  hideGenerateError();

  // Construir prompt completo
  const parts = [prompt];
  if (style) parts.push(style);
  if (selectedRatio) parts.push(`proporción ${selectedRatio}`);
  parts.push('alta calidad, optimizada para redes sociales');
  const fullPrompt = parts.join(', ');

  // UI → loading
  setImageUIState('loading');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }

  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error desconocido al generar la imagen');
    }

    // Guardar resultado
    generatedImageBase64 = data.imageBase64;
    generatedImageMime   = data.mimeType || 'image/png';

    // Mostrar imagen
    const imgEl = document.getElementById('generatedImage');
    imgEl.src = `data:${generatedImageMime};base64,${generatedImageBase64}`;
    setImageUIState('result');

    // Agregar al historial
    addToImageHistory(generatedImageBase64, generatedImageMime, prompt);

    showToast('✅ Imagen generada exitosamente', 'success');

  } catch (err) {
    console.error('[generateImage]', err);
    showGenerateError('❌ ' + err.message);
    setImageUIState('placeholder');
    showToast('Error al generar imagen', 'error');

  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✨ Generar Imagen con IA'; }
  }
}

// ── Estados del panel de resultado ─────────────────────────────────
function setImageUIState(state) {
  const placeholder = document.getElementById('imageResultPlaceholder');
  const loading     = document.getElementById('imageLoading');
  const imgEl       = document.getElementById('generatedImage');
  const actions     = document.getElementById('imageActions');
  const box         = document.getElementById('imageResultBox');

  placeholder.style.display = 'none';
  loading.style.display     = 'none';
  imgEl.style.display       = 'none';
  actions.style.display     = 'none';

  if (state === 'placeholder') {
    placeholder.style.display = 'block';
    if (box) box.style.borderColor = 'var(--border)';
  } else if (state === 'loading') {
    loading.style.display = 'flex';
    if (box) box.style.borderColor = 'var(--accent)';
  } else if (state === 'result') {
    imgEl.style.display     = 'block';
    actions.style.display   = 'flex';
    if (box) box.style.borderColor = 'var(--accent)';
  }
}

// ── Errores ─────────────────────────────────────────────────────────
function showGenerateError(msg) {
  const el = document.getElementById('generateError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function hideGenerateError() {
  const el = document.getElementById('generateError');
  if (el) el.style.display = 'none';
}

// ── Descargar imagen ────────────────────────────────────────────────
function downloadGeneratedImage() {
  if (!generatedImageBase64) return showToast('No hay imagen para descargar', 'error');
  const ext = generatedImageMime.includes('png') ? 'png' : 'jpg';
  const a   = document.createElement('a');
  a.href     = `data:${generatedImageMime};base64,${generatedImageBase64}`;
  a.download = `imagen-ia-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('⬇️ Descargando imagen...', 'success');
}

// ── Usar imagen en Dashboard ────────────────────────────────────────
function useGeneratedImage() {
  if (!generatedImageBase64) return showToast('No hay imagen generada', 'error');

  try {
    // Convertir base64 → File
    const byteString = atob(generatedImageBase64);
    const ab  = new ArrayBuffer(byteString.length);
    const ia  = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: generatedImageMime });
    const ext  = generatedImageMime.includes('png') ? 'png' : 'jpg';
    const file = new File([blob], `imagen-ia.${ext}`, { type: generatedImageMime });

    // Inyectar en carouselFiles
    carouselFiles = [file];

    // Navegar al Dashboard
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const dashBtn = document.querySelector('.nav-item[data-section="dashboard"]');
    const dashSec = document.getElementById('dashboard');
    if (dashBtn) dashBtn.classList.add('active');
    if (dashSec) dashSec.classList.add('active');

    // Renderizar en el área de upload
    renderCarouselGrid();
    updateCarouselHint();
    const placeholder = document.getElementById('uploadPlaceholder');
    if (placeholder) placeholder.style.display = 'none';

    showToast('✅ Imagen lista en el Dashboard', 'success');

  } catch (err) {
    console.error('[useGeneratedImage]', err);
    showToast('Error al transferir la imagen', 'error');
  }
}

// ── Historial de imágenes ───────────────────────────────────────────
function addToImageHistory(base64, mime, prompt) {
  imageHistoryList.unshift({ base64, mime, prompt });
  if (imageHistoryList.length > 6) imageHistoryList.pop();
  renderImageHistory();
}

function renderImageHistory() {
  const container = document.getElementById('imageHistoryGrid');
  const wrapper   = document.getElementById('imageHistory');
  if (!container || !wrapper) return;

  if (imageHistoryList.length === 0) {
    wrapper.style.display = 'none';
    return;
  }

  wrapper.style.display = 'block';
  container.innerHTML = imageHistoryList.map((item, idx) => `
    <img
      class="history-thumb"
      src="data:${item.mime};base64,${item.base64}"
      title="${item.prompt.slice(0, 60)}..."
      onclick="restoreHistoryImage(${idx})"
    >
  `).join('');
}

function restoreHistoryImage(idx) {
  const item = imageHistoryList[idx];
  if (!item) return;
  generatedImageBase64 = item.base64;
  generatedImageMime   = item.mime;
  const imgEl = document.getElementById('generatedImage');
  imgEl.src = `data:${item.mime};base64,${item.base64}`;
  setImageUIState('result');
  showToast('Imagen restaurada del historial', 'info');
}
