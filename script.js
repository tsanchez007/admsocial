document.addEventListener('DOMContentLoaded', () => {
    console.log("Script cargado y listo ✅");

    // --- NAVEGACIÓN ENTRE SECCIONES ---
    const menuItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-section');

            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === target) s.classList.add('active');
            });

            if (target === 'accounts') loadAccounts();
            if (target === 'stats') loadStats();
            if (target === 'scheduled') loadPosts();
            if (target === 'exportSettings') loadExportSettingsUI();
        });
    });

    // Cargar datos iniciales
    loadStats();
});

async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        const container = document.getElementById('accountsList');
        if (!container) return;

        if (data.accounts && data.accounts.length > 0) {
            container.innerHTML = data.accounts.map(acc => `
                <div class="account-card">
                    <div class="account-info">
                        <strong>${acc.usuario}</strong>
                        <span>${acc.plataforma}</span>
                    </div>
                    <span class="status-badge active">activo</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No hay cuentas conectadas aún.</p>';
        }
    } catch (err) {
        container.innerHTML = '<p>No hay cuentas conectadas aún.</p>';
    }
}

let allPosts = [];

// ── Ajustes PDF ──────────────────────────────
let exportSettings = JSON.parse(localStorage.getItem('exportSettings') || '{}');
let cropData = { img: null, dragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, scale: 1 };

function previewCover(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const wrap = document.getElementById('coverPreviewWrap');
        wrap.style.position = 'relative';
        wrap.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.width = 820; canvas.height = 312;
        canvas.style.cssText = 'width:100%;height:100%;cursor:grab;border-radius:10px;display:block;';
        wrap.appendChild(canvas);

        const hint = document.createElement('div');
        hint.textContent = '↔ Arrastra para reposicionar la imagen';
        hint.style.cssText = 'position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:0.72rem;color:rgba(255,255,255,0.9);text-shadow:0 1px 4px rgba(0,0,0,0.7);pointer-events:none;';
        wrap.appendChild(hint);

        // Botones zoom
        const zoomBar = document.createElement('div');
        zoomBar.style.cssText = 'display:flex;gap:8px;margin-top:8px;align-items:center;';
        zoomBar.innerHTML = `
            <button onclick="adjustZoom(-0.05)" class="btn-secondary" style="padding:4px 12px;font-size:1.1rem;">−</button>
            <input type="range" id="zoomSlider" min="0.1" max="3" step="0.01" value="1" style="flex:1;accent-color:var(--accent);">
            <button onclick="adjustZoom(0.05)" class="btn-secondary" style="padding:4px 12px;font-size:1.1rem;">+</button>`;
        wrap.parentNode.insertBefore(zoomBar, wrap.nextSibling);

        const imgEl = new Image();
        imgEl.onload = () => {
            const scaleH = 312 / imgEl.height;
            const scaleW = 820 / imgEl.width;
            const initScale = Math.max(scaleH, scaleW);
            cropData = {
                img: imgEl,
                dragging: false,
                startX: 0, startY: 0,
                offsetX: 0, offsetY: 0,
                scale: initScale,
                minScale: Math.min(scaleH, scaleW) * 0.5
            };
            cropData.offsetX = (820 - imgEl.width * initScale) / 2;
            cropData.offsetY = (312 - imgEl.height * initScale) / 2;
            document.getElementById('zoomSlider').value = initScale;
            document.getElementById('zoomSlider').min = cropData.minScale;
            drawCrop(canvas);
        };
        imgEl.src = e.target.result;

        document.getElementById('zoomSlider').addEventListener('input', ev => {
            cropData.scale = parseFloat(ev.target.value);
            clampOffset();
            drawCrop(canvas);
            saveCanvasCover(canvas);
        });

        canvas.addEventListener('mousedown', ev => {
            cropData.dragging = true;
            cropData.startX = ev.clientX - cropData.offsetX;
            cropData.startY = ev.clientY - cropData.offsetY;
            canvas.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', ev => {
            if (!cropData.dragging) return;
            cropData.offsetX = ev.clientX - cropData.startX;
            cropData.offsetY = ev.clientY - cropData.startY;
            clampOffset();
            drawCrop(canvas);
        });
        window.addEventListener('mouseup', () => {
            if (!cropData.dragging) return;
            cropData.dragging = false;
            canvas.style.cursor = 'grab';
            saveCanvasCover(canvas);
        });
        canvas.addEventListener('wheel', ev => {
            ev.preventDefault();
            cropData.scale = Math.max(cropData.minScale, cropData.scale - ev.deltaY * 0.001);
            const slider = document.getElementById('zoomSlider');
            if (slider) slider.value = cropData.scale;
            clampOffset();
            drawCrop(canvas);
            saveCanvasCover(canvas);
        }, { passive: false });
        canvas.addEventListener('touchstart', ev => {
            const t = ev.touches[0];
            cropData.dragging = true;
            cropData.startX = t.clientX - cropData.offsetX;
            cropData.startY = t.clientY - cropData.offsetY;
        });
        canvas.addEventListener('touchmove', ev => {
            ev.preventDefault();
            if (!cropData.dragging) return;
            const t = ev.touches[0];
            cropData.offsetX = t.clientX - cropData.startX;
            cropData.offsetY = t.clientY - cropData.startY;
            clampOffset();
            drawCrop(canvas);
        }, { passive: false });
        canvas.addEventListener('touchend', () => {
            cropData.dragging = false;
            saveCanvasCover(canvas);
        });
    };
    reader.readAsDataURL(file);
}

function adjustZoom(delta) {
    const canvas = document.querySelector('#coverPreviewWrap canvas');
    if (!canvas || !cropData.img) return;
    cropData.scale = Math.max(cropData.minScale || 0.1, cropData.scale + delta);
    const slider = document.getElementById('zoomSlider');
    if (slider) slider.value = cropData.scale;
    clampOffset();
    drawCrop(canvas);
    saveCanvasCover(canvas);
}

function clampOffset() {
    if (!cropData.img) return;
    const drawW = cropData.img.width  * cropData.scale;
    const drawH = cropData.img.height * cropData.scale;
    // Solo limitar si la imagen es más grande que el canvas
    if (drawW >= 820) {
        cropData.offsetX = Math.min(0, Math.max(820 - drawW, cropData.offsetX));
    }
    if (drawH >= 312) {
        cropData.offsetY = Math.min(0, Math.max(312 - drawH, cropData.offsetY));
    }
}

function saveCanvasCover(canvas) {
    exportSettings.coverBase64 = canvas.toDataURL('image/jpeg', 0.92);
}

function drawCrop(canvas) {
    const ctx = canvas.getContext('2d');
    const { img, offsetX, offsetY, scale } = cropData;
    ctx.clearRect(0, 0, 820, 312);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 820, 312);
    ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
}

function clearCover() {
    exportSettings.coverBase64 = null;
    const wrap = document.getElementById('coverPreviewWrap');
    wrap.style.position = '';
    wrap.innerHTML = `<img id="coverPreview" src="" style="width:100%;height:100%;object-fit:cover;display:none;">
        <span id="coverPlaceholder" style="color:var(--text2);font-size:0.9rem;">📷 Clic para subir imagen de portada</span>`;
    wrap.onclick = () => document.getElementById('coverInput').click();
    document.getElementById('coverInput').value = '';
}

function saveExportSettings() {
    exportSettings.title   = document.getElementById('pdfTitle').value.trim();
    exportSettings.footer  = document.getElementById('pdfFooter').value.trim();
    exportSettings.showImage       = document.getElementById('showImage').checked;
    exportSettings.showCuenta      = document.getElementById('showCuenta').checked;
    exportSettings.showFecha       = document.getElementById('showFecha').checked;
    exportSettings.showPlataformas = document.getElementById('showPlataformas').checked;
    exportSettings.showTexto       = document.getElementById('showTexto').checked;
    localStorage.setItem('exportSettings', JSON.stringify(exportSettings));
    showToast('Ajustes guardados ✅', 'success');
    setTimeout(() => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelector('.nav-item[data-section="dashboard"]').classList.add('active');
        document.getElementById('dashboard').classList.add('active');
    }, 800);
}

function loadExportSettingsUI() {
    const s = exportSettings;
    if (s.title)  document.getElementById('pdfTitle').value  = s.title;
    if (s.footer) document.getElementById('pdfFooter').value = s.footer;
    if (s.coverBase64) {
        const wrap = document.getElementById('coverPreviewWrap');
        wrap.innerHTML = `<img src="${s.coverBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">`;
        const hint = document.createElement('div');
        hint.textContent = 'Portada guardada · Sube otra imagen para cambiarla';
        hint.style.cssText = 'position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:0.72rem;color:rgba(255,255,255,0.85);text-shadow:0 1px 3px rgba(0,0,0,0.6);pointer-events:none;';
        wrap.style.position = 'relative';
        wrap.appendChild(hint);
    }
    if (s.showImage       === false) document.getElementById('showImage').checked       = false;
    if (s.showCuenta      === false) document.getElementById('showCuenta').checked      = false;
    if (s.showFecha       === false) document.getElementById('showFecha').checked       = false;
    if (s.showPlataformas === false) document.getElementById('showPlataformas').checked = false;
    if (s.showTexto       === false) document.getElementById('showTexto').checked       = false;
}

function applyFilter() {
    const from = document.getElementById('filterFrom').value;
    const to = document.getElementById('filterTo').value;
    renderPosts(allPosts.filter(post => {
        const fecha = post.fecha_programada?.slice(0,10);
        if (from && fecha < from) return false;
        if (to && fecha > to) return false;
        return true;
    }));
}

function clearFilter() {
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';
    renderPosts(allPosts);
}

function exportPDF() {
    const from = document.getElementById('filterFrom').value;
    const to = document.getElementById('filterTo').value;
    let posts = allPosts;
    if (from || to) {
        posts = allPosts.filter(post => {
            const fecha = post.fecha_programada?.slice(0,10);
            if (from && fecha < from) return false;
            if (to && fecha > to) return false;
            return true;
        });
    }

    const s = exportSettings;
    const showImage       = s.showImage       !== false;
    const showCuenta      = s.showCuenta      !== false;
    const showFecha       = s.showFecha       !== false;
    const showPlataformas = s.showPlataformas !== false;
    const showTexto       = s.showTexto       !== false;
    const pdfTitle    = s.title  || 'Programación de Publicaciones';
    const pdfFooter   = s.footer || '';
    const coverBase64 = s.coverBase64 || null;

    const cuentas = [...new Set(posts.map(p => p.cuenta_nombre).filter(Boolean))];
    const cuentasTitulo = cuentas.length > 0 ? cuentas.join(', ') : 'Todas las cuentas';
    const fromFmt = from ? new Date(from + 'T00:00:00').toLocaleDateString('es-DO', {day:'2-digit',month:'long',year:'numeric'}) : null;
    const toFmt   = to   ? new Date(to   + 'T00:00:00').toLocaleDateString('es-DO', {day:'2-digit',month:'long',year:'numeric'}) : null;
    const rangoTexto = fromFmt && toFmt ? `Del ${fromFmt} al ${toFmt}`
                     : fromFmt ? `Desde el ${fromFmt}`
                     : toFmt   ? `Hasta el ${toFmt}`
                     : 'Todas las fechas';

    const win = window.open('', '_blank');
    const rows = posts.map(post => {
        const fecha = new Date(post.fecha_programada).toLocaleString('es-DO',{dateStyle:'full',timeStyle:'short'});
        const mediaRaw = post.imagen_url || '';
        const isVideo = mediaRaw.startsWith('data:video') || mediaRaw.match(/\.(mp4|mov|webm)/i);
        const mediaHtml = mediaRaw
            ? isVideo
                ? `<video src="${mediaRaw}" controls style="width:100%;height:auto;max-height:300px;object-fit:contain;border-radius:8px;border:1px solid #ddd;display:block;"></video>`
                : `<img src="${mediaRaw}" style="width:100%;height:auto;max-height:300px;object-fit:contain;border-radius:8px;border:1px solid #ddd;display:block;cursor:pointer;" onclick="window.open('${mediaRaw}', '_blank')" title="Clic para ver en tamaño completo">`
            : '<div style="width:100%;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;">Sin imagen</div>';

        const partes = [];
        if (showImage) partes.push(`<div style="width:200px;flex-shrink:0;">${mediaHtml}</div>`);
        const infos = [];
        if (showCuenta)      infos.push(`<div style="font-weight:700;font-size:1rem;color:#222;margin-bottom:4px;">${post.cuenta_nombre || 'Sin cuenta'}</div>`);
        if (showFecha)       infos.push(`<div style="font-size:0.8rem;color:#888;margin-bottom:6px;">📅 ${fecha}</div>`);
        if (showPlataformas) infos.push(`<div style="font-size:0.85rem;color:#555;margin-bottom:6px;">${(post.plataformas||'').split(',').filter(Boolean).map(p=>`<span style="background:${p==='instagram'?'#e1306c':'#1877f2'};color:white;padding:2px 8px;border-radius:99px;font-size:0.75rem;">${p==='instagram'?'📸 Instagram':'👥 Facebook'}</span>`).join('')}</div>`);
        if (showTexto)       infos.push(`<p style="font-size:0.95rem;line-height:1.6;color:#222;margin:0;">${post.contenido||'<em style="color:#aaa">Sin texto</em>'}</p>`);
        if (infos.length) partes.push(`<div style="flex:1;">${infos.join('')}</div>`);

        return `<div style="border:1px solid #e0e0e0;border-radius:12px;padding:20px;margin-bottom:20px;page-break-inside:avoid;background:white;"><div style="display:flex;gap:16px;">${partes.join('')}</div></div>`;
    }).join('');

    const coverHtml = coverBase64 ? `<img src="${coverBase64}" style="width:100%;height:312px;object-fit:cover;border-radius:12px;margin-bottom:24px;display:block;">` : '';
    const footerHtml = pdfFooter ? `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e0e0e0;text-align:center;color:#aaa;font-size:0.8rem;">${pdfFooter}</div>` : '';

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${pdfTitle}</title>
    <style>body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:900px;margin:0 auto;background:#fafafa;}h1{color:#6c63ff;margin-bottom:4px;font-size:1.6rem;}.cuenta{color:#333;font-size:1rem;font-weight:600;margin-bottom:2px;}.rango{color:#6c63ff;font-size:0.95rem;margin-bottom:4px;}.subtitle{color:#aaa;margin-bottom:32px;font-size:0.85rem;}@media print{body{padding:20px;}}</style>
    </head><body>${coverHtml}<h1>📅 ${pdfTitle}</h1><div class="cuenta">👤 ${cuentasTitulo}</div><div class="rango">🗓 ${rangoTexto}</div><p class="subtitle">${posts.length} publicación${posts.length !== 1 ? 'es' : ''}</p>${rows}${footerHtml}<script>window.onload=()=>window.print();<\/script></body></html>`);
    win.document.close();
}
function renderPosts(posts) {
    const container = document.getElementById('postsList');
    if (!container) return;
    if (posts && posts.length > 0) {
        container.innerHTML = '';
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            const imgEl = post.imagen_url
                ? Object.assign(document.createElement('img'), {className:'post-img', src: post.imagen_url, alt:'imagen'})
                : Object.assign(document.createElement('div'), {className:'post-img', innerHTML:'📄', style:'background:var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem;'});
            const plats = (post.plataformas||'').split(',').filter(Boolean).map(p=>`<span class="plat-badge ${p==='instagram'?'plat-ig':'plat-fb'}">${p==='instagram'?'📸 Instagram':'👥 Facebook'}</span>`).join('');
            const estadoClass = post.estado === 'publicado' ? 'estado-ok' : post.estado === 'fallido' ? 'estado-err' : 'estado-pending';
            const cuentaNombre = post.cuenta_nombre ? `<span class="cuenta-badge">👤 ${post.cuenta_nombre}</span>` : '';
            const body = document.createElement('div');
            body.className = 'post-body';
            body.innerHTML = `
                <div class="post-header-row">
                    <div class="post-plats">${plats}${cuentaNombre}</div>
                    <span class="post-estado ${estadoClass}">${post.estado}</span>
                </div>
                <p class="post-text">${post.contenido||'<em style="opacity:0.5">Sin texto</em>'}</p>
                <div class="post-footer">
                    <span class="post-date-badge">📅 ${new Date(post.fecha_programada).toLocaleString('es-DO',{dateStyle:'medium',timeStyle:'short'})}</span>
                    <div class="post-actions">
                        <button onclick="editPost(${post.id})" class="btn-action btn-edit">✏️ Editar</button>
                        <button onclick="deletePost(${post.id})" class="btn-action btn-delete">🗑 Eliminar</button>
                    </div>
                </div>`;
            card.appendChild(imgEl);
            card.appendChild(body);
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p style="text-align:center;color:var(--text2);padding:2rem;">No hay publicaciones en este rango.</p>';
    }
}

async function loadPosts() {
    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        allPosts = data.posts || [];
        renderPosts(allPosts);
    } catch (err) {
        const container = document.getElementById('postsList');
        if (container) container.innerHTML = '<p>Error cargando publicaciones.</p>';
    }
}

async function loadStats() {
    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        const posts = data.posts || [];

        document.getElementById('statTotal').textContent = posts.length;
        document.getElementById('statPending').textContent = posts.filter(p => p.estado === 'scheduled').length;
        document.getElementById('statPublished').textContent = posts.filter(p => p.estado === 'published').length;
        document.getElementById('statIG').textContent = posts.filter(p => p.plataformas?.includes("instagram")).length;
        document.getElementById('statFB').textContent = posts.filter(p => p.plataformas?.includes("facebook")).length;

        const accRes = await fetch('/api/accounts');
        const accData = await accRes.json();
        document.getElementById('statAccounts').textContent = (accData.accounts || []).length;
    } catch (err) {
        console.error('Error cargando stats:', err);
    }
}

async function connectFacebook() {
    window.location.href = '/api/auth/login';
}

async function loadAccountsSelect() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    const select = document.getElementById("accountSelect");
    if (select && data.accounts) {
        select.innerHTML = `<option value="">-- Seleccionar cuenta --</option>` + data.accounts.map(acc => `<option value="${acc.id}">${acc.usuario} (${acc.plataforma})</option>`).join("");
    }
}

loadAccountsSelect();

async function schedulePost() {
    const text = document.getElementById('postText').value;
    const dateVal = document.getElementById("scheduleDate").value;
    const hour = parseInt(document.getElementById("scheduleHour").value);
    const min = document.getElementById("scheduleMin").value;
    const ampm = document.getElementById("scheduleAmPm").value;
    const hour24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const scheduledAt = dateVal + "T" + String(hour24).padStart(2,"0") + ":" + min + ":00";
    const instagram = document.getElementById('instagramCheck').checked;
    const facebook = document.getElementById('facebookCheck').checked;
    const fileInput = document.getElementById('fileInput');

    let hasError = false;

    const markRed = (el) => {
        if (!el) return;
        el.style.border = '2px solid var(--red)';
        setTimeout(() => el.style.border = '', 3000);
    };

    if (!instagram && !facebook) {
        markRed(document.getElementById('instagramCheck')?.closest('.networks-row'));
        showToast('Selecciona al menos una red social', 'error');
        hasError = true;
    }

    const accountSelect = document.getElementById('accountSelect');
    if (!accountSelect?.value) {
        markRed(accountSelect);
        showToast('Selecciona una cuenta', 'error');
        hasError = true;
    }

    if (!dateVal) {
        markRed(document.getElementById('scheduleDate'));
        showToast('La fecha es requerida', 'error');
        hasError = true;
    }

    const tipoOpciones = document.getElementById('tipoOpciones');
    const tipoVisible = document.getElementById('tipoPublicacionRow')?.style.display !== 'none';
    const tipoElegido = !tipoVisible || (tipoOpciones && [...tipoOpciones.querySelectorAll('button')].some(b => b.dataset.selected === 'true'));
    if (!tipoElegido) {
        tipoOpciones.style.border = '2px solid var(--red)';
        tipoOpciones.style.borderRadius = '8px';
        tipoOpciones.style.padding = '4px';
        setTimeout(() => { tipoOpciones.style.border = ''; tipoOpciones.style.padding = ''; }, 3000);
        showToast('Selecciona al menos un tipo de publicación', 'error');
        hasError = true;
    }

    if (hasError) return;
    if (!scheduledAt) return showToast('La fecha es requerida', 'error');
    const cuenta_nombre = accountSelect?.options[accountSelect.selectedIndex]?.text || '';

    let image_base64 = null;
    if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        image_base64 = await new Promise(resolve => {
            if (file.type.startsWith('video/')) {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            } else {
                const canvas = document.createElement('canvas');
                const img = new Image();
                img.onload = () => {
                    const MAX = 1080;
                    let w = img.width, h = img.height;
                    if (w > MAX) { h = h * MAX / w; w = MAX; }
                    if (h > MAX) { w = w * MAX / h; h = MAX; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.src = URL.createObjectURL(file);
            }
        });
    }
    const postData = { text, scheduled_at: scheduledAt, instagram, facebook, image_base64, cuenta_nombre };
    console.log('Enviando post:', { text, scheduled_at: scheduledAt, instagram, facebook, tieneMedia: !!image_base64, mediaSize: image_base64?.length, mediaType: fileInput.files[0]?.type });
    
    
    
    
    

    try {
        const res = await fetch('/api/posts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(postData) });
        const data = await res.json();
        if (data.success) {
            showToast('¡Publicación programada! 🎉', 'success');
            // Reset formulario completo
            document.getElementById('postText').value = '';
            document.getElementById('scheduleDate').value = '';
            document.getElementById('charCounter').textContent = '0';
            document.getElementById('instagramCheck').checked = false;
            document.getElementById('facebookCheck').checked = false;
            document.getElementById('fileInput').value = '';
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('imagePreview').src = '';
            document.getElementById('videoPreview').style.display = 'none';
            document.getElementById('videoPreview').src = '';
            document.getElementById('uploadPlaceholder').style.display = 'flex';
            document.getElementById('uploadIcon').textContent = '🖼';
            document.getElementById('uploadHint').textContent = 'Arrastra una imagen o video y haz clic';
            document.getElementById('dimensionInfo').textContent = '';
            document.getElementById('tipoPublicacionRow').style.display = 'none';
            document.getElementById('tipoOpciones').innerHTML = '';
            document.getElementById('dimensionLabel').textContent = '';
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (err) {
        showToast('No se pudo conectar con el servidor', 'error');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const btn = document.getElementById('themeToggle');
    btn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.getElementById('postText')?.addEventListener('input', function() {
    document.getElementById('charCounter').textContent = this.value.length;
});

document.getElementById('uploadArea')?.addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

const TIPOS = {
    instagram: [
        { id: 'ig_feed',    label: '📷 Feed',    dim: '1080x1080', info: 'Cuadrado 1:1' },
        { id: 'ig_historia',label: '📱 Historia', dim: '1080x1920', info: 'Vertical 9:16' },
        { id: 'ig_reel',    label: '🎬 Reel',    dim: '1080x1920', info: 'Vertical 9:16' },
    ],
    facebook: [
        { id: 'fb_feed',    label: '📷 Feed',    dim: '1200x630',  info: 'Horizontal 1.91:1' },
        { id: 'fb_historia',label: '📱 Historia', dim: '1080x1920', info: 'Vertical 9:16' },
    ]
};

let tipoSeleccionado = null;

function renderTipos() {
    const ig = document.getElementById('instagramCheck')?.checked;
    const fb = document.getElementById('facebookCheck')?.checked;
    const row = document.getElementById('tipoPublicacionRow');
    const opciones = document.getElementById('tipoOpciones');
    const dimLabel = document.getElementById('dimensionLabel');
    if (!row) return;

    if (!ig && !fb) { row.style.display = 'none'; return; }
    row.style.display = 'block';
    opciones.innerHTML = '';
    tipoSeleccionado = null;
    dimLabel.textContent = '';

    const tipos = [];
    if (ig) TIPOS.instagram.forEach(t => { if (!tipos.find(x=>x.id===t.id)) tipos.push(t); });
    if (fb) TIPOS.facebook.forEach(t => { if (!tipos.find(x=>x.id===t.id)) tipos.push(t); });

    // Deduplicar por label
    const vistos = new Set();
    tipos.filter(t => {
        if (vistos.has(t.label)) return false;
        vistos.add(t.label); return true;
    }).forEach(tipo => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = tipo.label;
        btn.dataset.dim = tipo.dim;
        btn.dataset.info = tipo.info;
        btn.style.cssText = 'padding:8px 16px;border-radius:20px;border:2px solid var(--border);background:transparent;color:var(--text);cursor:pointer;font-size:0.85rem;transition:all 0.2s;';
        btn.dataset.selected = 'false';
        btn.onclick = () => {
            const isSelected = btn.dataset.selected === 'true';
            btn.dataset.selected = isSelected ? 'false' : 'true';
            btn.style.background = isSelected ? 'transparent' : 'var(--accent)';
            btn.style.borderColor = isSelected ? 'var(--border)' : 'var(--accent)';
            btn.style.color = isSelected ? 'var(--text)' : 'white';
            tipoSeleccionado = tipo;
            dimLabel.textContent = '📐 Dimensión recomendada: ' + tipo.dim + ' · ' + tipo.info;
            updateDimensionInfo();
        };
        opciones.appendChild(btn);
    });
}

function updateDimensionInfo() {
    const ig = document.getElementById('instagramCheck')?.checked;
    const fb = document.getElementById('facebookCheck')?.checked;
    const info = document.getElementById('dimensionInfo');
    if (!info) return;
    if (ig && fb) info.textContent = '📐 Instagram: 1080x1080 · Facebook: 1200x630';
    else if (ig)  info.textContent = '📐 Instagram Feed: 1080x1080 · Story/Reel: 1080x1920';
    else if (fb)  info.textContent = '📐 Facebook Feed: 1200x630 · Story: 1080x1920';
    else          info.textContent = '';
}
document.getElementById('instagramCheck')?.addEventListener('change', () => { updateDimensionInfo(); renderTipos(); });
document.getElementById('facebookCheck')?.addEventListener('change', () => { updateDimensionInfo(); renderTipos(); });

document.getElementById('fileInput')?.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = document.getElementById('imagePreview');
    const vid = document.getElementById('videoPreview');
    document.getElementById('uploadPlaceholder').style.display = 'none';
    if (file.type.startsWith('video/')) {
        vid.src = url; vid.style.display = 'block';
        img.style.display = 'none';
        document.getElementById('uploadIcon').textContent = '🎬';
        document.getElementById('uploadHint').textContent = file.name;
    } else {
        img.src = url; img.style.display = 'block';
        vid.style.display = 'none';
        document.getElementById('uploadIcon').textContent = '🖼';
        document.getElementById('uploadHint').textContent = file.name;
    }
});

async function deletePost(id) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    loadPosts();
}



async function editPost(id) {
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    const contenido = post.contenido || '';
    const fecha = post.fecha_programada || '';
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:var(--bg2);border-radius:12px;padding:2rem;width:90%;max-width:500px;display:flex;flex-direction:column;gap:1rem;">
            <h3 style="margin:0;">✏️ Editar Publicación</h3>
            <textarea id="editTexto" rows="4" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);resize:vertical;">${contenido}</textarea>
            <input type="datetime-local" id="editFecha" value="${fecha.slice(0,16)}" style="padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);"/>
            <div>
                <label style="font-size:0.85rem;color:var(--text2);">Cambiar imagen (opcional)</label>
                <input type="file" id="editImagen" accept="image/*,video/*" style="margin-top:6px;width:100%;"/>
                <div id="editPreview" style="margin-top:8px;display:none;">
                    <img id="editPreviewImg" style="max-width:100%;max-height:200px;border-radius:8px;display:none;"/>
                    <video id="editPreviewVid" controls style="max-width:100%;max-height:200px;border-radius:8px;display:none;"></video>
                </div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button id="cancelEdit" style="padding:8px 18px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;">Cancelar</button>
                <button id="saveEdit" style="padding:8px 18px;border-radius:8px;border:none;background:var(--accent);color:white;cursor:pointer;">💾 Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cancelEdit').onclick = () => modal.remove();

    document.getElementById('editImagen').addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = document.getElementById('editPreviewImg');
        const vid = document.getElementById('editPreviewVid');
        document.getElementById('editPreview').style.display = 'block';
        if (file.type.startsWith('video/')) {
            vid.src = url; vid.style.display = 'block';
            img.style.display = 'none';
        } else {
            img.src = url; img.style.display = 'block';
            vid.style.display = 'none';
        }
    });

    document.getElementById('saveEdit').onclick = async () => {
        const nuevoTexto = document.getElementById('editTexto').value;
        const nuevaFecha = document.getElementById('editFecha').value + ':00';
        const fileInput = document.getElementById('editImagen');

        let image_base64 = null;
        if (fileInput.files[0]) {
            image_base64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(fileInput.files[0]);
            });
        }

        const patchRes = await fetch(`/api/posts/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ contenido: nuevoTexto, fecha_programada: nuevaFecha, image_base64 })
        });
        const patchData = await patchRes.json();
        console.log('PATCH response:', patchRes.status, patchData);
        if (patchData.success) {
            showToast('✅ Publicación actualizada', 'success');
        } else {
            showToast('❌ Error: ' + (patchData.error || 'desconocido'), 'error');
        }
        modal.remove();
        loadPosts();
    };
}
