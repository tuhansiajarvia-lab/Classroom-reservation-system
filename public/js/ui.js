/**
 * Обновляет видимость экранов и элементов интерфейса в зависимости от авторизации пользователя
 */
export function updateAuthUI(currentUser) {
    const authView = document.getElementById('authView');
    const mainView = document.getElementById('mainView');
    const loggedUserText = document.getElementById('loggedUserText');
    const adminTabBtn = document.getElementById('adminTabBtn');

    if (currentUser) {
        // Показываем основной экран приложения, скрываем экран входа
        if (authView) authView.style.display = 'none';
        if (mainView) mainView.style.display = 'block';

        if (loggedUserText) {
            loggedUserText.textContent = `${currentUser.nimi} (${currentUser.rooli})`;
        }

        // Показываем вкладку администратора, если у пользователя соответствующая роль
        const isAdmin = currentUser.rooli === 'admin' || currentUser.rooli === 'ylläpitäjä';
        if (adminTabBtn) {
            adminTabBtn.style.display = isAdmin ? 'block' : 'none';
        }
    } else {
        // Показываем экран входа, скрываем основное приложение
        if (authView) authView.style.display = 'block';
        if (mainView) mainView.style.display = 'none';
        if (adminTabBtn) {
            adminTabBtn.style.display = 'none';
        }
    }
}