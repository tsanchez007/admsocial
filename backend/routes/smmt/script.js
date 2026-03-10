document.addEventListener('DOMContentLoaded', () => {
    console.log("Script cargado y listo ✅");

    // --- NAVEGACIÓN ENTRE SECCIONES ---
    const menuItems = document.querySelectorAll('.sidebar nav ul li');
    const sections = document.querySelectorAll('.section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-section');
            console.log("Cambiando a sección:", target);

            // Cambiar clase activa en menú
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Mostrar sección correspondiente
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === target) s.classList.add('active');
            });
        });
    });

    // --- BOTÓN CONECTAR FACEBOOK ---
    const btnConnect = document.getElementById('btn-connect-facebook');
    if (btnConnect) {
        btnConnect.addEventListener('click', () => {
            console.log("Intentando conectar con Meta...");
            window.location.href = '/api/auth/login';
        });
    }

    // --- FORMULARIO DE PUBLICACIÓN ---
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Enviando publicación...");

            const formData = new FormData(postForm);
            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    alert('¡Publicación programada con éxito! 🎉');
                    postForm.reset();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                console.error("Error al enviar:", err);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // Cargar cuentas al inicio
    loadAccounts();
});

async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        const container = document.getElementById('accounts-list');
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
        console.error("Error cargando cuentas:", err);
    }
}