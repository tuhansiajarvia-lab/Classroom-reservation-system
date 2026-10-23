import { api } from './api.js';
import { initAuthHandlers } from './auth.js';
import { loadClassrooms, initClassroomView, setupAdminPanel } from './ui.js';
import { loadReservations } from './reservation.js';

// Таймер неактивности (15 минут) -> автовыход и обновление страницы
let inactivityTimer;
const INACTIVITY_LIMIT = 15 * 60 * 1000; 

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
        alert('Istuntosi on vanhentunut 15 minuutin käyttämättömyyden vuoksi.');
        try {
            await api.logout();
        } catch (e) {
            console.error(e);
        }
        window.location.href = '/login.html';
    }, INACTIVITY_LIMIT);
}

// Отслеживание активности пользователя для сброса таймера
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
});

document.addEventListener('DOMContentLoaded', async () => {
    resetInactivityTimer();

    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || path === '/';

    try {
        // Проверяем текущего пользователя через API сессии
        const userRes = await api.getCurrentUser();
        
        if (userRes.ok) {
            const user = await userRes.json();

            if (isLoginPage) {
                // Если уже авторизован, а находимся на логине -> кидаем на index.html
                window.location.href = '/index.html';
                return;
            }

            // Заполняем имя пользователя в шапке
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = `${user.nimi || user.email} (${user.rooli || 'student'})`;
            }

            // Настройка кнопки выключения сессии (Logout)
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await api.logout();
                    window.location.href = '/login.html';
                });
            }

            // Роутинг логики по страницам
            if (path.includes('index.html') || path === '/') {
                await loadClassrooms();
                initClassroomView();
                
                const isAdmin = user.rooli === 'admin' || user.rooli === 'ylläpitäjä';
                const adminSection = document.getElementById('adminSection');
                if (adminSection && isAdmin) {
                    adminSection.style.display = 'block';
                    setupAdminPanel();
                }
            } else if (path.includes('reservations.html')) {
                await loadReservations(user);
            }

        } else {
            // Если сессии нет (не авторизован)
            if (!isLoginPage) {
                // Защищенные страницы отправляют на логин
                window.location.href = '/login.html';
                return;
            } else {
                // Находимся на странице входа — инициализируем формы
                initAuthHandlers();
            }
        }
    } catch (error) {
        console.error('Virhe sovelluksen alustuksessa:', error);
        if (!isLoginPage) {
            window.location.href = '/login.html';
        } else {
            initAuthHandlers();
        }
    }
});