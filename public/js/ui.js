/**
 * Обновляет видимость экранов и элементов интерфейса в зависимости от авторизации пользователя
 */
export function updateAuthUI(currentUser) {
    const authContainer = document.getElementById('authContainer'); // Исправлено с authView на authContainer
    const mainView = document.getElementById('mainView');
    const userNameDisplay = document.getElementById('userNameDisplay'); // Исправлено под ID из index.html
    const adminTabBtn = document.getElementById('adminTabBtn');

    if (currentUser) {
        // Показываем основной экран приложения, скрываем экран входа
        if (authContainer) authContainer.style.display = 'none';
        if (mainView) mainView.style.display = 'block';

        if (userNameDisplay) {
            userNameDisplay.textContent = `${currentUser.nimi || currentUser.email} (${currentUser.rooli || 'student'})`;
        }

        // Показываем вкладку администратора, если у пользователя соответствующая роль
        const isAdmin = currentUser.rooli === 'admin' || currentUser.rooli === 'ylläpitäjä';
        if (adminTabBtn) {
            adminTabBtn.style.display = isAdmin ? 'block' : 'none';
        }
    } else {
        // Показываем экран входа, скрываем основное приложение
        if (authContainer) authContainer.style.display = 'flex'; // Используем flex для центрирования бэкграунда
        if (mainView) mainView.style.display = 'none';
        if (adminTabBtn) {
            adminTabBtn.style.display = 'none';
        }
    }
}