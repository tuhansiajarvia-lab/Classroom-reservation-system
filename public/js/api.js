// Базовый URL для бэкенда
const API_URL = '/api';
/**
 * Универсальный помощник для отправки запросов с автоматической передачей кук (credentials)
 */
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {}
    };

    // Если передается тело запроса в виде объекта, автоматически конвертируем в JSON
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})  
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
    return response;
}

// Экспортируем готовые функции для работы с API
export const api = {
    // Аутентификация
    checkAuth: () => apiRequest('/auth/me'),
    login: (credentialsData) => apiRequest('/auth/login', { method: 'POST', body: credentialsData }),
    register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),

    // Классы и места
    getClassrooms: () => apiRequest('/classrooms'),
    getSeats: (classId, date) => apiRequest(`/classrooms/${classId}/seats?date=${date}`),
    addClassroom: (classroomData) => apiRequest('/admin/classrooms', { method: 'POST', body: classroomData }),

    // Бронирования
    getStudentReservations: () => apiRequest('/reservations/my'),
    getAdminReservations: () => apiRequest('/admin/reservations'),
    createReservation: (reservationData) => apiRequest('/reservations', { method: 'POST', body: reservationData }),
    deleteReservation: (reservationId) => apiRequest(`/reservations/${reservationId}`, { method: 'DELETE' })
};