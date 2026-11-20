import { api } from './api.js';

/**
 * Загружает список личных бронирований классов текущего пользователя
 */
export async function loadReservations(user) {
    const container = document.getElementById('myReservationsList');
    if (!container) return;

    if (!user) {
        container.innerHTML = '<tr><td colspan="4">Kirjaudu sisään nähdäksesi varauksesi.</td></tr>';
        return;
    }

    try {
        const response = await api.getStudentReservations();
        if (response.ok) {
            const reservations = await response.json();

            if (!Array.isArray(reservations) || reservations.length === 0) {
                container.innerHTML = '<tr><td colspan="4">Sinulla ei ole aktiivisia varauksia.</td></tr>';
                return;
            }

            container.innerHTML = reservations.map(r => {
                const reservationId = r.varaus_id ?? r.id;
                const roomName = r.luokka_nimi || r.luokan_nimi || `Luokka #${r.luokka_id}`;
                const rawDate = r.ajankohta || r.paivamaara || '';
                const formattedDate = rawDate ? String(rawDate).split('T')[0].split(' ')[0] : '';

                return `
                    <tr>
                        <td><strong>${roomName}</strong></td>
                        <td><span class="badge-varattu">Varattu</span></td>
                        <td>${formattedDate}</td>
                        <td>
                            <button type="button" class="danger-btn" onclick="window.cancelReservation(${reservationId})">
                                Poista varaus
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            container.innerHTML = '<tr><td colspan="4">Varauksia ei voitu ladata.</td></tr>';
        }
    } catch (error) {
        console.error('Virhe varausten latauksessa:', error);
        container.innerHTML = '<tr><td colspan="4">Palvelinvirhe.</td></tr>';
    }
}

/**
 * Создаёт новое бронирование класса на выбранную дату
 */
export async function handleReservationAction(classroomId, dateInputId) {
    if (!classroomId) {
        alert('Valitse ensin luokka!');
        return { success: false };
    }

    const date = document.getElementById(dateInputId)?.value;
    if (!date) {
        alert('Valitse päivämäärä!');
        return { success: false };
    }

    try {
        const response = await api.createReservation({
            classroomId,
            luokka_id: classroomId,
            date
        });

        if (response.ok) {
            alert('Luokka varattu onnistuneesti!');
            return { success: true };
        } else {
            const data = await response.json().catch(() => ({}));
            alert(data.message || 'Varauksen tekeminen epäonnistui.');
            return { success: false };
        }
    } catch (error) {
        console.error('Virhe varausta tehtäessä:', error);
        alert('Verkkovirhe.');
        return { success: false };
    }
}

// Глобальная функция удаления/отмены брони
window.cancelReservation = async (reservationId) => {
    if (!reservationId) return;
    if (!confirm('Haluatko varmasti poistaa tämän varauksen?')) return;

    try {
        const response = await api.deleteReservation(reservationId);
        if (response.ok) {
            alert('Varaus poistettu.');
            location.reload();
        } else {
            const data = await response.json().catch(() => ({}));
            alert(data.message || 'Varauksen poistaminen epäonnistui.');
        }
    } catch (error) {
        console.error('Virhe peruutettaessa:', error);
        alert('Verkkovirhe.');
    }
};