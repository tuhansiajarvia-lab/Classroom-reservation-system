import { api } from './api.js';

// Объект состояния пользователя (доступен внутри модуля)
let currentUser = null;

/**
 * Получить текущего пользователя
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Проверка авторизации при загрузке страницы
 */
export async function checkAuth(updateAuthUIcallback) {
    try {
        const res = await api.checkAuth();
        if (res.ok) {
            currentUser = await res.json();
        } else {
            currentUser = null;
        }
    } catch (err) {
        currentUser = null;
    }
    
    // Вызываем колбэк обновления интерфейса, если он передан
    if (typeof updateAuthUIcallback === 'function') {
        updateAuthUIcallback(currentUser);
    }
    return currentUser;
}

/**
 * Обработка входа в систему
 */
export async function handleLogin(email, password, errorElementId) {
    const errorEl = document.getElementById(errorElementId);
    if (errorEl) errorEl.textContent = '';

    try {
        const res = await api.login({ sahkoposti: email, salasana: password });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            return { success: true, user: currentUser };
        } else {
            const errData = await res.json();
            if (errorEl) errorEl.textContent = errData.message || 'Kirjautuminen epäonnistui';
            return { success: false };
        }
    } catch (err) {
        if (errorEl) errorEl.textContent = 'Verkkovirhe kirjautumisessa';
        return { success: false };
    }
}

/**
 * Обработка регистрации
 */
export async function handleRegister(name, email, password, errorElementId) {
    const errorEl = document.getElementById(errorElementId);
    if (errorEl) errorEl.textContent = '';

    try {
        const res = await api.register({ nimi: name, sahkoposti: email, salasana: password });

        if (res.ok) {
            return { success: true };
        } else {
            const errData = await res.json();
            if (errorEl) errorEl.textContent = errData.message || 'Rekisteröinti epäonnistui';
            return { success: false };
        }
    } catch (err) {
        console.error(err);
        if (errorEl) errorEl.textContent = err.message || 'Verkkovirhe rekisteröinnissä';
        return { success: false };
    }
}

/**
 * Выход из системы
 */
export async function handleLogout() {
    try {
        await api.logout();
    } catch (e) {
        console.error("Virhe uloskirjautumisessa", e);
    }

    currentUser = null;
    return currentUser;
}