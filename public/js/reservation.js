import { api } from './api.js';

/**
 * Создание новой брони для выбранного места и даты
 */
export async function handleReservationAction(selectedSeatId, bookingDateElementId) {
    const date = document.getElementById(bookingDateElementId)?.value;

    if (!selectedSeatId) {
        alert('Valitse ensin istumapaikka ruudukosta!');
        return { success: false };
    }
    if (!date) {
        alert('Valitse päivämäärä varaukselle!');
        return { success: false };
    }

    try {
        const res = await api.createReservation({
            paikka_id: selectedSeatId,
            ajankohta: date
        });

        if (res.ok) {
            alert('Varaus tehty onnistuneesti!');
            return { success: true };
        } else {
            const errData = await res.json();
            alert('Varaus epäonnistui: ' + (errData.message || 'Tuntematon virhe'));
            return { success: false };
        }
    } catch (err) {
        alert('Verkkovirhe varauksessa.');
        return { success: false };
    }
}

/**
 * Загрузка и отрисовка списка бронирований в таблице
 */
export async function loadReservations(currentUser) {
    const tableBody = document.getElementById('reservationTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!currentUser) return;

    try {
        const isAdmin = currentUser.rooli === 'admin' || currentUser.rooli === 'ylläpitäjä';
        
        // Выбираем правильный эндпоинт в зависимости от роли
        const res = isAdmin ? await api.getAdminReservations() : await api.getStudentReservations();

        if (!res.ok) return;
        const varaukset = await res.json();

        varaukset.forEach(v => {
            const row = document.createElement('tr');

            let actionsHtml = `
                <td> 
                    <button class="delete-btn" style="background-color: #d9534f; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Poista</button> 
                </td> 
            `;

            const vId = v.varaus_id;
            const userName = v.student_nimi || currentUser?.nimi || 'Käyttäjä';
            const className = v.luokka_nimi || 'Luokka';
            const seatInfo = `Rivi ${v.rivin_numero}, Paikka ${v.paikka_numero}`;
            const formattedDate = v.ajankohta ? v.ajankohta.split('T')[0] : '';

            row.innerHTML = ` 
                <td>${userName}</td> 
                <td>${className}</td> 
                <td>${seatInfo}</td> 
                <td>${formattedDate}</td> 
                ${actionsHtml} 
            `;

            // Привязываем обработчик на кнопку удаления брони
            const deleteBtn = row.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    await deleteReservation(vId, currentUser);
                });
            }

            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Varausten haku epäonnistui", err);
    }
}

/**
 * Удаление (отмена) брони по её ID
 */
async function deleteReservation(varausId, currentUser) {
    if (!currentUser) return;

    if (confirm('Haluatko varmasti peruuttaa tämän varauksen?')) {
        try {
            const res = await api.deleteReservation(varausId);

            if (res.ok) {
                alert('Varaus peruutettu!');
                return { success: true };
            } else {
                const errData = await res.json().catch(() => ({}));
                alert('Poisto epäonnistui: ' + (errData.message || 'Virhe palvelimella'));
                return { success: false };
            }
        } catch (err) {
            alert('Verkkovirhe poistossa.');
            return { success: false };
        }
    }
    return { success: false };
}