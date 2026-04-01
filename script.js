let carouselFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('user');
    if (!user) { window.location.href = '/login'; return; }

    console.log("Script cargado y listo ✅");

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

    loadStats();
});

async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        const container = document.getElementById('accountsList');
        if (!container) return;
        if (data.accounts && data.accounts.length > 0) {
            const grouped = {};
            data.accounts.forEach(acc => {
                const key = acc.page_id;
                if (!grouped[key]) grouped[key] = { nombre: null, redes: [] };
                if (acc.plataforma === 'facebook') grouped[key].nombre = acc.nombre;
                grouped[key].redes.push(acc);
            });
            container.innerHTML = Object.values(grouped).map(grupo => {
                const nombre = grupo.nombre || grupo.redes[0].nombre || grupo.redes[0].usuario;
                const hasIG = grupo.redes.some(r => r.plataforma === 'instagram');
                const hasFB = grupo.redes.some(r => r.plataforma === 'facebook');
                const ids = grupo.redes.map(r => r.id).join(',');
                const fbIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 50 50"><rect width="50" height="50" rx="8" fill="#1877F2"/><path d="M31 17h-3.5c-1.9 0-2.5 1-2.5 2.5V23h6l-1 6h-5v14h-6V29h-4v-6h4v-4.5c0-4 2.5-6.5 6.5-6.5h5v6z" fill="white"/></svg>`;
                const igIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 50 50"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#f09433"/><stop offset="50%" style="stop-color:#dc2743"/><stop offset="100%" style="stop-color:#bc1888"/></linearGradient></defs><rect width="50" height="50" rx="12" fill="url(#ig)"/><g fill="white"><path d="M25 14.2c3.5 0 3.9 0 5.3.1 1.3.1 2 .3 2.5.5.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.4 1.2.5 2.5.1 1.4.1 1.8.1 5.3s0 3.9-.1 5.3c-.1 1.3-.3 2-.5 2.5-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.2.4-2.5.5-1.4.1-1.8.1-5.3.1s-3.9 0-5.3-.1c-1.3-.1-2-.3-2.5-.5-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.4-1.2-.5-2.5-.1-1.4-.1-1.8-.1-5.3s0-3.9.1-5.3c.1-1.3.3-2 .5-2.5.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.2-.4 2.5-.5 1.4-.1 1.8-.1 5.3-.1m0-2.3c-3.6 0-4 0-5.4.1-1.4.1-2.3.3-3.2.6-.9.3-1.6.8-2.4 1.6-.8.8-1.3 1.5-1.6 2.4-.3.9-.5 1.8-.6 3.2-.1 1.4-.1 1.8-.1 5.4s0 4 .1 5.4c.1 1.4.3 2.3.6 3.2.3.9.8 1.6 1.6 2.4.8.8 1.5 1.3 2.4 1.6.9.3 1.8.5 3.2.6 1.4.1 1.8.1 5.4.1s4 0 5.4-.1c1.4-.1 2.3-.3 3.2-.6.9-.3 1.6-.8 2.4-1.6.8-.8 1.3-1.5 1.6-2.4.3-.9.5-1.8.6-3.2.1-1.4.1-1.8.1-5.4s0-4-.1-5.4c-.1-1.4-.3-2.3-.6-3.2-.3-.9-.8-1.6-1.6-2.4-.8-.8-1.5-1.3-2.4-1.6-.9-.3-1.8-.5-3.2-.6-1.4-.1-1.8-.1-5.4-.1z"/><path d="M25 18.2c-3.8 0-6.8 3-6.8 6.8s3 6.8 6.8 6.8 6.8-3 6.8-6.8-3-6.8-6.8-6.8zm0 11.4c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/><circle cx="34.1" cy="15.9" r="1.6"/></g></svg>`;
                return `<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:12px;border:1px solid #eee;margin-bottom:10px;background:#fff;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <strong style="font-size:1rem;">${nombre}</strong>
                        <div style="display:flex;align-items:center;gap:6px;">${hasFB ? fbIcon : ''}${hasIG ? igIcon : ''}</div>
                    </div>
                    <button onclick="disconnectGroup('${ids}')" style="padding:6px 14px;border-radius:8px;border:1px solid #e74c3c;background:transparent;color:#e74c3c;cursor:pointer;font-size:0.85rem;font-weight:600;" onmouseover="this.style.background='#e74c3c';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='#e74c3c'">x Desconectar</button>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">No hay cuentas conectadas.</div>';
        }
    } catch (err) { console.error(err); }
}

async function disconnectGroup(idsStr) {
    if (!confirm('¿Desconectar esta cuenta?')) return;
    const ids = idsStr.split(',');
    for (const id of ids) await fetch('/api/accounts?id=' + id, { method: 'DELETE' });
    loadAccounts(); loadAccountsSelect();
}

async function disconnectAll() {
    if (!confirm('¿Desconectar TODAS las cuentas?')) return;
    const res = await fetch('/api/accounts');
    const data = await res.json();
    if (!data.accounts || data.accounts.length === 0) return showToast('No hay cuentas', 'info');
    for (const acc of data.accounts) await fetch(`/api/accounts?id=${acc.id}`, { method: 'DELETE' });
    showToast('Todas las cuentas desconectadas ✅', 'success');
    loadAccounts(); loadAccountsSelect();
}

async function disconnectAccount(id) {
    if (!confirm('¿Desconectar esta cuenta?')) return;
    try {
        const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Cuenta desconectada', 'success'); loadAccounts(); loadAccountsSelect(); }
        else showToast('Error al desconectar', 'error');
    } catch(e) { showToast('Error al desconectar', 'error'); }
}

let allPosts = [];
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
        const zoomBar = document.createElement('div');
        zoomBar.style.cssText = 'display:flex;gap:8px;margin-top:8px;align-items:center;';
        zoomBar.innerHTML = `<button onclick="adjustZoom(-0.05)" class="btn-secondary" style="padding:4px 12px;font-size:1.1rem;">−</button><input type="range" id="zoomSlider" min="0.1" max="3" step="0.01" value="1" style="flex:1;accent-color:var(--accent);"><button onclick="adjustZoom(0.05)" class="btn-secondary" style="padding:4px 12px;font-size:1.1rem;">+</button>`;
        wrap.parentNode.insertBefore(zoomBar, wrap.nextSibling);
        const imgEl = new Image();
        imgEl.onload = () => {
            const scaleH = 312 / imgEl.height, scaleW = 820 / imgEl.width;
            const initScale = Math.max(scaleH, scaleW);
            cropData = { img: imgEl, dragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, scale: initScale, minScale: Math.min(scaleH, scaleW) * 0.5 };
            cropData.offsetX = (820 - imgEl.width * initScale) / 2;
            cropData.offsetY = (312 - imgEl.height * initScale) / 2;
            document.getElementById('zoomSlider').value = initScale;
            document.getElementById('zoomSlider').min = cropData.minScale;
            drawCrop(canvas);
        };
        imgEl.src = e.target.result;
        document.getElementById('zoomSlider').addEventListener('input', ev => { cropData.scale = parseFloat(ev.target.value); clampOffset(); drawCrop(canvas); saveCanvasCover(canvas); });
        canvas.addEventListener('mousedown', ev => { cropData.dragging = true; cropData.startX = ev.clientX - cropData.offsetX; cropData.startY = ev.clientY - cropData.offsetY; canvas.style.cursor = 'grabbing'; });
        window.addEventListener('mousemove', ev => { if (!cropData.dragging) return; cropData.offsetX = ev.clientX - cropData.startX; cropData.offsetY = ev.clientY - cropData.startY; clampOffset(); drawCrop(canvas); });
        window.addEventListener('mouseup', () => { if (!cropData.dragging) return; cropData.dragging = false; canvas.style.cursor = 'grab'; saveCanvasCover(canvas); });
        canvas.addEventListener('wheel', ev => { ev.preventDefault(); cropData.scale = Math.max(cropData.minScale, cropData.scale - ev.deltaY * 0.001); const slider = document.getElementById('zoomSlider'); if (slider) slider.value = cropData.scale; clampOffset(); drawCrop(canvas); saveCanvasCover(canvas); }, { passive: false });
    };
    reader.readAsDataURL(file);
}

function adjustZoom(delta) {
    const canvas = document.querySelector('#coverPreviewWrap canvas');
    if (!canvas || !cropData.img) return;
    cropData.scale = Math.max(cropData.minScale || 0.1, cropData.scale + delta);
    const slider = document.getElementById('zoomSlider');
    if (slider) slider.value = cropData.scale;
    clampOffset(); drawCrop(canvas); saveCanvasCover(canvas);
}

function clampOffset() {
    if (!cropData.img) return;
    const drawW = cropData.img.width * cropData.scale, drawH = cropData.img.height * cropData.scale;
    if (drawW >= 820) cropData.offsetX = Math.min(0, Math.max(820 - drawW, cropData.offsetX));
    if (drawH >= 312) cropData.offsetY = Math.min(0, Math.max(312 - drawH, cropData.offsetY));
}

function saveCanvasCover(canvas) { exportSettings.coverBase64 = canvas.toDataURL('image/jpeg', 0.92); }

function drawCrop(canvas) {
    const ctx = canvas.getContext('2d');
    const { img, offsetX, offsetY, scale } = cropData;
    ctx.clearRect(0, 0, 820, 312);
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, 820, 312);
    ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
}

function clearCover() {
    exportSettings.coverBase64 = null;
    const wrap = document.getElementById('coverPreviewWrap');
    wrap.style.position = '';
    wrap.innerHTML = `<img id="coverPreview" src="" style="width:100%;height:100%;object-fit:cover;display:none;"><span id="coverPlaceholder" style="color:var(--text2);font-size:0.9rem;">📷 Clic para subir imagen de portada</span>`;
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
        wrap.style.position = 'relative'; wrap.appendChild(hint);
    }
    if (s.showImage       === false) document.getElementById('showImage').checked       = false;
    if (s.showCuenta      === false) document.getElementById('showCuenta').checked      = false;
    if (s.showFecha       === false) document.getElementById('showFecha').checked       = false;
    if (s.showPlataformas === false) document.getElementById('showPlataformas').checked = false;
    if (s.showTexto       === false) document.getElementById('showTexto').checked       = false;
}

function applyFilter() {
    const from = document.getElementById('filterFrom').value, to = document.getElementById('filterTo').value;
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
    const from = document.getElementById('filterFrom').value, to = document.getElementById('filterTo').value;
    let posts = allPosts;
    if (from || to) posts = allPosts.filter(post => { const fecha = post.fecha_programada?.slice(0,10); if (from && fecha < from) return false; if (to && fecha > to) return false; return true; });
    const s = exportSettings;
    const showImage = s.showImage !== false, showCuenta = s.showCuenta !== false, showFecha = s.showFecha !== false, showPlataformas = s.showPlataformas !== false, showTexto = s.showTexto !== false;
    const pdfTitle = s.title || 'Programación de Publicaciones', pdfFooter = s.footer || '', coverBase64 = s.coverBase64 || null;
    const cuentas = [...new Set(posts.map(p => p.cuenta_nombre).filter(Boolean))];
    const cuentasTitulo = cuentas.length > 0 ? cuentas.join(', ') : 'Todas las cuentas';
    const fromFmt = from ? new Date(from + 'T00:00:00').toLocaleDateString('es-DO', {day:'2-digit',month:'long',year:'numeric'}) : null;
    const toFmt   = to   ? new Date(to   + 'T00:00:00').toLocaleDateString('es-DO', {day:'2-digit',month:'long',year:'numeric'}) : null;
    const rangoTexto = fromFmt && toFmt ? `Del ${fromFmt} al ${toFmt}` : fromFmt ? `Desde el ${fromFmt}` : toFmt ? `Hasta el ${toFmt}` : 'Todas las fechas';
    const win = window.open('', '_blank');
    const mediaUrls = [];
    const rows = posts.map(post => {
        const fecha = new Date(post.fecha_programada).toLocaleString('es-DO',{dateStyle:'full',timeStyle:'short'});
        const publicUrls=(function(){try{var p=JSON.parse(post.imagen_url||"[]");return Array.isArray(p)?p.filter(function(u){return u&&u.startsWith("http")}):(post.imagen_url&&post.imagen_url.startsWith("http")?[post.imagen_url]:[]);}catch(e){return post.imagen_url&&post.imagen_url.startsWith("http")?[post.imagen_url]:[]}})();var firstUrl=publicUrls[0]||null;var isVideo=firstUrl&&firstUrl.includes("/video/");var thumbSrc=isVideo?firstUrl.replace("/video/upload/","/video/upload/so_0,w_300,h_300,c_fill/").replace(/.(mp4|mov|webm)$/,".jpg"):firstUrl;var mediaHtml=firstUrl?"<a href='"+firstUrl+"' target='_blank'><img src='"+thumbSrc+"' style='width:100%;height:150px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;'></a>":"<div style='width:100%;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;'>Sin imagen</div>";
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
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${pdfTitle}</title><style>body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:900px;margin:0 auto;background:#fafafa;}h1{color:#6c63ff;margin-bottom:4px;font-size:1.6rem;}@media print{body{padding:20px;}}</style></head><body>${coverHtml}<h1>📅 ${pdfTitle}</h1><div style="color:#333;font-size:1rem;font-weight:600;margin-bottom:2px;">👤 ${cuentasTitulo}</div><div style="color:#6c63ff;font-size:0.95rem;margin-bottom:4px;">🗓 ${rangoTexto}</div><p style="color:#aaa;margin-bottom:32px;font-size:0.85rem;">${posts.length} publicación${posts.length !== 1 ? 'es' : ''}</p>${rows}${footerHtml}<script>window.onload=()=>window.print();<\/script></body></html>`);
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
            let firstMedia = post.imagen_url || '', isCarousel = false;
            try { const parsed = JSON.parse(firstMedia); if (Array.isArray(parsed) && parsed.length > 0) { isCarousel = parsed.length > 1; firstMedia = parsed[0]; } } catch(e) {}
            const isVideoUrl = firstMedia && (firstMedia.includes("/video/") || /\.(mp4|mov|webm)/i.test(firstMedia));
            let imgEl;
            if (isVideoUrl) {
                imgEl = document.createElement("video"); imgEl.className = "post-img"; imgEl.src = firstMedia; imgEl.muted = true; imgEl.style.objectFit = "cover"; imgEl.style.pointerEvents = "none";
            } else if (firstMedia) {
                imgEl = document.createElement("img"); imgEl.className = "post-img"; imgEl.src = firstMedia; imgEl.alt = "imagen";
                if (isCarousel) { const wrapper = document.createElement("div"); wrapper.style.cssText = "position:relative;"; const badge = document.createElement("span"); badge.textContent = "🗂 Carrusel"; badge.style.cssText = "position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.6);color:white;font-size:10px;padding:2px 6px;border-radius:4px;"; wrapper.appendChild(imgEl); wrapper.appendChild(badge); imgEl = wrapper; }
            } else {
                imgEl = document.createElement("div"); imgEl.className = "post-img"; imgEl.style = "background:var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem;"; imgEl.innerHTML = "📄";
            }
            const plats = (post.plataformas||'').split(',').filter(Boolean).map(p=>`<span class="plat-badge ${p==='instagram'?'plat-ig':'plat-fb'}">${p==='instagram'?'📸 Instagram':'👥 Facebook'}</span>`).join('');
            const estadoClass = post.estado === 'publicado' ? 'estado-ok' : post.estado === 'fallido' ? 'estado-err' : 'estado-pending';
            const cuentaNombre = post.cuenta_nombre ? `<span class="cuenta-badge">👤 ${post.cuenta_nombre}</span>` : '';
            const body = document.createElement('div');
            body.className = 'post-body';
            body.innerHTML = `<div class="post-header-row"><div class="post-plats">${plats}${cuentaNombre}</div><span class="post-estado ${estadoClass}">${post.estado}</span></div><p class="post-text">${post.contenido||'<em style="opacity:0.5">Sin texto</em>'}</p><div class="post-footer"><span class="post-date-badge">📅 ${new Date(post.fecha_programada).toLocaleString('es-DO',{dateStyle:'medium',timeStyle:'short'})}</span><div class="post-actions"><button onclick="editPost(${post.id})" class="btn-action btn-edit">✏️ Editar</button><button onclick="deletePost(${post.id})" class="btn-action btn-delete">🗑 Eliminar</button></div></div>`;
            card.appendChild(imgEl); card.appendChild(body); container.appendChild(card);
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
    } catch (err) { console.error('Error cargando stats:', err); }
}

async function connectFacebook() { window.location.href = '/api/auth/login'; }

async function loadAccountsSelect() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    const select = document.getElementById("accountSelect");
    if (select && data.accounts) {
        select.innerHTML = `<option value="">-- Seleccionar cuenta --</option>` + data.accounts.map(acc => `<option value="${acc.id}">${acc.usuario} (${acc.plataforma})</option>`).join("");
    }
}
loadAccountsSelect();

async function publishDirectly(post) {
    const accRes = await fetch("/api/accounts");
    const accData = await accRes.json();
    const cuentas = accData.accounts || [];
    const apiVersion = "v18.0";
    const plataformas = (post.plataformas || "").split(",").filter(Boolean);
    let mediaUrls = [];
    try { mediaUrls = JSON.parse(post.imagen_url || "[]"); } catch(e) { if (post.imagen_url) mediaUrls = [post.imagen_url]; }
    const publicUrls = [];
    for (const m of mediaUrls) {
        if (m && m.startsWith('data:')) {
            try {
                const isVid = m.startsWith('data:video');
                const formData = new FormData();
                formData.append('file', m); formData.append('upload_preset', 'admsocial');
                const res = await fetch('https://api.cloudinary.com/v1_1/dglswxsel/' + (isVid ? 'video' : 'image') + '/upload', {method:'POST', body: formData});
                const d = await res.json();
                if (d.secure_url) publicUrls.push(d.secure_url);
            } catch(e) { console.error('Error subiendo a Cloudinary:', e); }
        } else if (m) { publicUrls.push(m); }
    }
    mediaUrls = publicUrls;
    for (const plat of plataformas) {
        const cuenta = cuentas.find(a => a.plataforma === plat && post.cuenta_nombre && post.cuenta_nombre.includes(a.usuario));
        if (!cuenta) continue;
        const token = cuenta.token, pageId = cuenta.page_id || cuenta.usuario;
        if (plat === 'instagram') {
            const igId = cuenta.ig_id || cuenta.ig_account_id;
            if (!igId || mediaUrls.length === 0) continue;
            const mediaRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ image_url: mediaUrls[0], caption: post.contenido || '', access_token: token }) });
            const mediaData = await mediaRes.json();
            if (!mediaData.id) throw new Error('Instagram media error: ' + JSON.stringify(mediaData));
            await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ creation_id: mediaData.id, access_token: token }) });
            continue;
        }
        if (mediaUrls.length > 1) {
            const attachments = [];
            for (const url of mediaUrls) {
                const isVid = url.includes("/video/") || /.(mp4|mov|webm)/i.test(url);
                const endpoint = isVid ? 'videos' : 'photos';
                const bodyData = isVid ? {file_url: url, published: false, access_token: token} : {url, published: false, access_token: token};
                const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/${endpoint}`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(bodyData) });
                const d = await r.json(); if (d.error) throw new Error(d.error.message);
                attachments.push({media_fbid: d.id});
            }
            const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({message: post.contenido || "", attached_media: attachments, access_token: token}) });
            const d = await r.json(); if (d.error) throw new Error(d.error.message);
        } else if (mediaUrls.length === 1) {
            const media = mediaUrls[0], isVideo = media.includes("/video/") || /.(mp4|mov|webm)/i.test(media);
            const endpoint = isVideo ? 'videos' : 'photos';
            const bodyData = isVideo ? {file_url: media, description: post.contenido || "", access_token: token} : {url: media, message: post.contenido || "", access_token: token};
            const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/${endpoint}`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(bodyData) });
            const d = await r.json(); if (d.error) throw new Error(d.error.message);
        } else {
            const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({message: post.contenido || "", access_token: token}) });
            const d = await r.json(); if (d.error) throw new Error(d.error.message);
        }
        await fetch("/api/posts/" + post.id, {method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({estado: "publicado"})});
    }
}

async function schedulePost(publishNow = false) {
    const text = document.getElementById('postText').value;
    const dateVal = document.getElementById("scheduleDate").value;
    const hour = parseInt(document.getElementById("scheduleHour").value);
    const min = document.getElementById("scheduleMin").value;
    const ampm = document.getElementById("scheduleAmPm").value;
    const hour24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const scheduledAt = publishNow ? new Date(Date.now() - 60000).toISOString().slice(0,19) : dateVal + "T" + String(hour24).padStart(2,"0") + ":" + min + ":00";
    const instagram = document.getElementById('instagramCheck').checked;
    const facebook = document.getElementById('facebookCheck').checked;
    const fileInput = document.getElementById('fileInput');
    let hasError = false;
    const markRed = (el) => { if (!el) return; el.style.border = '2px solid var(--red)'; setTimeout(() => el.style.border = '', 3000); };
    if (!instagram && !facebook) { markRed(document.getElementById('instagramCheck')?.closest('.networks-row')); showToast('Selecciona al menos una red social', 'error'); hasError = true; }
    const accountSelect = document.getElementById('accountSelect');
    if (!accountSelect?.value) { markRed(accountSelect); showToast('Selecciona una cuenta', 'error'); hasError = true; }
    if (!publishNow && !dateVal) { markRed(document.getElementById('scheduleDate')); showToast('La fecha es requerida', 'error'); hasError = true; }
    const tipoOpciones = document.getElementById('tipoOpciones');
    const tipoVisible = document.getElementById('tipoPublicacionRow')?.style.display !== 'none';
    const tipoElegido = !tipoVisible || (tipoOpciones && [...tipoOpciones.querySelectorAll('button')].some(b => b.dataset.selected === 'true'));
    if (!tipoElegido) { tipoOpciones.style.border = '2px solid var(--red)'; tipoOpciones.style.borderRadius = '8px'; tipoOpciones.style.padding = '4px'; setTimeout(() => { tipoOpciones.style.border = ''; tipoOpciones.style.padding = ''; }, 3000); showToast('Selecciona al menos un tipo de publicación', 'error'); hasError = true; }
    if (hasError) return;
    if (!publishNow && !scheduledAt) return showToast('La fecha es requerida', 'error');
    const cuenta_nombre = accountSelect?.options[accountSelect.selectedIndex]?.text || '';
    let mediaUrls = [];
    const filesToUpload = (typeof carouselFiles !== 'undefined' && carouselFiles.length > 0) ? carouselFiles : (fileInput && fileInput.files.length > 0 ? Array.from(fileInput.files).slice(0, 10) : []);
    if (filesToUpload.length > 0) {
        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            if (file.type.startsWith("video/")) {
                showToast("Subiendo video " + (i+1) + " de " + filesToUpload.length + "...", "info");
                const formData = new FormData();
                formData.append("file", file); formData.append("upload_preset", "admsocial"); formData.append("folder", "admsocial");
                const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dglswxsel/video/upload", { method: "POST", body: formData });
                const cloudData = await cloudRes.json();
                if (!cloudData.secure_url) { showToast("Error subiendo video " + (i+1), "error"); return; }
                mediaUrls.push(cloudData.secure_url);
            } else {
                showToast("Subiendo imagen " + (i+1) + " de " + filesToUpload.length + "...", "info");
                const base64 = await new Promise(resolve => {
                    const canvas = document.createElement("canvas"), img = new Image();
                    img.onload = () => { const MAX = 1080; let w = img.width, h = img.height; if (w > MAX) { h = h * MAX / w; w = MAX; } if (h > MAX) { w = w * MAX / h; h = MAX; } canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]); };
                    img.src = URL.createObjectURL(file);
                });
                const cloudForm = new FormData();
                cloudForm.append("upload_preset", "admsocial"); cloudForm.append("file", "data:image/jpeg;base64," + base64); cloudForm.append("folder", "admsocial");
                const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dglswxsel/image/upload", { method: "POST", body: cloudForm });
                const cloudData = await cloudRes.json();
                if (!cloudData.secure_url) { showToast("Error subiendo imagen " + (i+1), "error"); return; }
                const imgUrl = cloudData.secure_url.includes('.jpg') || cloudData.secure_url.includes('.png') ? cloudData.secure_url : cloudData.secure_url + '.jpg';
                mediaUrls.push(imgUrl);
            }
        }
    }
    const image_base64 = mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null;
    const postData = { text, scheduled_at: scheduledAt, instagram, facebook, image_base64, cuenta_nombre, tipo_publicacion: tipoSeleccionado?.id || null };
    try {
        const res = await fetch('/api/posts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(postData) });
        const data = await res.json();
        if (data.success) {
            if (publishNow && data.post?.id) {
                showToast("Publicando...", "info");
                try {
                    if (mediaUrls.length > 0) data.post.imagen_url = JSON.stringify(mediaUrls);
                    await publishDirectly(data.post);
                    showToast("✅ PUBLICADO", "success"); setTimeout(() => location.reload(), 2500);
                } catch(e) { showToast("Error al publicar: " + e.message, "error"); }
            } else {
                showToast('✅ PROGRAMADO', 'success'); setTimeout(() => location.reload(), 2500);
            }
            document.getElementById('postText').value = '';
            document.getElementById('scheduleDate').value = '';
            document.getElementById('charCounter').textContent = '0';
            document.getElementById('instagramCheck').checked = false;
            document.getElementById('facebookCheck').checked = false;
            document.getElementById('fileInput').value = '';
            document.getElementById('uploadPlaceholder').style.display = 'flex';
            document.getElementById('uploadIcon').textContent = '🖼';
            document.getElementById('uploadHint').textContent = 'Arrastra una imagen o video y haz clic';
            document.getElementById('dimensionInfo').textContent = '';
            document.getElementById('tipoPublicacionRow').style.display = 'none';
            const grid = document.getElementById('mediaPreviewGrid');
            if (grid) { grid.innerHTML = ''; grid.style.display = 'none'; }
            document.getElementById('tipoOpciones').innerHTML = '';
            document.getElementById('dimensionLabel').textContent = '';
            carouselFiles = [];
        } else { showToast('Error: ' + data.error, 'error'); }
    } catch (err) { showToast('No se pudo conectar con el servidor', 'error'); }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    document.getElementById('themeToggle').textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.getElementById('postText')?.addEventListener('input', function() { document.getElementById('charCounter').textContent = this.value.length; });
document.getElementById('uploadArea')?.addEventListener('click', () => { document.getElementById('fileInput').click(); });

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
    const ig = document.getElementById('instagramCheck')?.checked, fb = document.getElementById('facebookCheck')?.checked;
    const row = document.getElementById('tipoPublicacionRow'), opciones = document.getElementById('tipoOpciones'), dimLabel = document.getElementById('dimensionLabel');
    if (!row) return;
    if (!ig && !fb) { row.style.display = 'none'; return; }
    row.style.display = 'block'; opciones.innerHTML = ''; tipoSeleccionado = null; dimLabel.textContent = '';
    const tipos = [];
    if (ig) TIPOS.instagram.forEach(t => { if (!tipos.find(x=>x.id===t.id)) tipos.push(t); });
    if (fb) TIPOS.facebook.forEach(t => { if (!tipos.find(x=>x.id===t.id)) tipos.push(t); });
    const vistos = new Set();
    tipos.filter(t => { if (vistos.has(t.label)) return false; vistos.add(t.label); return true; }).forEach(tipo => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = tipo.label; btn.dataset.dim = tipo.dim; btn.dataset.info = tipo.info;
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
    const ig = document.getElementById('instagramCheck')?.checked, fb = document.getElementById('facebookCheck')?.checked;
    const info = document.getElementById('dimensionInfo');
    if (!info) return;
    if (ig && fb) info.textContent = '📐 Instagram: 1080x1080 · Facebook: 1200x630';
    else if (ig)  info.textContent = '📐 Instagram Feed: 1080x1080 · Story/Reel: 1080x1920';
    else if (fb)  info.textContent = '📐 Facebook Feed: 1200x630 · Story: 1080x1920';
    else          info.textContent = '';
}
document.getElementById('instagramCheck')?.addEventListener('change', () => { updateDimensionInfo(); renderTipos(); });
document.getElementById('facebookCheck')?.addEventListener('change',  () => { updateDimensionInfo(); renderTipos(); });

function renderCarouselGrid() {
    const grid = document.getElementById('mediaPreviewGrid');
    const cnt = carouselFiles.length;
    grid.style.display = cnt > 0 ? 'flex' : 'none';
    grid.style.flexWrap = 'nowrap'; grid.style.overflowX = cnt > 3 ? 'scroll' : 'hidden'; grid.style.overflowY = 'hidden';
    grid.style.flexDirection = 'row'; grid.style.alignItems = 'stretch'; grid.style.gap = '8px';
    grid.style.scrollSnapType = 'x mandatory'; grid.style.scrollBehavior = 'smooth'; grid.style.scrollbarWidth = 'none';
    const uploadArea = document.getElementById('uploadArea');
    const maxW = uploadArea ? uploadArea.offsetWidth - 16 : 400;
    grid.style.width = maxW + 'px'; grid.style.maxWidth = maxW + 'px'; grid.innerHTML = '';
    document.querySelectorAll('.carousel-arrow').forEach(a => a.remove());
    if (cnt > 3) {
        const arrowStyle = 'position:absolute;top:50%;transform:translateY(-50%);background:rgba(108,99,255,0.6);color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;';
        const leftBtn = document.createElement('button'); leftBtn.className = 'carousel-arrow'; leftBtn.innerHTML = '&#8249;'; leftBtn.style.cssText = arrowStyle + 'left:6px;'; leftBtn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); grid.scrollBy({ left: -grid.offsetWidth/3, behavior: 'smooth' }); };
        const rightBtn = document.createElement('button'); rightBtn.className = 'carousel-arrow'; rightBtn.innerHTML = '&#8250;'; rightBtn.style.cssText = arrowStyle + 'right:6px;'; rightBtn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); grid.scrollBy({ left: grid.offsetWidth/3, behavior: 'smooth' }); };
        if (uploadArea) { uploadArea.style.position = 'relative'; uploadArea.style.overflow = 'hidden'; uploadArea.appendChild(leftBtn); uploadArea.appendChild(rightBtn); }
    }
    carouselFiles.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        const wrapper = document.createElement('div');
        wrapper.draggable = true; wrapper.dataset.idx = idx;
        const areaWidth = (uploadArea?.offsetWidth || 400) - 16, areaHeight = (uploadArea?.offsetHeight || 400) - 16;
        const count = carouselFiles.length;
        let itemW;
        if (count === 1) itemW = areaWidth;
        else if (count === 2) itemW = Math.floor((areaWidth - 8) / 2);
        else itemW = Math.floor((areaWidth - 16) / 3);
        wrapper.style.cssText = 'position:relative;border-radius:8px;overflow:hidden;border:2px solid #6c63ff;cursor:grab;flex-shrink:0;width:' + itemW + 'px;height:' + areaHeight + 'px;scroll-snap-align:start;object-fit:cover;';
        if (file.type.startsWith('video/')) {
            const v = document.createElement('video');
            v.src = url; v.style.cssText = 'max-width:100%;max-height:400px;display:block;background:#000;border-radius:6px;';
            const playBtn = document.createElement('div');
            playBtn.innerHTML = '▶'; playBtn.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;z-index:3;';
            playBtn.onclick = (e) => { e.stopPropagation(); if (v.paused) { v.play(); playBtn.style.opacity='0'; } else { v.pause(); playBtn.style.opacity='1'; } };
            v.onclick = () => { if (v.paused) { v.play(); playBtn.style.opacity='0'; } else { v.pause(); playBtn.style.opacity='1'; } };
            v.onended = () => { playBtn.style.opacity='1'; playBtn.innerHTML='▶'; };
            wrapper.appendChild(playBtn); wrapper.appendChild(v);
        } else {
            const img = document.createElement('img');
            img.src = url; img.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#f8f8f8;';
            wrapper.appendChild(img);
        }
        const badge = document.createElement('div');
        badge.textContent = idx + 1; badge.style.cssText = 'position:absolute;top:3px;left:3px;background:#6c63ff;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;z-index:2;';
        wrapper.appendChild(badge);
        const del = document.createElement('div');
        del.textContent = 'x'; del.style.cssText = 'position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;z-index:2;';
        del.onclick = (e) => { e.stopPropagation(); carouselFiles.splice(idx, 1); renderCarouselGrid(); updateCarouselHint(); };
        wrapper.appendChild(del);
        wrapper.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', idx); wrapper.style.opacity = '0.5'; });
        wrapper.addEventListener('dragend', () => { wrapper.style.opacity = '1'; });
        wrapper.addEventListener('dragover', (e) => { e.preventDefault(); wrapper.style.border = '2px solid #ff6b6b'; });
        wrapper.addEventListener('dragleave', () => { wrapper.style.border = '2px solid #6c63ff'; });
        wrapper.addEventListener('drop', (e) => { e.preventDefault(); wrapper.style.border = '2px solid #6c63ff'; const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== idx) { const moved = carouselFiles.splice(from, 1)[0]; carouselFiles.splice(idx, 0, moved); renderCarouselGrid(); } });
        grid.appendChild(wrapper);
    });
}

function updateCarouselHint() {
    const hint = document.getElementById('uploadHint'), icon = document.getElementById('uploadIcon');
    if (carouselFiles.length === 0) {
        document.getElementById('uploadPlaceholder').style.display = 'flex';
        document.getElementById('mediaPreviewGrid').style.display = 'none';
        if (hint) hint.textContent = 'Clic para subir foto o video';
        if (icon) icon.textContent = '🔎';
    } else {
        if (hint) hint.textContent = carouselFiles.length + ' archivo(s) - Arrastra para reordenar';
        if (icon) icon.textContent = carouselFiles.length > 1 ? '🗂' : (carouselFiles[0].type.startsWith('video/') ? '🎬' : '🖼');
    }
}

document.getElementById('fileInput')?.addEventListener('change', function() {
    const newFiles = Array.from(this.files);
    carouselFiles = [...carouselFiles, ...newFiles].slice(0, 10);
    document.getElementById('uploadPlaceholder').style.display = 'none';
    renderCarouselGrid(); updateCarouselHint(); this.value = '';
});

async function deletePost(id) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    loadPosts();
}

async function editPost(id) {
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `<div style="background:var(--bg2);border-radius:12px;padding:2rem;width:90%;max-width:500px;display:flex;flex-direction:column;gap:1rem;"><h3 style="margin:0;">✏️ Editar Publicación</h3><textarea id="editTexto" rows="4" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);resize:vertical;">${post.contenido || ''}</textarea><input type="datetime-local" id="editFecha" value="${(post.fecha_programada||'').slice(0,16)}" style="padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);"/><div><label style="font-size:0.85rem;color:var(--text2);">Cambiar imagen (opcional)</label><input type="file" id="editImagen" accept="image/*,video/*" style="margin-top:6px;width:100%;"/><div id="editPreview" style="margin-top:8px;display:none;"><img id="editPreviewImg" style="max-width:100%;max-height:200px;border-radius:8px;display:none;"/><video id="editPreviewVid" controls style="max-width:100%;max-height:200px;border-radius:8px;display:none;"></video></div></div><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;"><button id="cancelEdit" style="padding:8px 18px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;">Cancelar</button><button id="saveEdit" style="padding:8px 18px;border-radius:8px;border:none;background:var(--accent);color:white;cursor:pointer;">💾 Guardar</button><button id="publishNowEdit" style="padding:8px 18px;border-radius:8px;border:none;background:#22c55e;color:white;cursor:pointer;">🚀 Publicar Ahora</button></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('cancelEdit').onclick = () => modal.remove();
    document.getElementById('editImagen').addEventListener('change', function() {
        const file = this.files[0]; if (!file) return;
        const url = URL.createObjectURL(file);
        const img = document.getElementById('editPreviewImg'), vid = document.getElementById('editPreviewVid');
        document.getElementById('editPreview').style.display = 'block';
        if (file.type.startsWith('video/')) { vid.src = url; vid.style.display = 'block'; img.style.display = 'none'; }
        else { img.src = url; img.style.display = 'block'; vid.style.display = 'none'; }
    });
    document.getElementById('saveEdit').onclick = async () => {
        const nuevoTexto = document.getElementById('editTexto').value;
        const nuevaFecha = document.getElementById('editFecha').value + ':00';
        const fileInput = document.getElementById('editImagen');
        let image_base64 = null;
        if (fileInput.files[0]) { image_base64 = await new Promise(resolve => { const reader = new FileReader(); reader.onload = e => resolve(e.target.result); reader.readAsDataURL(fileInput.files[0]); }); }
        const patchRes = await fetch(`/api/posts/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contenido: nuevoTexto, fecha_programada: nuevaFecha, image_base64 }) });
        const patchData = await patchRes.json();
        if (patchData.success) showToast('✅ Publicación actualizada', 'success');
        else showToast('❌ Error: ' + (patchData.error || 'desconocido'), 'error');
        modal.remove(); loadPosts();
    };
    document.getElementById('publishNowEdit').onclick = async () => {
        const nuevoTexto = document.getElementById('editTexto').value;
        const fileInput = document.getElementById('editImagen');
        let image_base64 = null;
        if (fileInput.files[0]) { image_base64 = await new Promise(resolve => { const reader = new FileReader(); reader.onload = e => resolve(e.target.result); reader.readAsDataURL(fileInput.files[0]); }); }
        const ahora = new Date(Date.now() - 60000).toISOString().slice(0,16) + ':00';
        const patchRes = await fetch(`/api/posts/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contenido: nuevoTexto, fecha_programada: ahora, image_base64, estado: 'pendiente' }) });
        const patchData = await patchRes.json();
        if (patchData.success) showToast('🚀 Publicando ahora...', 'success');
        else showToast('❌ Error: ' + (patchData.error || 'desconocido'), 'error');
        modal.remove(); loadPosts();
    };
}

function shareConnectLink() {
    const url = 'https://admsocial.vercel.app/conectar';
    if (navigator.share) navigator.share({ title: 'Conectar cuenta', url });
    else { navigator.clipboard.writeText(url); showToast('Link copiado al portapapeles', 'success'); }
}

function logout() { sessionStorage.removeItem('user'); window.location.href = '/login'; }

function showTab(tab) {
    document.getElementById('tabPDF').style.display = tab === 'tabPDF' ? 'block' : 'none';
    document.getElementById('tabAdmin').style.display = tab === 'tabAdmin' ? 'block' : 'none';
    document.getElementById('btnTabPDF').style.borderBottomColor = tab === 'tabPDF' ? '#6c63ff' : 'transparent';
    document.getElementById('btnTabPDF').style.color = tab === 'tabPDF' ? '#6c63ff' : '#999';
    document.getElementById('btnTabAdmin').style.borderBottomColor = tab === 'tabAdmin' ? '#6c63ff' : 'transparent';
    document.getElementById('btnTabAdmin').style.color = tab === 'tabAdmin' ? '#6c63ff' : '#999';
    if (tab === 'tabAdmin') loadUsers();
}

async function loadUsers() {
    const res = await fetch('/api/auth/users');
    const data = await res.json();
    const container = document.getElementById('usersList');
    if (!container) return;
    if (!data.users || !data.users.length) { container.innerHTML = '<p style="color:#999;">No hay usuarios asistentes</p>'; return; }
    container.innerHTML = data.users.map(u => `<div style="border:1px solid #eee;border-radius:8px;margin-bottom:8px;overflow:hidden;"><div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;"><div><strong>${u.nombre || u.username}</strong><span style="display:block;font-size:0.8rem;color:#999;">@${u.username} · ${u.rol}</span></div><div style="display:flex;gap:8px;"><span style="padding:4px 10px;border-radius:99px;background:${u.activo ? '#e8f5e9' : '#fce4ec'};color:${u.activo ? '#27ae60' : '#e74c3c'};font-size:0.8rem;">${u.activo ? 'Activo' : 'Inactivo'}</span><button onclick="toggleEditUser(${u.id})" style="padding:4px 10px;border:1px solid #6c63ff;background:transparent;color:#6c63ff;border-radius:6px;cursor:pointer;font-size:0.8rem;">✏️ Editar</button><button onclick="deleteUser(${u.id})" style="padding:4px 10px;border:1px solid #e74c3c;background:transparent;color:#e74c3c;border-radius:6px;cursor:pointer;font-size:0.8rem;">🗑 Eliminar</button></div></div><div id="editUser${u.id}" style="display:none;padding:16px;background:#f9f9ff;border-top:1px solid #eee;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;"><div><label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:4px;">Nombre</label><input id="editNombre${u.id}" value="${u.nombre || ''}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;"></div><div><label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:4px;">Email</label><input id="editEmail${u.id}" value="${u.email || ''}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;"></div><div><label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:4px;">Nueva contraseña</label><input type="password" id="editPass${u.id}" placeholder="Dejar vacío para no cambiar" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;"></div><div><label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:4px;">Rol</label><select id="editRol${u.id}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;"><option value="asistente" ${u.rol==='asistente'?'selected':''}>Asistente</option><option value="admin" ${u.rol==='admin'?'selected':''}>Administrador</option></select></div></div><div style="margin-bottom:12px;"><label style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:6px;">Estado</label><select id="editActivo${u.id}" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;"><option value="1" ${u.activo?'selected':''}>Activo</option><option value="0" ${!u.activo?'selected':''}>Inactivo</option></select></div><div style="display:flex;gap:8px;"><button onclick="saveEditUser(${u.id})" style="padding:8px 20px;background:#6c63ff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;">💾 Guardar</button><button onclick="toggleEditUser(${u.id})" style="padding:8px 16px;background:transparent;color:#999;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:0.85rem;">Cancelar</button></div></div></div>`).join('');
}

async function deleteUser(id) { if (!confirm('¿Eliminar este usuario?')) return; await fetch('/api/auth/users?id=' + id, { method: 'DELETE' }); loadUsers(); }

function saveAdminSettings() { localStorage.setItem('adminNombre', document.getElementById('adminNombre').value); showToast('Configuración guardada', 'success'); }

function toggleUserForm() {
    const form = document.getElementById('userForm'), btn = document.getElementById('btnNuevoUsuario');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    if (btn) btn.style.display = isHidden ? 'none' : 'inline-block';
    if (isHidden) loadCuentasParaUsuario();
}

async function loadCuentasParaUsuario() {
    const res = await fetch('/api/accounts');
    const data = await res.json();
    const container = document.getElementById('cuentasCheckList');
    if (!container) return;
    const grouped = {};
    (data.accounts || []).forEach(c => { if (!grouped[c.page_id]) grouped[c.page_id] = { nombre: c.nombre || c.usuario, page_id: c.page_id }; });
    container.innerHTML = Object.values(grouped).map(g => `<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-size:0.85rem;"><input type="checkbox" name="cuentaCheck" value="${g.page_id}"> ${g.nombre}</label>`).join('');
}

async function createUser() {
    const nombre = document.getElementById('newNombre').value.trim(), username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim(), password = document.getElementById('newPassword').value;
    const rol = document.getElementById('newRol').value;
    const permisos = [...document.querySelectorAll('input[name="perm"]:checked')].map(c => c.value);
    const cuentasAsignadas = [...document.querySelectorAll('input[name="cuentaCheck"]:checked')].map(c => c.value);
    if (!nombre || !username || !password) { showToast('Completa los campos obligatorios', 'error'); return; }
    const res = await fetch('/api/auth/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, username, email, password, rol, permisos: permisos.join(','), cuentas: cuentasAsignadas }) });
    const data = await res.json();
    if (data.success) { showToast('Usuario creado exitosamente', 'success'); setTimeout(() => { toggleUserForm(); loadUsers(); ['newNombre','newUsername','newEmail','newPassword'].forEach(id => document.getElementById(id).value = ''); }, 2000); }
    else showToast(data.error || 'El usuario ya existe o hubo un error', 'error');
}

function previewLogo(inputId, previewId, key) {
    const file = document.getElementById(inputId).files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain;">`; localStorage.setItem(key, e.target.result); };
    reader.readAsDataURL(file);
}

function saveLogos() { showToast('Logos guardados', 'success'); applyLogos(); }

function applyLogos() {
    const logoMenu = localStorage.getItem('logoMenu'), menuLogoEl = document.querySelector('.sidebar-logo');
    if (logoMenu && menuLogoEl) menuLogoEl.innerHTML = `<img src="${logoMenu}" style="max-height:48px;object-fit:contain;">`;
}

document.addEventListener('DOMContentLoaded', () => { applyLogos(); });

function toggleEditUser(id) { const el = document.getElementById('editUser' + id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

async function saveEditUser(id) {
    const nombre = document.getElementById('editNombre' + id).value.trim(), email = document.getElementById('editEmail' + id).value.trim();
    const password = document.getElementById('editPass' + id).value, rol = document.getElementById('editRol' + id).value;
    const activo = document.getElementById('editActivo' + id).value;
    const body = { id, nombre, email, rol, activo: parseInt(activo) };
    if (password) body.password = password;
    const res = await fetch('/api/auth/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) { showToast('Usuario actualizado', 'success'); loadUsers(); }
    else showToast(data.error || 'Error al actualizar', 'error');
}

// ═══════════════════════════════════════════════════════════════════
//  ✨ CREAR IMAGEN CON IA — Gemini 2.0 Flash
// ═══════════════════════════════════════════════════════════════════

let generatedImageBase64 = null;
let generatedImageMime   = 'image/png';
let selectedRatio        = 'cuadrada 1:1';
let imageHistoryList     = [];

// Inyectar estilos CSS
(function injectImageCreatorStyles() {
    if (document.getElementById('imageCreatorStyles')) return;
    const style = document.createElement('style');
    style.id = 'imageCreatorStyles';
    style.textContent = `
        @keyframes spinImg { to { transform: rotate(360deg); } }
        .prompt-chip {
            padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border);
            background: var(--bg3); color: var(--text2); font-size: 0.78rem;
            cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .prompt-chip:hover { border-color: var(--accent); color: var(--accent); background: rgba(108,99,255,0.08); }
        .ratio-btn {
            padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border);
            background: var(--bg3); color: var(--text2); font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
        }
        .ratio-btn:hover { border-color: var(--accent); color: var(--accent); }
        .ratio-btn.active-ratio { border-color: var(--accent); background: rgba(108,99,255,0.12); color: var(--accent); font-weight: 600; }
        .history-thumb {
            width: 64px; height: 64px; object-fit: cover; border-radius: 8px;
            border: 2px solid var(--border); cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .history-thumb:hover { border-color: var(--accent); transform: scale(1.05); }
    `;
    document.head.appendChild(style);
})();

function setPromptChip(text) {
    const textarea = document.getElementById('imagePrompt');
    if (textarea) { textarea.value = text; textarea.focus(); }
}

function selectRatio(btn) {
    document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active-ratio'));
    btn.classList.add('active-ratio');
    selectedRatio = btn.dataset.ratio;
}

async function generateImage() {
    const promptEl = document.getElementById('imagePrompt');
    const styleEl  = document.getElementById('imageStyle');
    const btn       = document.getElementById('generateImageBtn');
    const prompt = promptEl?.value?.trim();
    const style  = styleEl?.value || '';
    if (!prompt) { showGenerateError('Escribe una descripción para la imagen primero'); promptEl?.focus(); return; }
    hideGenerateError();
    const parts = [prompt];
    if (style) parts.push(style);
    if (selectedRatio) parts.push(`proporción ${selectedRatio}`);
    parts.push('alta calidad, optimizada para redes sociales');
    const fullPrompt = parts.join(', ');
    setImageUIState('loading');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }
    try {
        const res = await fetch('/api/generate-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Error desconocido al generar la imagen');
        generatedImageBase64 = data.imageBase64;
        generatedImageMime   = data.mimeType || 'image/png';
        const imgEl = document.getElementById('generatedImage');
        imgEl.src = `data:${generatedImageMime};base64,${generatedImageBase64}`;
        setImageUIState('result');
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

function setImageUIState(state) {
    const placeholder = document.getElementById('imageResultPlaceholder');
    const loading     = document.getElementById('imageLoading');
    const imgEl       = document.getElementById('generatedImage');
    const actions     = document.getElementById('imageActions');
    const box         = document.getElementById('imageResultBox');
    placeholder.style.display = 'none'; loading.style.display = 'none';
    imgEl.style.display = 'none'; actions.style.display = 'none';
    if (state === 'placeholder') { placeholder.style.display = 'block'; if (box) box.style.borderColor = 'var(--border)'; }
    else if (state === 'loading') { loading.style.display = 'flex'; if (box) box.style.borderColor = 'var(--accent)'; }
    else if (state === 'result')  { imgEl.style.display = 'block'; actions.style.display = 'flex'; if (box) box.style.borderColor = 'var(--accent)'; }
}

function showGenerateError(msg) { const el = document.getElementById('generateError'); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function hideGenerateError()    { const el = document.getElementById('generateError'); if (el) el.style.display = 'none'; }

function downloadGeneratedImage() {
    if (!generatedImageBase64) return showToast('No hay imagen para descargar', 'error');
    const ext = generatedImageMime.includes('png') ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = `data:${generatedImageMime};base64,${generatedImageBase64}`;
    a.download = `imagen-ia-${Date.now()}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('⬇️ Descargando imagen...', 'success');
}

function useGeneratedImage() {
    if (!generatedImageBase64) return showToast('No hay imagen generada', 'error');
    try {
        const byteString = atob(generatedImageBase64);
        const ab = new ArrayBuffer(byteString.length), ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: generatedImageMime });
        const ext  = generatedImageMime.includes('png') ? 'png' : 'jpg';
        const file = new File([blob], `imagen-ia.${ext}`, { type: generatedImageMime });
        carouselFiles = [file];
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelector('.nav-item[data-section="dashboard"]').classList.add('active');
        document.getElementById('dashboard').classList.add('active');
        renderCarouselGrid(); updateCarouselHint();
        const placeholder = document.getElementById('uploadPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        showToast('✅ Imagen lista en el Dashboard', 'success');
    } catch (err) { console.error('[useGeneratedImage]', err); showToast('Error al transferir la imagen', 'error'); }
}

function addToImageHistory(base64, mime, prompt) {
    imageHistoryList.unshift({ base64, mime, prompt });
    if (imageHistoryList.length > 6) imageHistoryList.pop();
    renderImageHistory();
}

function renderImageHistory() {
    const container = document.getElementById('imageHistoryGrid'), wrapper = document.getElementById('imageHistory');
    if (!container || !wrapper) return;
    if (imageHistoryList.length === 0) { wrapper.style.display = 'none'; return; }
    wrapper.style.display = 'block';
    container.innerHTML = imageHistoryList.map((item, idx) => `<img class="history-thumb" src="data:${item.mime};base64,${item.base64}" title="${item.prompt.slice(0,60)}..." onclick="restoreHistoryImage(${idx})">`).join('');
}

function restoreHistoryImage(idx) {
    const item = imageHistoryList[idx]; if (!item) return;
    generatedImageBase64 = item.base64; generatedImageMime = item.mime;
    const imgEl = document.getElementById('generatedImage');
    imgEl.src = `data:${item.mime};base64,${item.base64}`;
    setImageUIState('result');
    showToast('Imagen restaurada del historial', 'info');
}
