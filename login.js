document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const messageEl = document.getElementById('message');

    // Cek jika sudah login, langsung arahkan ke halaman chat
    if (localStorage.getItem('user_token')) {
        window.location.href = '/index.html'; // atau halaman chat utama Anda
    }

    async function handleAuth(endpoint) {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            messageEl.textContent = 'Email dan password tidak boleh kosong!';
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                // Simpan token (misalnya JWT) untuk sesi login
                localStorage.setItem('user_token', result.token);
                window.location.href = '/index.html'; // Arahkan ke halaman chat
            } else {
                messageEl.textContent = result.message || 'Terjadi kesalahan.';
            }
        } catch (error) {
            console.error('Error:', error);
            messageEl.textContent = 'Tidak dapat terhubung ke server.';
        }
    }

    loginBtn.addEventListener('click', () => handleAuth('/api/login'));
    registerBtn.addEventListener('click', () => handleAuth('/api/register'));
});
