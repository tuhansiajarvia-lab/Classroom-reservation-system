/**
 * Обновляет элементы интерфейса в зависимости от того, авторизован пользователь или нет, а также от его роли
 */
export function updateAuthUI(currentUser) {
    const authForms = document.getElementById('authForms');
    const logoutSection = document.getElementById('logoutSection');
    const formContent = document.getElementById('reservationFormContent');
    const loginPromptText = document.getElementById('loginPromptText');
    const loggedUserText = document.getElementById('loggedUserText');
    const adminClassroomSection = document.getElementById('adminClassroomSection');

    if (currentUser) {
        if (authForms) authForms.style.display = 'none';
        if (logoutSection) logoutSection.style.display = 'flex';
        if (loggedUserText) {
            loggedUserText.textContent = `Kirjautunut: ${currentUser.nimi} (${currentUser.rooli})`;
        }
        if (formContent) formContent.classList.remove('disabled-section');
        if (loginPromptText) loginPromptText.style.display = 'none';

        const isAdmin = currentUser.rooli === 'admin' || currentUser.rooli === 'ylläpitäjä';
        if (adminClassroomSection) {
            adminClassroomSection.style.display = isAdmin ? 'block' : 'none';
        }
    } else {
        if (authForms) authForms.style.display = 'block';
        if (logoutSection) logoutSection.style.display = 'none';
        if (formContent) formContent.classList.add('disabled-section');
        if (loginPromptText) loginPromptText.style.display = 'block';
        if (adminClassroomSection) adminClassroomSection.style.display = 'none';
    }
}