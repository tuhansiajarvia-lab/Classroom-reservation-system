import { api } from './api.js';

/**
 * Загружает список личных бронирований текущего пользователя
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
            
            if (reservations.length === 0) {
                container.innerHTML = '<tr><td colspan="4">Sinulla ei ole aktiivisia varauksia.</td></tr>';
                return;
            }

            container.innerHTML = reservations.map(r => `
                <tr>
                    <td><strong>${r.luokan_nimi || 'Luokka'}</strong></td>
                    <td>Paikka ${r.paikan_numero || r.paikka_id}</td>
                    <td>${r.paivamaara ? r.paivamaara.split('T')[0] : ''}</td>
                    <td>
                        <button class="danger-btn" onclick="window.cancelReservation(${r.id})">Peruuta</button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = '<tr><td colspan="4">Varauksia ei voitu ladata.</td></tr>';
        }
    } catch (error) {
        console.error('Virhe varausten latauksessa:', error);
        container.innerHTML = '<tr><td colspan="4">Palvelinvirhe.</td></tr>';
    }

    // После загрузки личных броней также обновляем общую таблицу статусов
    loadClassroomStatuses();
}

/**
 * Рендерит список всех классов с требуемой вместимостью и их текущими статусами
 */
export async function loadClassroomStatuses() {
    const tbody = document.getElementById('classroomStatusList');
    if (!tbody) return;

    // Конфигурация аудиторий согласно вашему требованию
    const classrooms = [
        { name: 'Luokka 101', type: 'Luokka (20 hlöä)', status: 'free' },
        { name: 'Luokka 102', type: 'Luokka (30 hlöä)', status: 'booked' },
        { name: 'Luokka 201', type: 'Luokka (40 hlöä)', status: 'free' },
        { name: 'Luokka 301', type: 'Luokka (50 hlöä)', status: 'free' },
        { name: 'Luokka 401', type: 'Luokka (60 hlöä)', status: 'booked' },
        { name: 'Konferenssisali A', type: 'Konferenssisali (15 hlöä)', status: 'free' },
        { name: 'Konferenssisali B', type: 'Konferenssisali (15 hlöä)', status: 'booked' }
    ];

    tbody.innerHTML = '';

    classrooms.forEach(item => {
        const tr = document.createElement('tr');
        
        const isFree = item.status === 'free';
        const statusText = isFree ? 'Vapaa' : 'Varattu';
        const badgeClass = isFree ? 'free' : 'booked';

        tr.innerHTML = `
            <td><strong>🏫 ${item.name}</strong></td>
            <td>${item.type}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Создает новое бронирование
 */
export async function handleReservationAction(seatId, dateInputId) {
    if (!seatId) {
        alert('Valitse ensin paikka!');
        return { success: false };
    }

    const date = document.getElementById(dateInputId)?.value;
    if (!date) {
        alert('Valitse päivämäärä!');
        return { success: false };
    }

    try {
        const response = await api.createReservation({ seatId, date });
        if (response.ok) {
            alert('Varaus tehty onnistuneesti!');
            return { success: true };
        } else {
            const data = await response.json();
            alert(data.message || 'Varauksen tekeminen epäonnistui.');
            return { success: false };
        }
    } catch (error) {
        console.error('Virhe varausta tehtäessä:', error);
        alert('Verkkovirhe.');
        return { success: false };
    }
}

// Глобальная функция отмены для onclick
window.cancelReservation = async (reservationId) => {
    if (!confirm('Haluatko varmasti peruuttaa tämän varauksen?')) return;

    try {
        const response = await api.deleteReservation(reservationId);
        if (response.ok) {
            alert('Varaus peruutettu.');
            location.reload();
        } else {
            alert('Peruutus epäonnistui.');
        }
    } catch (error) {
        console.error('Virhe peruutettaessa:', error);
    }
};