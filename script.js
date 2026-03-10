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
                        <strong>${acc.username}</strong>
                        <span>${acc.platform}</span>
                    </div>
                    <span class="status-badge ${acc.status}">${acc.status}</span>
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
            container.innerHTML = data.posts.map(post => `
                <div class="post-card">
                    <p>${post.text}</p>
                    <span>${new Date(post.scheduled_at).toLocaleString()}</span>
                    <span class="status-badge ${post.status}">${post.status}</span>
                </div>
            `).join('');
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
        document.getElementById('statPending').textContent = posts.filter(p => p.status === 'scheduled').length;
        document.getElementById('statPublished').textContent = posts.filter(p => p.status === 'published').length;
        document.getElementById('statIG').textContent = posts.filter(p => p.instagram).length;
        document.getElementById('statFB').textContent = posts.filter(p => p.facebook).length;

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

async function schedulePost() {
    const text = document.getElementById('postText').value;
    const scheduledAt = document.getElementById('scheduleDate').value;
    const instagram = document.getElementById('instagramCheck').checked;
    const facebook = document.getElementById('facebookCheck').checked;
    const fileInput = document.getElementById('fileInput');

    if (!scheduledAt) return showToast('La fecha es requerida', 'error');

    const formData = new FormData();
    formData.append('text', text);
    formData.append('scheduled_at', scheduledAt);
    formData.append('instagram', instagram);
    formData.append('facebook', facebook);
    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);

    try {
        const res = await fetch('/api/posts', { method: 'POST', body: formData });
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

document.getElementById('fileInput')?.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});
