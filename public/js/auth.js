import { api } from './api.js';

// Инициализация обработчиков кнопок входа/регистрации и переключения вкладок
export function initAuthHandlers() {
    const loginTabBtn = document.getElementById('showLoginTab');
    const registerTabBtn = document.getElementById('showRegisterTab');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginError = document.getElementById('loginError');

    // Переключение на вкладку входа
    if (loginTabBtn && registerTabBtn) {
        loginTabBtn.addEventListener('click', () => {
            loginTabBtn.classList.add('active');
            registerTabBtn.classList.remove('active');
            if (loginSection) loginSection.style.display = 'block';
            if (registerSection) registerSection.style.display = 'none';
            if (loginError) loginError.textContent = '';
        });

        // Переключение на вкладку регистрации
        registerTabBtn.addEventListener('click', () => {
            registerTabBtn.classList.add('active');
            loginTabBtn.classList.remove('active');
            if (loginSection) loginSection.style.display = 'none';
            if (registerSection) registerSection.style.display = 'block';
            if (loginError) loginError.textContent = '';
        });
    }

    // Кнопка переключения снизу формы
    const switchToRegBtn = document.getElementById('switchToRegBtn');
    if (switchToRegBtn && registerTabBtn) {
        switchToRegBtn.addEventListener('click', () => {
            registerTabBtn.click();
        });
    }

    const switchToLoginBtn = document.getElementById('switchToLoginBtn');
    if (switchToLoginBtn && loginTabBtn) {
        switchToLoginBtn.addEventListener('click', () => {
            loginTabBtn.click();
        });
    }

    // Обработка входа
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            const salasana = document.getElementById('loginPassword').value;

            try {
                const res = await api.login({ email, salasana });
                if (res.ok) {
                    window.location.href = '/index.html';
                } else {
                    const data = await res.json();
                    if (loginError) loginError.textContent = data.message || 'Virhe kirjautumisessa';
                }
            } catch (e) {
                if (loginError) loginError.textContent = 'Yhteysvirhe palvelimeen';
            }
        });
    }

    // Обработка регистрации
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const nimi = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const salasana = document.getElementById('regPassword').value;

            try {
                const res = await api.register({ nimi, email, salasana });
                if (res.ok) {
                    alert('Rekisteröinti onnistui! Voit nyt kirjautua sisään.');
                    if (loginTabBtn) loginTabBtn.click();
                } else {
                    const data = await res.json();
                    if (loginError) loginError.textContent = data.message || 'Virhe rekisteröitymisessä';
                }
            } catch (e) {
                if (loginError) loginError.textContent = 'Yhteysvirhe palvelimeen';
            }
        });
    }
}