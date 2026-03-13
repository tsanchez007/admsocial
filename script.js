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

async function loadPosts() {
    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        const container = document.getElementById('postsList');
        if (!container) return;

        if (data.posts && data.posts.length > 0) {
            container.innerHTML = '';
            data.posts.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card';
                const imgEl = post.imagen_url
                    ? Object.assign(document.createElement('img'), {className:'post-img', src: post.imagen_url, alt:'imagen'})
                    : Object.assign(document.createElement('div'), {className:'post-img', innerHTML:'📄', style:'background:var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem;'});
                const plats = (post.plataformas||'').split(',').filter(Boolean).map(p=>`<span class="status-badge" style="background:var(--accent);color:white;">${p==='instagram'?'📸':'👥'} ${p}</span>`).join('');
                const body = document.createElement('div');
                body.className = 'post-body';
                body.innerHTML = `
                    <p class="post-text">${post.contenido||'(sin texto)'}</p>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
                        <span style="font-size:0.8rem;color:var(--text2);">📅 ${new Date(post.fecha_programada).toLocaleString()}</span>
                        <span class="status-badge ${post.estado}">${post.estado}</span>
                        ${plats}
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button onclick="editPost(${post.id}, this)" style="background:var(--accent);color:white;border:none;padding:4px 14px;border-radius:6px;cursor:pointer;font-size:0.85rem;">✏️ Editar</button>
                        <button onclick="deletePost(${post.id})" style="background:#e74c3c;color:white;border:none;padding:4px 14px;border-radius:6px;cursor:pointer;font-size:0.85rem;">🗑 Eliminar</button>
                    </div>`;
                card.appendChild(imgEl);
                card.appendChild(body);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>No hay publicaciones programadas.</p>';
        }
    } catch (err) {
        container.innerHTML = '<p>No hay publicaciones programadas.</p>';
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

    if (!scheduledAt) return showToast('La fecha es requerida', 'error');

    let image_base64 = null;
    if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        image_base64 = await new Promise(resolve => {
            if (file.type.startsWith('video/')) {
                // Video: leer como base64 directo
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            } else {
                // Imagen: comprimir con canvas
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
    const postData = { text, scheduled_at: scheduledAt, instagram, facebook, image_base64 };
    console.log('Enviando post:', { text, scheduled_at: scheduledAt, instagram, facebook, tieneMedia: !!image_base64, mediaSize: image_base64?.length, mediaType: fileInput.files[0]?.type });
    
    
    
    
    

    try {
        const res = await fetch('/api/posts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(postData) });
        const data = await res.json();
        if (data.success) {
            showToast('¡Publicación programada! 🎉', 'success');
            document.getElementById('postText').value = '';
            document.getElementById('scheduleDate').value = '';
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
        btn.onclick = () => {
            opciones.querySelectorAll('button').forEach(b => {
                b.style.background = 'transparent';
                b.style.borderColor = 'var(--border)';
                b.style.color = 'var(--text)';
            });
            btn.style.background = 'var(--accent)';
            btn.style.borderColor = 'var(--accent)';
            btn.style.color = 'white';
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

        await fetch(`/api/posts/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ contenido: nuevoTexto, fecha_programada: nuevaFecha, image_base64 })
        });
        modal.remove();
        loadPosts();
    };
}
