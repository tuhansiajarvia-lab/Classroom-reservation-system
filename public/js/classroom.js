import { api } from './api.js';

/**
 * Загрузить список классов в выпадающий список (<select>)
 */
export async function loadClassrooms() {
    try {
        const res = await api.getClassrooms();
        if (res.ok) {
            const classrooms = await res.json();
            const classroomSelect = document.getElementById('classroomSelect');
            if (!classroomSelect) return;

            classroomSelect.innerHTML = '<option value="" disabled selected>-- Valitse luokka --</option>';

            classrooms.forEach(luokka => {
                const option = document.createElement('option');
                option.value = luokka.luokka_id;
                option.textContent = `${luokka.nimi} (Koko: ${luokka.koko})`;
                classroomSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Luokkien haku epäonnistui', err);
    }
}

/**
 * Добавить новый класс (для администратора)
 */
export async function handleAddClassroom(isUserAdmin, messageElementId) {
    const messageEl = document.getElementById(messageElementId);
    if (messageEl) messageEl.textContent = '';

    if (!isUserAdmin) {
        alert('Vain ylläpitäjä voi lisätä luokkahuoneita.');
        return { success: false };
    }

    const nimi = document.getElementById('adminClassroomName')?.value.trim();
    const rivit = Number(document.getElementById('adminClassroomRows')?.value);
    const paikat = Number(document.getElementById('adminClassroomSeats')?.value);

    if (!nimi) {
        if (messageEl) {
            messageEl.textContent = 'Anna luokkahuoneelle nimi.';
            messageEl.style.color = 'red';
        }
        return { success: false };
    }

    if (!Number.isInteger(rivit) || rivit < 1) {
        if (messageEl) {
            messageEl.textContent = 'Rivien määrän pitää olla vähintään 1.';
            messageEl.style.color = 'red';
        }
        return { success: false };
    }

    if (!Number.isInteger(paikat) || paikat < 1) {
        if (messageEl) {
            messageEl.textContent = 'Paikkojen määrän pitää olla vähintään 1.';
            messageEl.style.color = 'red';
        }
        return { success: false };
    }

    try {
        const res = await api.addClassroom({ nimi, rivit, paikat });
        const data = await res.json();

        if (res.ok) {
            if (messageEl) {
                messageEl.textContent = data.message || 'Luokkahuone lisätty onnistuneesti.';
                messageEl.style.color = 'green';
            }

            document.getElementById('adminClassroomName').value = '';
            document.getElementById('adminClassroomRows').value = '';
            document.getElementById('adminClassroomSeats').value = '';

            await loadClassrooms();
            return { success: true };
        } else {
            if (messageEl) {
                messageEl.textContent = data.message || 'Luokkahuoneen lisääminen epäonnistui.';
                messageEl.style.color = 'red';
            }
            return { success: false };
        }
    } catch (err) {
        console.error('Luokkahuoneen lisääminen epäonnistui:', err);
        if (messageEl) {
            messageEl.textContent = 'Verkkovirhe luokkahuoneen lisäämisessä.';
            messageEl.style.color = 'red';
        }
        return { success: false };
    }
}