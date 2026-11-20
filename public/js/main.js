import { api } from './api.js';
import { initAuthHandlers } from './auth.js';
import { loadClassrooms, initClassroomView, setupAdminPanel, updateAuthUI } from './ui.js';
import { loadReservations } from './reservation.js';

// Таймер неактивности (15 минут) -> автовыход и обновление страницы
let inactivityTimer;
const INACTIVITY_LIMIT = 15 * 60 * 1000;

let selectedClassroom = null;
let selectedReservation = null;

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

function renderClassroomDiagram(room) {
    const diagramEl = document.getElementById('classroomDiagram');
    if (!diagramEl) return;

    const rows = Number(room.rivit || room.rows || 4);
    const seatsPerRow = Number(room.paikat || room.seats_per_row || 5);
    const hasProjector = room.projektori ?? room.has_projector ?? true;
    const hasSmartboard = room.interaktiivinen_taulu ?? room.has_smartboard ?? true;

    let rowsHtml = '';
    for (let r = 1; r <= rows; r++) {
        let cellsHtml = '';
        for (let s = 1; s <= seatsPerRow; s++) {
            cellsHtml += `<span class="diagram-desk" aria-hidden="true"></span>`;
        }
        rowsHtml += `<div class="diagram-row">${cellsHtml}</div>`;
    }

    diagramEl.innerHTML = `
        <div class="diagram-room-box">
            <div class="diagram-front-bar">
                <span class="diagram-board">${hasSmartboard ? 'Interaktiivinen taulu' : 'Valkotaulu'}</span>
                <span class="diagram-projector">${hasProjector ? 'Projektori' : 'Ei projektoria'}</span>
            </div>
            <div class="diagram-teacher-zone">Opettajan alue</div>
            <div class="diagram-rows-wrap">${rowsHtml}</div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    resetInactivityTimer();

    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || path === '/';

    // Если мы на странице логина, инициализируем формы сразу, не дожидаясь ответа checkAuth
    if (isLoginPage) {
        initAuthHandlers();
    }

    try {
        // Проверяем текущего пользователя через API сессии
        const userRes = await api.checkAuth();

        if (userRes.ok) {
            const user = await userRes.json();

            if (isLoginPage) {
                // Если уже авторизован, а находимся на логине -> кидаем на index.html
                window.location.href = '/index.html';
                return;
            }

            updateAuthUI(user);

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

                const seatModal = document.getElementById('seatModal');
                const closeModalBtn = document.getElementById('closeModalBtn');
                const bookingDateInput = document.getElementById('bookingDate');
                const reserveBtn = document.getElementById('reserveBtn');

                // Создаём кнопку удаления брони внутри модального окна, если её ещё нет в HTML
                let deleteBtn = document.getElementById('deleteReservationBtn');
                if (!deleteBtn && reserveBtn?.parentElement) {
                    deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.id = 'deleteReservationBtn';
                    deleteBtn.className = 'danger-btn';
                    deleteBtn.textContent = 'Poista varaus';
                    deleteBtn.style.display = 'none';
                    reserveBtn.parentElement.appendChild(deleteBtn);
                }

                function updateModalButtons() {
                    const isReserved = Boolean(selectedReservation);
                    if (reserveBtn) {
                        reserveBtn.style.display = isReserved ? 'none' : 'inline-block';
                    }
                    if (deleteBtn) {
                        deleteBtn.style.display = isReserved ? 'inline-block' : 'none';
                    }
                }

                if (closeModalBtn && seatModal) {
                    closeModalBtn.addEventListener('click', () => {
                        seatModal.style.display = 'none';
                        selectedClassroom = null;
                        selectedReservation = null;
                    });
                }

                window.openClassroomModal = (room, activeBooking = null) => {
                    selectedClassroom = room;
                    selectedReservation = activeBooking;

                    const modalTitle = document.getElementById('modalClassroomTitle');
                    const seatsCountEl = document.getElementById('modalSeatsCount');
                    const projectorEl = document.getElementById('modalProjectorStatus');
                    const smartboardEl = document.getElementById('modalSmartboardStatus');
                    const dateTextEl = document.getElementById('modalBookingDate');

                    if (bookingDateInput && !bookingDateInput.value) {
                        bookingDateInput.valueAsDate = new Date();
                    }

                    const rows = Number(room.rivit || room.rows || 4);
                    const seatsPerRow = Number(room.paikat || room.seats_per_row || 5);
                    const totalSeats = room.koko ?? room.kapasiteetti ?? (rows * seatsPerRow);
                    const hasProjector = room.projektori ?? room.has_projector ?? true;
                    const hasSmartboard = room.interaktiivinen_taulu ?? room.has_smartboard ?? true;

                    if (modalTitle) {
                        modalTitle.textContent = room.nimi || room.name || 'Luokka';
                    }
                    if (seatsCountEl) {
                        seatsCountEl.textContent = `${totalSeats} hlö (${rows} × ${seatsPerRow})`;
                    }
                    if (projectorEl) {
                        projectorEl.textContent = hasProjector ? 'Kyllä' : 'Ei';
                    }
                    if (smartboardEl) {
                        smartboardEl.textContent = hasSmartboard ? 'Kyllä' : 'Ei';
                    }
                    if (dateTextEl) {
                        dateTextEl.textContent = bookingDateInput?.value || '-';
                    }

                    updateModalButtons();
                    renderClassroomDiagram(room);

                    if (seatModal) {
                        seatModal.style.display = 'flex';
                    }
                };

                if (bookingDateInput) {
                    bookingDateInput.addEventListener('change', () => {
                        const dateTextEl = document.getElementById('modalBookingDate');
                        if (dateTextEl) {
                            dateTextEl.textContent = bookingDateInput.value || '-';
                        }
                        if (seatModal && seatModal.style.display === 'flex') {
                            selectedReservation = null;
                            updateModalButtons();
                        }
                    });
                }

                if (reserveBtn) {
                    reserveBtn.addEventListener('click', async () => {
                        if (!selectedClassroom) {
                            alert('Valitse ensin luokka!');
                            return;
                        }

                        const date = document.getElementById('bookingDate')?.value;
                        if (!date) {
                            alert('Valitse päivämäärä!');
                            return;
                        }

                        const classroomId = selectedClassroom.luokka_id || selectedClassroom.id;

                        try {
                            const response = await api.createReservation({
                                classroomId,
                                luokka_id: classroomId,
                                date
                            });

                            if (response.ok) {
                                alert('Luokka varattu onnistuneesti!');
                                if (seatModal) seatModal.style.display = 'none';
                                selectedClassroom = null;
                                selectedReservation = null;
                                await loadClassrooms();
                            } else {
                                const data = await response.json().catch(() => ({}));
                                alert(data.message || 'Luokan varaaminen epäonnistui.');
                            }
                        } catch (error) {
                            console.error('Virhe luokkaa varattaessa:', error);
                            alert('Verkkovirhe.');
                        }
                    });
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async () => {
                        const reservationId = selectedReservation?.varaus_id ?? selectedReservation?.id;
                        if (!reservationId) return;

                        if (!confirm('Haluatko varmasti poistaa tämän varauksen?')) return;

                        try {
                            const response = await api.deleteReservation(reservationId);
                            if (response.ok) {
                                alert('Varaus poistettu.');
                                if (seatModal) seatModal.style.display = 'none';
                                selectedClassroom = null;
                                selectedReservation = null;
                                await loadClassrooms();
                            } else {
                                const data = await response.json().catch(() => ({}));
                                alert(data.message || 'Varauksen poistaminen epäonnistui.');
                            }
                        } catch (error) {
                            console.error('Virhe varausta poistettaessa:', error);
                            alert('Verkkovirhe.');
                        }
                    });
                }

                const isAdmin = user.rooli === 'admin' || user.rooli === 'ylläpitäjä';
                const adminSection = document.getElementById('adminSection');
                if (adminSection && isAdmin) {
                    adminSection.style.display = 'block';
                    setupAdminPanel(isAdmin);
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
            }
        }
    } catch (error) {
        console.error('Virhe sovelluksen alustuksessa:', error);
        if (!isLoginPage) {
            window.location.href = '/login.html';
        }
    }
});