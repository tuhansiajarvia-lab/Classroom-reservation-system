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
export async function loadClassrooms() {
    const gridContainer = document.getElementById('classroomsGrid');
    if (!gridContainer) return;

    try {
        // Запрос к вашему API для получения списка классов
        const response = await api.getClassrooms();
        
        if (response.ok) {
            const classrooms = await response.json();
            
            // Очищаем контейнер перед заполнением
            gridContainer.innerHTML = '';

            if (!classrooms || classrooms.length === 0) {
                gridContainer.innerHTML = '<p style="color: #666; grid-column: 1 / -1;">Ei luokkahuoneita saatavilla.</p>';
                return;
            }

            // Создаем карточку для каждого класса
            classrooms.forEach(room => {
                const card = document.createElement('div');
                card.className = 'classroom-card';
                
                card.innerHTML = `
                    <h3>${room.nimi || room.name}</h3>
                    <p class="classroom-meta">Kapasiteetti: ${room.kapasiteetti || room.capacity || 'N/A'}</p>
                    <p class="classroom-meta">Kapasiteetti: ${room.koko} hlö</p>
                    <p class="classroom-details">Rivit: ${room.rivit} | Paikat rivillä: ${room.paikat}</p>
                `;

                // При клике на карточку можно добавить открытие модального окна бронирования
                card.addEventListener('click', () => {
                    // Если у вас реализована функция открытия модального окна для выбранного класса:
                    if (typeof window.openClassroomModal === 'function') {
                        window.openClassroomModal(room);
                    }
                });

                gridContainer.appendChild(card);
            });
        } else {
            console.error('Virhe haettaessa luokkeja palvelimelta');
        }
    } catch (error) {
        console.error('Virhe luokkien latauksessa:', error);
    }
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