import { checkAuth, handleLogin, handleRegister, handleLogout, getCurrentUser } from './auth.js';
import { loadClassrooms, loadSeats, handleAddClassroom, getSelectedSeatId } from './classroom.js';
import { handleReservationAction, loadReservations } from './reservation.js';
import { updateAuthUI } from './ui.js';

/**
 * Инициализация приложения при загрузке страницы
 */
async function init() {
    // 1. Слушатели изменения класса или даты для перезагрузки мест
    const classroomSelect = document.getElementById('classroomSelect');
    const bookingDate = document.getElementById('bookingDate');

    if (classroomSelect) {
        classroomSelect.addEventListener('change', () => loadSeats(Boolean(getCurrentUser())));
    }
    if (bookingDate) {
        bookingDate.addEventListener('change', () => loadSeats(Boolean(getCurrentUser())));
    }

    // 2. Кнопки авторизации и действий
    const reserveBtn = document.getElementById('reserveBtn');
    if (reserveBtn) {
        reserveBtn.addEventListener('click', async () => {
            const user = getCurrentUser();
            if (!user) return;
            
            const result = await handleReservationAction(getSelectedSeatId(), 'bookingDate');
            if (result.success) {
                await loadSeats(Boolean(getCurrentUser()));
                await loadReservations(user);
            }
        });
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail')?.value || '';
            const password = document.getElementById('loginPassword')?.value || '';
            
            const result = await handleLogin(email, password, 'loginError');
            if (result.success) {
                document.getElementById('loginPassword').value = '';
                document.getElementById('loginEmail').value = '';
                
                const user = getCurrentUser();
                updateAuthUI(user);
                await loadReservations(user);
                await loadSeats(Boolean(user));
            }
        });
    }

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const name = document.getElementById('regName')?.value || '';
            const email = document.getElementById('regEmail')?.value || '';
            const password = document.getElementById('regPassword')?.value || '';
            
            const result = await handleRegister(name, email, password, 'loginError');
            if (result.success) {
                alert('Rekisteröinti onnistui! Voit nyt kirjautua sisään.');
                document.getElementById('showLoginTab')?.click();
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await handleLogout();
            updateAuthUI(null);
            await loadReservations(null);
            await loadSeats(false);
        });
    }

    // 3. Админ-функционал: добавление класса
    const addClassroomBtn = document.getElementById('addClassroomBtn');
    if (addClassroomBtn) {
        addClassroomBtn.addEventListener('click', async () => {
            const user = getCurrentUser();
            const isAdmin = user && (user.rooli === 'admin' || user.rooli === 'ylläpitäjä');
            
            const result = await handleAddClassroom(isAdmin, 'adminClassroomMessage');
            if (result.success) {
                await loadClassrooms();
            }
        });
    }

    // 4. Переключение вкладок входа/регистрации
    const showLoginTab = document.getElementById('showLoginTab');
    const showRegisterTab = document.getElementById('showRegisterTab');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');

    if (showLoginTab && showRegisterTab && loginSection && registerSection) {
        showLoginTab.addEventListener('click', () => {
            loginSection.style.display = 'block';
            registerSection.style.display = 'none';
        });
        showRegisterTab.addEventListener('click', () => {
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
        });
    }

    // 5. Установка сегодняшней даты по умолчанию
    const today = new Date();
    const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    if (bookingDate && !bookingDate.value) {
        bookingDate.value = localDate;
    }

    // 6. Первичная загрузка данных с сервера
    const user = await checkAuth(updateAuthUI);
    await loadClassrooms();
    await loadReservations(user);
}

// Запуск инициализации
init();