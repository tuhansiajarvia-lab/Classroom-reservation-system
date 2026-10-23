import { api } from './api.js';

/**
 * Обновляет видимость элементов интерфейса (например, имя пользователя или админ-панель)
 */
export function updateAuthUI(currentUser) {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const adminSection = document.getElementById('adminSection');

    if (currentUser && userNameDisplay) {
        userNameDisplay.textContent = `${currentUser.nimi || currentUser.email} (${currentUser.rooli || 'student'})`;
    }

    // Показываем админ-панель, если у пользователя роль администратора
    if (currentUser && adminSection) {
        const isAdmin = currentUser.rooli === 'admin' || currentUser.rooli === 'ylläpitäjä';
        adminSection.style.display = isAdmin ? 'block' : 'none';
    }
}

/**
 * Загружает и отображает список аудиторий
 */
export function loadClassrooms() {
    // Ваша логика загрузки классов (если она уже реализована, оставьте её здесь)
    console.loadClassrooms?.();
}

/**
 * Инициализация интерфейса на главной странице (index.html)
 */
export function initClassroomView() {
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate && !bookingDate.value) {
        bookingDate.valueAsDate = new Date();
        bookingDate.addEventListener('change', () => {
            loadClassrooms();
        });
    }

    // Закрытие модального окна мест
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
}

/**
 * Настройка панели администратора для добавления новых классов
 */
export function setupAdminPanel() {
    const addClassroomBtn = document.getElementById('addClassroomBtn');
    if (addClassroomBtn) {
        addClassroomBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('newClassroomName');
            const capacityInput = document.getElementById('newClassroomCapacity');
            const messageEl = document.getElementById('adminClassroomMessage');

            const nimi = nameInput ? nameInput.value.trim() : '';
            const kapasiteetti = capacityInput ? parseInt(capacityInput.value) : 0;

            if (!nimi || !kapasiteetti) {
                if (messageEl) messageEl.textContent = 'Täytä kaikki kentät!';
                return;
            }

            try {
                const res = await api.addClassroom({ nimi, kapasiteetti });
                if (res.ok) {
                    if (messageEl) messageEl.textContent = 'Luokka lisätty onnistuneesti!';
                    if (nameInput) nameInput.value = '';
                    if (capacityInput) capacityInput.value = '';
                    loadClassrooms();
                } else {
                    const data = await res.json();
                    if (messageEl) messageEl.textContent = data.message || 'Virhe luokan lisäämisessä';
                }
            } catch (e) {
                if (messageEl) messageEl.textContent = `Yhteysvirhe palvelimeen ${e}`;
            }
        });
    }
}