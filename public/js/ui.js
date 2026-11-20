import { api } from './api.js';
import { handleAddClassroom } from './classroom.js';

let currentAuthUser = null;

function isAdminUser(user) {
    const actualUser = user?.user || user;
    const role = String(actualUser?.rooli || actualUser?.role || '').toLowerCase();
    return role === 'admin' || role === 'ylläpitäjä';
}

/**
 * Обновляет видимость элементов интерфейса (например, имя пользователя или админ-панель)
 */
export function updateAuthUI(currentUser) {
    currentAuthUser = currentUser || null;

    const userNameDisplay = document.getElementById('userNameDisplay');
    const adminSection = document.getElementById('adminSection');

    if (currentUser && userNameDisplay) {
        userNameDisplay.textContent = `${currentUser.nimi || currentUser.email} (${currentUser.rooli || 'student'})`;
    }

    // Показываем админ-панель, если у пользователя роль администратора
    if (adminSection) {
        const isAdmin = isAdminUser(currentUser);
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

                const rowsCount = Number(room.rivit ?? room.rows ?? 0);
                const seatsPerRow = Number(room.paikat ?? room.seats ?? 0);
                const computedCapacity = rowsCount > 0 && seatsPerRow > 0 ? rowsCount * seatsPerRow : null;
                const capacityValue = room.koko ?? room.kapasiteetti ?? room.capacity ?? computedCapacity ?? 'N/A';

                card.innerHTML = `
                    <h3>${room.nimi || room.name}</h3>
                    <p class="classroom-meta">Kapasiteetti: ${capacityValue} hlö</p>
                    <p class="classroom-details">Rivit: ${rowsCount || 'N/A'} | Paikat rivillä: ${seatsPerRow || 'N/A'}</p>
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
export function setupAdminPanel(isUserAdmin) {
    const addClassroomBtn = document.getElementById('addClassroomBtn');
    if (addClassroomBtn) {
        addClassroomBtn.addEventListener('click', async () => {
            const canAddClassroom =
                typeof isUserAdmin === 'boolean' ? isUserAdmin : isAdminUser(currentAuthUser);

            const result = await handleAddClassroom(canAddClassroom, 'adminClassroomMessage');
            if (result && result.success) {
                await loadClassrooms();
            }
        });
    }
}