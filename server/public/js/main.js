// Глобальные переменные
const socket = io();
let username = '';
let currentGameId = null;
let currentPlayerId = null;
let isHost = false;

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Переключение между экранами
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    document.getElementById(screenId).classList.remove('hidden');
}

// Инициализация после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // Начальный экран - логин
    showScreen('login-screen');
    
    // Сбрасываем флаг наблюдателя при загрузке страницы
    localStorage.removeItem('isObserver');
    
    // Обработчики входа
    document.getElementById('create-game-btn').addEventListener('click', createGame);
    document.getElementById('join-game-btn').addEventListener('click', showJoinGameForm);
    document.getElementById('confirm-join-btn').addEventListener('click', function() {
        const gameId = document.getElementById('game-id-input').value.trim().toUpperCase();
        const playerName = document.getElementById('username-input').value.trim();
        const isObserver = localStorage.getItem('isObserver') === 'true';
        
        if (!gameId) {
            showNotification('Введите ID игры', 'error');
            return;
        }
        
        if (!playerName && !isObserver) {
            showNotification('Введите имя игрока', 'error');
            return;
        }
        
        // Сохраняем имя пользователя в глобальную переменную
        username = playerName;
        
        // Отправляем запрос на присоединение к игре
        socket.emit('joinGame', {
            gameId: gameId,
            playerName: isObserver ? 'Наблюдатель' : playerName,
            isObserver: isObserver
        });
    });
    
    // Переход в режим разработчика
    document.getElementById('dev-codes-btn').addEventListener('click', function() {
        showScreen('dev-screen');
    });
    
    // Возврат из режима разработчика
    document.getElementById('back-from-dev-btn').addEventListener('click', function() {
        showScreen('login-screen');
    });
    
    // Применение кода разработчика
    document.getElementById('submit-code-btn').addEventListener('click', applyDevCode);
    
    // Выход из игры
    document.getElementById('leave-game-btn').addEventListener('click', leaveGame);
    
    // Начало игры (хост)
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    
    // Возврат в меню после окончания игры
    document.getElementById('back-to-lobby-btn').addEventListener('click', function() {
        window.location.reload(); // Перезагружаем страницу
    });
    
    // Проверка сохранённой сессии
    checkForSavedSession();
});

// Проверка сохранённой сессии
function checkForSavedSession() {
    try {
        const savedSession = localStorage.getItem('gameSession');
        
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            
            if (sessionData.gameId && sessionData.playerId && sessionData.username) {
                username = sessionData.username;
                
                console.log('Восстановление сессии:', sessionData);
                
                // Попытка восстановить сессию
                socket.emit('restoreSession', {
                    gameId: sessionData.gameId,
                    playerId: sessionData.playerId,
                    username: sessionData.username
                });
                
                showNotification('Восстанавливаем вашу сессию...', 'info');
            }
        }
    } catch (error) {
        console.error('Ошибка восстановления сессии:', error);
        localStorage.removeItem('gameSession');
    }
}

// Создание новой игры
function createGame() {
    username = document.getElementById('username-input').value.trim();
    
    if (!username) {
        showNotification('Пожалуйста, введите имя', 'warning');
        return;
    }
    
    socket.emit('createGame', username);
}

// Показ формы присоединения к игре
function showJoinGameForm() {
    const joinForm = document.getElementById('join-form');
    joinForm.classList.toggle('hidden');
}

// Выход из игры
function leaveGame() {
    if (confirm('Вы уверены, что хотите выйти из игры?')) {
        socket.emit('leaveGame');
        localStorage.removeItem('gameSession');
        localStorage.removeItem('isObserver');
    }
}

// Начало игры (вызывается хостом)
function startGame() {
    const gameId = document.getElementById('game-id-display').textContent;
    socket.emit('startGame', gameId);
}

// Применение кода разработчика
function applyDevCode() {
    const code = document.getElementById('dev-code-input').value.trim().toUpperCase();
    
    if (!code) {
        showNotification('Введите код', 'warning');
        return;
    }
    
    switch (code) {
        case 'TESTBOTS':
            // Тестовая игра с ботами
            username = document.getElementById('username-input').value.trim() || 'Игрок';
            socket.emit('startTestGame', username);
            document.getElementById('dev-code-input').value = '';
            showNotification('Создание тестовой игры с ботами...', 'info');
            break;
            
        case 'SP':
            // Вход как наблюдатель (Spectator)
            showScreen('login-screen');
            document.getElementById('join-form').classList.remove('hidden');
            document.getElementById('username-input').value = 'Наблюдатель-' + Math.floor(Math.random() * 1000);
            document.getElementById('dev-code-input').value = '';
            localStorage.setItem('isObserver', 'true');
            showNotification('Режим наблюдателя активирован. Теперь введите ID игры для подключения.', 'info');
            break;
            
        case 'BOTCONTROL':
            // Управление ботами
            showScreen('bot-control-screen');
            document.getElementById('dev-code-input').value = '';
            break;
            
        case 'GAMEHISTORY':
            // История игр
            showScreen('game-history-screen');
            document.getElementById('dev-code-input').value = '';
            break;
            
        case 'CUSTOMTRAITS':
            // Добавление собственных характеристик
            showScreen('custom-traits-screen');
            document.getElementById('dev-code-input').value = '';
            break;
            
        default:
            showNotification('Неизвестный код', 'error');
    }
}

// Обработчики сокет-событий
socket.on('connect', () => {
    console.log('Подключено к серверу');
});

socket.on('error', (data) => {
    showNotification(data.message, 'error');
});

socket.on('gameCreated', (data) => {
    // Сохранение данных сессии
    currentGameId = data.gameId;
    currentPlayerId = data.playerId;
    isHost = data.isHost;
    
    console.log('Игра создана:', currentGameId, currentPlayerId, isHost);
    
    // Сохраняем сессию локально для восстановления
    localStorage.setItem('gameSession', JSON.stringify({
        gameId: currentGameId,
        playerId: currentPlayerId,
        username: username
    }));
    
    // Отображение ID игры
    document.getElementById('game-id-display').textContent = data.gameId;
    
    // Показываем элементы управления хоста
    if (data.isHost) {
        document.getElementById('host-controls').classList.remove('hidden');
    }
    
    // Переключение на экран лобби
    showScreen('lobby-screen');
    
    showNotification('Игра создана, поделитесь ID с друзьями', 'success');
});

socket.on('gameJoined', (data) => {
    // Сохранение данных сессии
    currentGameId = data.gameId;
    currentPlayerId = data.playerId;
    isHost = data.isHost;
    
    // Если пришло имя пользователя в данных, сохраняем его
    if (data.username) {
        username = data.username;
    }
    
    console.log('Присоединение к игре:', currentGameId, currentPlayerId, isHost, username);
    
    // Сохраняем сессию локально для восстановления
    localStorage.setItem('gameSession', JSON.stringify({
        gameId: currentGameId,
        playerId: currentPlayerId,
        username: username
    }));
    
    // Отображение ID игры
    document.getElementById('game-id-display').textContent = data.gameId;
    
    // Показываем элементы управления хоста
    if (data.isHost) {
        document.getElementById('host-controls').classList.remove('hidden');
    }
    
    // Переключение на экран лобби
    showScreen('lobby-screen');
    
    showNotification('Вы присоединились к игре', 'success');
});

socket.on('playersList', (data) => {
    console.log('Получен список игроков:', data);
    
    const playersList = document.getElementById('player-list');
    const playerCount = document.getElementById('player-count');
    
    // Проверка наличия элементов DOM
    if (!playersList || !playerCount) {
        console.error('Элементы списка игроков не найдены в DOM');
        return;
    }
    
    // Обновляем количество игроков
    playerCount.textContent = data.players.length;
    
    // Очищаем и заполняем список игроков
    playersList.innerHTML = '';
    
    if (data.players && data.players.length > 0) {
        data.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.username || 'Неизвестный игрок';
            
            // Отмечаем хоста
            if (player.isHost) {
                li.textContent += ' (Хост)';
            }
            
            // Отмечаем ботов
            if (player.isBot) {
                li.textContent += ' (Бот)';
            }
            
            // Отмечаем отключенных
            if (player.disconnected) {
                li.classList.add('disconnected');
                li.textContent += ' (Отключен)';
            }
            
            // Добавляем класс для текущего игрока
            if (player.id === currentPlayerId) {
                li.classList.add('current-player');
                li.textContent += ' (Вы)';
            }
            
            playersList.appendChild(li);
        });
    } else {
        playersList.innerHTML = '<li>Нет игроков</li>';
    }
});

socket.on('playerJoined', (data) => {
    console.log('Получено событие playerJoined:', data);
    showNotification(`${data.username || 'Неизвестный игрок'} присоединился к игре`, 'info');
});

socket.on('playerLeft', (data) => {
    showNotification(`${data.username} покинул игру`, 'info');
});

socket.on('gameStarted', (data) => {
    console.log('Игра началась:', data);
    
    // Сохраняем данные игры
    window.currentGameId = data.gameId;
    window.currentPlayerId = data.id;
    window.isHost = data.isHost;
    
    // Переключение на игровой экран
    showScreen('game-screen');
    
    // Инициализация игрового экрана
    if (typeof initGameScreen === 'function') {
        initGameScreen(data);
    } else {
        console.error('Функция initGameScreen не найдена');
        showNotification('Ошибка инициализации игры', 'error');
    }
});

socket.on('gameLeft', () => {
    // После выхода из игры перезагружаем страницу
    window.location.reload();
});

socket.on('hostAssigned', function(data) {
    if (data.isHost) {
        isHost = true;
        showNotification('Вы назначены новым хостом игры', 'success');
        
        // Показываем кнопку управления игрой
        const gameControlBtn = document.getElementById('game-control-btn');
        if (gameControlBtn) {
            gameControlBtn.classList.remove('hidden');
            // Инициализируем панель управления
            initGameControlPanel();
        }
    }
});

socket.on('reconnectStatus', (data) => {
    if (data.success) {
        showNotification('Сессия успешно восстановлена', 'success');
    } else {
        showNotification('Не удалось восстановить сессию', 'error');
        localStorage.removeItem('gameSession');
    }
});
