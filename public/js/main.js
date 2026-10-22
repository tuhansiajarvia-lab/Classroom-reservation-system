import { checkAuth, handleLogin, handleRegister, handleLogout, getCurrentUser } from './auth.js';
import { loadClassrooms, loadSeats, handleAddClassroom, getSelectedSeatId } from './classroom.js';
import { handleReservationAction, loadReservations } from './reservation.js';
import { updateAuthUI } from './ui.js';

/**
 * Автоматический выход из системы при неактивности (15 минут)
 */
function initInactivityTimer() {
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 минут в миллисекундах
    let inactivityTimer;

    async function logoutDueToInactivity() {
        const user = getCurrentUser();
        if (!user) return;

        console.log('Сессия истекла из-за неактивности.');
        await handleLogout();
        updateAuthUI(null);
        
        alert('Istuntosi on vanhentunut epäaktiivisuuden vuoksi. Kirjaudu uudelleen sisään.');
        window.location.reload();
    }

    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutDueToInactivity, INACTIVITY_LIMIT);
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    events.forEach(event => {
        window.addEventListener(event, resetTimer, true);
    });

    resetTimer();
}

/**
 * Инициализация приложения при загрузке страницы
 */
async function init() {
    // 1. Навигация по вкладкам приложения (Табы)
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // 2. Управление модальным окном выбора мест
    const seatModal = document.getElementById('seatModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (closeModalBtn && seatModal) {
        closeModalBtn.addEventListener('click', () => {
            seatModal.style.display = 'none';
        });
        window.addEventListener('click', (e) => {
            if (e.target === seatModal) {
                seatModal.style.display = 'none';
            }
        });
    }

    // 3. Слушатели изменения даты для перезагрузки мест
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.addEventListener('change', () => loadSeats(Boolean(getCurrentUser())));
    }

    // 4. Кнопки авторизации, регистрации и выхода
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
                await loadClassroomsCards(user);
                initInactivityTimer(); // Запуск таймера при входе
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
        });
    }

    // 5. Кнопка совершения бронирования внутри модального окна
    const reserveBtn = document.getElementById('reserveBtn');
    if (reserveBtn) {
        reserveBtn.addEventListener('click', async () => {
            const user = getCurrentUser();
            if (!user) return;
            
            const result = await handleReservationAction(getSelectedSeatId(), 'bookingDate');
            if (result.success) {
                if (seatModal) seatModal.style.display = 'none';
                await loadSeats(Boolean(user));
                await loadReservations(user);
            }
        });
    }

    // 6. Админ-функционал: добавление класса
    const addClassroomBtn = document.getElementById('addClassroomBtn');
    if (addClassroomBtn) {
        addClassroomBtn.addEventListener('click', async () => {
            const user = getCurrentUser();
            const isAdmin = user && (user.rooli === 'admin' || user.rooli === 'ylläpitäjä');
            
            const result = await handleAddClassroom(isAdmin, 'adminClassroomMessage');
            if (result.success) {
                await loadClassroomsCards(user);
            }
        });
    }

    // 7. Переключение вкладок и кнопок входа/регистрации
    const showLoginTab = document.getElementById('showLoginTab');
    const showRegisterTab = document.getElementById('showRegisterTab');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const switchToRegBtn = document.getElementById('switchToRegBtn');
    const switchToLoginBtn = document.getElementById('switchToLoginBtn');

    if (showLoginTab && showRegisterTab && loginSection && registerSection) {
        const activateLogin = () => {
            showLoginTab.classList.add('active');
            showRegisterTab.classList.remove('active');
            loginSection.style.display = 'block';
            registerSection.style.display = 'none';
        };

        const activateRegister = () => {
            showRegisterTab.classList.add('active');
            showLoginTab.classList.remove('active');
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
        };

        showLoginTab.addEventListener('click', activateLogin);
        showRegisterTab.addEventListener('click', activateRegister);
        if (switchToRegBtn) switchToRegBtn.addEventListener('click', activateRegister);
        if (switchToLoginBtn) switchToLoginBtn.addEventListener('click', activateLogin);
    }

    // 8. Установка сегодняшней даты по умолчанию
    const today = new Date();
    const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    if (bookingDate && !bookingDate.value) {
        bookingDate.value = localDate;
    }

    // 9. Первичная проверка авторизации и загрузка данных
    const user = await checkAuth(updateAuthUI);
    await loadClassroomsCards(user);
    if (user) {
        await loadReservations(user);
        initInactivityTimer(); // Запуск таймера, если сессия уже активна при перезагрузке
    }
}

/**
 * Рендерит список классов в виде карточек
 */
async function loadClassroomsCards(user) {
    await loadClassrooms();

    const grid = document.getElementById('classroomsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const classroomSelect = document.getElementById('classroomSelect');
    if (!classroomSelect) return;

    Array.from(classroomSelect.options).forEach(option => {
        if (!option.value) return;

        const card = document.createElement('div');
        card.className = 'classroom-card';

        const name = option.textContent;
        let equipment = 'Projektori, Valkokangas';
        if (name.toLowerCase().includes('konferens') || name.toLowerCase().includes('sali')) {
            equipment = 'Interaktiivinen kosketustaulu, Äänentoisto, Istumapaikat 15';
        } else if (name.toLowerCase().includes('50') || name.toLowerCase().includes('60')) {
            equipment = 'Interaktiivinen taulu, Dokumenttikamera';
        }

        card.innerHTML = `
            <h3>🏫 ${name}</h3>
            <div class="classroom-meta">
                <p><strong>Varusteet:</strong> ${equipment}</p>
            </div>
            <button class="primary-btn" style="padding: 8px; font-size: 0.9rem;">Valitse paikat</button>
        `;

        card.addEventListener('click', () => {
            classroomSelect.value = option.value;
            loadSeats(Boolean(user));   

            const modal = document.getElementById('seatModal');
            const modalTitle = document.getElementById('modalClassroomTitle');
            if (modalTitle) modalTitle.textContent = `Paikkakartta: ${name}`;
            if (modal) modal.style.display = 'flex';
        });

        grid.appendChild(card);
    });
}

// Запуск инициализации приложения
init();