import { api } from './api.js';
import { handleAddClassroom } from './classroom.js';

let currentAuthUser = null;

const ROOM_IMAGES = {
    // Привязка по точному названию комнаты в нижнем регистре (приоритетная):
    // 'alfa': '/images/25hlo.png',
};

const DEFAULT_CLASSROOM_IMAGES = [
    '/images/20hlo.png',
    '/images/25hlo.png',
    '/images/36hlo.png',
    '/images/70hlo.png'
];

const DEFAULT_CONFERENCE_IMAGES = [
    '/images/kokous8.png',
    '/images/kokous16.png',
    '/images/kokous30.png'
];

function getRoomCapacityNumber(room) {
    const direct = Number(room?.koko ?? room?.kapasiteetti ?? room?.capacity ?? 0);
    if (direct > 0) return direct;

    const rows = Number(room?.rivit ?? room?.rows ?? 0);
    const seats = Number(room?.paikat ?? room?.seats ?? 0);
    if (rows > 0 && seats > 0) return rows * seats;

    return 0;
}

function getRoomImage(room, index = 0) {
    const rawName = String(room?.nimi || room?.name || '').trim().toLowerCase();
    if (rawName && ROOM_IMAGES[rawName]) {
        return ROOM_IMAGES[rawName];
    }

    const roomType = String(room?.tyyppi || room?.type || '').trim().toLowerCase();
    const isConference =
        roomType.includes('konfer') ||
        roomType.includes('conf') ||
        roomType.includes('kokous') ||
        rawName.includes('konfer') ||
        rawName.includes('kokous') ||
        rawName.includes('vip');

    const capacity = getRoomCapacityNumber(room);

    if (isConference) {
        if (capacity > 0 && capacity <= 10) return '/images/kokous8.png';
        if (capacity > 0 && capacity <= 22) return '/images/kokous16.png';
        if (capacity > 22) return '/images/kokous30.png';
        return DEFAULT_CONFERENCE_IMAGES[index % DEFAULT_CONFERENCE_IMAGES.length];
    }

    if (capacity > 0 && capacity <= 22) return '/images/20hlo.png';
    if (capacity > 0 && capacity <= 30) return '/images/25hlo.png';
    if (capacity > 0 && capacity <= 50) return '/images/36hlo.png';
    if (capacity > 50) return '/images/70hlo.png';

    return DEFAULT_CLASSROOM_IMAGES[index % DEFAULT_CLASSROOM_IMAGES.length];
}

function getUserRole(user) {
    const actualUser = user?.user || user;
    return String(actualUser?.rooli || actualUser?.role || '').toLowerCase();
}

export function isAdminUser(user) {
    return ['admin', 'ylläpitäjä', 'yllapitaja'].includes(getUserRole(user));
}

export function canViewAllReservations(user) {
    return ['admin', 'ylläpitäjä', 'yllapitaja', 'opettaja', 'teacher'].includes(getUserRole(user));
}

function toDateKey(value) {
    if (!value) return '';
    return String(value).slice(0, 10);
}

/**
 * Обновляет видимость элементов интерфейса (имя пользователя, админ-панель, кнопки удаления классов)
 */
export function updateAuthUI(currentUser) {
    currentAuthUser = currentUser || null;

    const userNameDisplay = document.getElementById('userNameDisplay');
    const adminSection = document.getElementById('adminSection');
    const isAdmin = isAdminUser(currentUser);

    if (currentUser && userNameDisplay) {
        userNameDisplay.textContent = `${currentUser.nimi || currentUser.email} (${currentUser.rooli || 'student'})`;
    }

    // Управление классами доступно только администратору
    if (adminSection) {
        adminSection.style.display = isAdmin ? 'block' : 'none';
    }

    document.querySelectorAll('.delete-classroom-btn').forEach(btn => {
        btn.style.display = isAdmin ? 'inline-flex' : 'none';
    });
}

/**
 * Загружает и отображает список аудиторий
 */
export async function loadClassrooms() {
    const gridContainer = document.getElementById('classroomsGrid');
    if (!gridContainer) return;

    const bookingDateInput = document.getElementById('bookingDate');
    const selectedDate = bookingDateInput?.value || new Date().toISOString().slice(0, 10);
    const showBookings = canViewAllReservations(currentAuthUser);
    const isAdmin = isAdminUser(currentAuthUser);

    try {
        const availabilityPromise = showBookings
            ? (typeof api.getAvailability === 'function'
                ? api.getAvailability(selectedDate).catch(() => null)
                : api.getStudentReservations().catch(() => null))
            : Promise.resolve(null);

        const [roomsRes, availabilityRes] = await Promise.all([
            api.getClassrooms(),
            availabilityPromise
        ]);

        if (!roomsRes.ok) {
            console.error('Virhe haettaessa luokkeja palvelimelta');
            return;
        }

        const classrooms = await roomsRes.json();
        let activeReservations = [];

        if (showBookings && availabilityRes && availabilityRes.ok) {
            const allRes = await availabilityRes.json();
            activeReservations = Array.isArray(allRes)
                ? allRes.filter(r =>
                    (!r.status || r.status === 'active') &&
                    toDateKey(r.ajankohta || r.paivamaara) === selectedDate
                )
                : [];
        }

        gridContainer.innerHTML = '';

        if (!classrooms || classrooms.length === 0) {
            gridContainer.innerHTML = '<p style="color: #666; grid-column: 1 / -1;">Ei luokkahuoneita saatavilla.</p>';
            return;
        }

        classrooms.forEach((room, index) => {
            const roomId = room.luokka_id ?? room.id;
            const roomName = room.nimi || room.name || `Luokka ${index + 1}`;
            const roomImage = getRoomImage(room, index);

            const activeBooking = showBookings
                ? activeReservations.find(r => Number(r.luokka_id ?? r.classroomId) === Number(roomId))
                : null;
            const isReserved = Boolean(activeBooking);

            // Учителя и админы видят Varattu / Vapaa; ученики не видят чужие брони
            const statusBadgeHtml = showBookings
                ? (isReserved
                    ? '<span class="badge-varattu">Varattu</span>'
                    : '<span class="badge-vapaa">Vapaa</span>')
                : '';

            const deleteClassroomHtml = isAdmin
                ? `
                    <button
                        type="button"
                        class="delete-classroom-btn"
                        data-room-id="${roomId}"
                        title="Poista luokka"
                        aria-label="Poista luokka"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                    </button>
                `
                : '';

            const card = document.createElement('div');
            card.className = `classroom-card${showBookings ? (isReserved ? ' is-reserved' : ' is-free') : ''}`;

            const rowsCount = Number(room.rivit ?? room.rows ?? 0);
            const seatsPerRow = Number(room.paikat ?? room.seats ?? 0);
            const computedCapacity = rowsCount > 0 && seatsPerRow > 0 ? rowsCount * seatsPerRow : null;
            const capacityValue = room.koko ?? room.kapasiteetti ?? room.capacity ?? computedCapacity ?? 'N/A';

           card.innerHTML = `
                <img
                    src="${roomImage}"
                    alt="${roomName}"
                    class="classroom-img"
                    loading="lazy"
                    onerror="if (!this.dataset.fallback) { this.dataset.fallback = '1'; this.src='/images/20hlo.png'; }"
                >
                <div class="classroom-card-body">
                    <div class="classroom-card-header">
                        <h3>${roomName}</h3>
                        ${statusBadgeHtml}
                    </div>
                    <p class="classroom-meta">Kapasiteetti: ${capacityValue} hlo</p>
                    <p class="classroom-details">Rivit: ${rowsCount || 'N/A'} | Paikat rivillä: ${seatsPerRow || 'N/A'}</p>
                    ${deleteClassroomHtml}
                </div>
            `;

            const deleteBtn = card.querySelector('.delete-classroom-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm('Haluatko varmasti poistaa tämän luokkahuoneen?')) return;
                    try {
                        const delRes = await api.deleteClassroom(roomId);
                        if (delRes.ok) {
                            await loadClassrooms();
                        } else {
                            const errData = await delRes.json().catch(() => ({}));
                            alert(errData.message || 'Luokkahuoneen poistaminen epäonnistui.');
                        }
                    } catch (err) {
                        console.error('Virhe luokkahuoneen poistossa:', err);
                        alert('Verkkovirhe.');
                    }
                });
            }

            card.addEventListener('click', () => {
                if (typeof window.openClassroomModal === 'function') {
                    window.openClassroomModal(room, activeBooking || null);
                }
            });

            gridContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Virhe luokkien latauksessa:', error);
    }
}

/**
 * Инициализация интерфейса на главной странице (index.html)
 */
export function initClassroomView() {
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        if (!bookingDate.value) {
            bookingDate.valueAsDate = new Date();
        }
        bookingDate.addEventListener('change', () => {
            loadClassrooms();
        });
    }

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