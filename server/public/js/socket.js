// Определяем URL сервера
const SERVER_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : window.location.origin;

// Инициализация Socket.IO
const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

// Обработка событий подключения
socket.on('connect', () => {
    console.log('Подключено к серверу');
    showNotification('Подключено к серверу', 'success');
});

socket.on('disconnect', () => {
    console.log('Отключено от сервера');
    showNotification('Отключено от сервера. Попытка переподключения...', 'warning');
});

socket.on('connect_error', (error) => {
    console.error('Ошибка подключения:', error);
    showNotification('Ошибка подключения к серверу. Попытка переподключения...', 'error');
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Переподключено к серверу после', attemptNumber, 'попыток');
    showNotification('Переподключено к серверу', 'success');
});

socket.on('reconnect_error', (error) => {
    console.error('Ошибка переподключения:', error);
    showNotification('Ошибка переподключения к серверу', 'error');
});

socket.on('reconnect_failed', () => {
    console.error('Не удалось переподключиться к серверу');
    showNotification('Не удалось переподключиться к серверу. Обновите страницу.', 'error');
}); 