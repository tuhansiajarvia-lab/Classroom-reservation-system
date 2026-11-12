import { api } from './api.js';

// Инициализация обработчиков кнопок входа/регистрации и переключения вкладок
export function initAuthHandlers() {
    console.log('initAuthHandlers запущен!');
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

    // Функция для настройки кнопки переключения видимости пароля (SVG-глаз)
    const setupPasswordToggle = (buttonId, inputId) => {
        const toggleBtn = document.getElementById(buttonId);
        const passwordInput = document.getElementById(inputId);

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                const newType = isPassword ? 'text' : 'password';
                passwordInput.setAttribute('type', newType);
                
                // Меняем SVG-иконку в зависимости от текущего состояния
                if (newType === 'password') {
                    // Закрытый глаз с косой чертой (пароль скрыт)
                    toggleBtn.innerHTML = `
                        <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    `;
                } else {
                    // Открытый глаз (пароль виден, контур без заливки)
                    toggleBtn.innerHTML = `
                        <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    `;
                }
            });
        }
    };

    // Активируем переключатели для обеих форм
    setupPasswordToggle('toggleLoginPassword', 'loginPassword');
    setupPasswordToggle('toggleRegPassword', 'regPassword');

    // Обработка входа
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await api.login({ email, password });
                if (res.ok) {
                    window.location.href = '/index.html';
                } else {
                    const data = await res.json();
                    if (loginError) loginError.textContent = data.message || 'Virhe kirjautumisessa';
                }
            } catch (e) {
                if (loginError) loginError.textContent = `Yhteysvirhe palvelimeen ${e}`;
            }
        });
    }

    // Обработка регистрации
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const nimi = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            try {
                const res = await api.register({ nimi, email, password });
                if (res.ok) {
                    alert('Rekisteröinti onnistui! Voit nyt kirjautua sisään.');
                    if (loginTabBtn) loginTabBtn.click();
                } else {
                    const data = await res.json();
                    if (loginError) loginError.textContent = data.message || 'Virhe rekisteröitymisessä';
                }
            } catch (e) {
                if (loginError) loginError.textContent = `Yhteysvirhe palvelimeen ${e}`;
            }
        });
    }
}