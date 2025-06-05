// Глобальные переменные для игры
const gameData = {
    get currentGameId() { 
        const id = window.currentGameId;
        logDebug('Получение currentGameId:', id);
        return id; 
    },
    get currentPlayerId() { 
        const id = window.currentPlayerId;
        logDebug('Получение currentPlayerId:', id);
        return id; 
    },
    get isHost() { 
        const host = window.isHost;
        logDebug('Получение isHost:', host);
        return host; 
    },
    playerData: null,
    selectedVoteTarget: null
};

// Добавляем отладочное логирование
function logDebug(message, data) {
    console.log(`[DEBUG] ${message}`, data || '');
}

// Обработка ошибок сокета для диагностики
socket.on('connect_error', (error) => {
    console.error('Ошибка подключения к серверу:', error);
    showNotification('Ошибка подключения к серверу. Обновите страницу.', 'error');
});

socket.on('error', (error) => {
    console.error('Ошибка сокета:', error);
    showNotification('Произошла ошибка. Обновите страницу.', 'error');
});

// Инициализация игрового экрана
function initGameScreen(data) {
    logDebug('Инициализация игрового экрана с данными:', data);
    
    try {
        // Устанавливаем глобальные переменные
        window.currentGameId = data.gameId;
        window.currentPlayerId = data.id;
        window.isHost = data.isHost;
        window.isSpectator = data.isSpectator;
        
        logDebug('Установлены глобальные переменные:', {
            currentGameId: window.currentGameId,
            currentPlayerId: window.currentPlayerId,
            isHost: window.isHost,
            isSpectator: window.isSpectator
        });
        
        // Сохраняем данные игры
        gameData.playerData = data;
        
        // Отображение имени игрока (или текста "Наблюдатель")
        const playerNameEl = document.getElementById('player-name');
        if (playerNameEl) {
            playerNameEl.textContent = data.isSpectator ? 'Наблюдатель' : data.username;
        }
        
        // Отображение информации о катастрофе
        if (data.catastrophe) {
            const titleEl = document.getElementById('catastrophe-title');
            const descEl = document.getElementById('catastrophe-description');
            
            if (titleEl) titleEl.textContent = data.catastrophe.title;
            if (descEl) descEl.textContent = data.catastrophe.description;
        }
        
        // Отображение информации о бункере
        if (data.bunker) {
            const descEl = document.getElementById('bunker-description');
            if (descEl) descEl.textContent = data.bunker.description || 'Описание отсутствует';
            
            const featuresEl = document.getElementById('bunker-features');
            if (featuresEl) {
                featuresEl.innerHTML = '';
                
                if (data.bunker.features && data.bunker.features.length > 0) {
                    data.bunker.features.forEach(feature => {
                        const li = document.createElement('li');
                        li.textContent = feature;
                        featuresEl.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'Нет данных';
                    featuresEl.appendChild(li);
                }
            }
        }
        
        // Отображение номера текущего раунда
        const roundEl = document.getElementById('current-round');
        if (roundEl) roundEl.textContent = data.currentRound || '1';
        
        // Если наблюдатель, показываем специальный интерфейс
        if (data.isSpectator) {
            initSpectatorInterface(data);
        } else {
        // Настраиваем карточки характеристик
        setupCharacteristicCards(data.characteristics);
        
        // Показываем кнопку управления игрой и инициализируем панель только для хоста
        const gameControlBtn = document.getElementById('game-control-btn');
        
        if (gameControlBtn) {
            if (data.isHost) {
                gameControlBtn.classList.remove('hidden');
                initGameControlPanel();
            } else {
                gameControlBtn.classList.add('hidden');
            }
        }
        
        // Обновляем способности игрока
        updateAbilities(data);
        }
        
        // Обновляем список игроков
        updatePlayersList();
        
        // Добавляем обработчик для кнопки выхода
        const leaveBtn = document.getElementById('leave-game-btn-in-game');
        if (leaveBtn) {
            // Удаляем старые обработчики
            const newLeaveBtn = leaveBtn.cloneNode(true);
            leaveBtn.parentNode.replaceChild(newLeaveBtn, leaveBtn);
            
            // Добавляем новый обработчик
            newLeaveBtn.addEventListener('click', function() {
                if (confirm('Вы уверены, что хотите выйти из игры?')) {
                    socket.emit('leaveGame');
                    window.location.reload(); // Перезагружаем страницу
                }
            });
        }
        
        // Показываем игровой экран
        showScreen('game-screen');
        
        logDebug('Игровой экран успешно инициализирован');
        showNotification('Игра началась!', 'success');
    } catch (error) {
        console.error('Ошибка инициализации игрового экрана:', error);
        showNotification('Ошибка инициализации игрового экрана', 'error');
    }
}

// Настройка карточек характеристик
function setupCharacteristicCards(characteristics) {
    logDebug('Настройка карточек характеристик', characteristics);
    
    try {
        const charTypes = ['profession', 'health', 'age', 'gender', 'hobby', 'phobia', 'baggage', 'fact', 'trait'];
        
        charTypes.forEach(charType => {
            // Находим карточку для данного типа характеристики
            const card = document.querySelector(`.characteristic-item[data-type="${charType}"]`);
            if (!card) {
                console.error(`Карточка для типа ${charType} не найдена`);
                return;
            }
            
            const contentContainer = card.querySelector('.card-content');
            if (!contentContainer) {
                console.error(`Контейнер содержимого для типа ${charType} не найден`);
                return;
            }
            
            // Получаем значение характеристики
            const charValue = characteristics[charType];
            
            if (charValue) {
                contentContainer.textContent = charValue;
                card.classList.add('has-value');
                
                // Добавляем обработчик клика для раскрытия
                card.addEventListener('click', function() {
                    if (!card.classList.contains('revealed')) {
                        revealCard(charType);
                    }
                });
            } else {
                contentContainer.textContent = 'Нет данных';
                card.classList.remove('has-value');
            }
        });
        
        logDebug('Карточки характеристик успешно обновлены');
    } catch (error) {
        console.error('Ошибка при настройке карточек характеристик:', error);
        showNotification('Ошибка при загрузке характеристик', 'error');
    }
}

// Функция для показа уведомления о раскрытии характеристики
function showRevealNotification(title, content) {
    try {
        const notification = document.getElementById('reveal-notification');
        if (!notification) {
            console.error('Элемент уведомления не найден');
            return;
        }

        const titleEl = notification.querySelector('.reveal-title');
        const contentEl = notification.querySelector('.reveal-content');
        
        if (!titleEl || !contentEl) {
            console.error('Элементы уведомления не найдены');
            return;
        }

        titleEl.textContent = title;
        contentEl.textContent = content;
        
        // Сначала удаляем класс, если он был
        notification.classList.remove('show');
        // Форсируем перерисовку
        void notification.offsetWidth;
        // Добавляем класс снова
        notification.classList.add('show');
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'revealFadeOut 0.5s ease forwards';
            setTimeout(() => {
                notification.classList.remove('show');
                notification.style.animation = '';
            }, 500);
        }, 3000);
    } catch (error) {
        console.error('Ошибка при показе уведомления:', error);
    }
}

// Функция раскрытия карты
function revealCard(cardType) {
    console.log('=== НАЧАЛО РАСКРЫТИЯ КАРТЫ ===');
    console.log('Тип карты:', cardType);
    console.log('Текущие данные игры:', {
        currentGameId: gameData.currentGameId,
        currentPlayerId: gameData.currentPlayerId,
        isHost: gameData.isHost
    });
    
    // Проверяем наличие необходимых данных
    if (!gameData.currentGameId) {
        console.error('Ошибка: ID игры не определен');
        showNotification('Ошибка: ID игры не определен', 'error');
        return;
    }
    
    if (!gameData.currentPlayerId) {
        console.error('Ошибка: ID игрока не определен');
        showNotification('Ошибка: ID игрока не определен', 'error');
        return;
    }
    
    if (!cardType) {
        console.error('Ошибка: тип карты не указан');
        showNotification('Ошибка: тип карты не указан', 'error');
        return;
    }
    
    try {
        // Удаляем существующие модальные окна
        const existingModals = document.querySelectorAll('.modal, .modal-backdrop');
        existingModals.forEach(modal => modal.remove());
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        modal.classList.add('show');
        backdrop.classList.add('show');
        
        // Получаем название типа карты
        const cardTypeName = getCardTypeName(cardType);
        
        modal.innerHTML = `
            <h3>Раскрыть характеристику?</h3>
            <p>Вы собираетесь раскрыть: ${cardTypeName}</p>
            <p>После раскрытия все игроки увидят значение этой характеристики.</p>
            <div class="modal-buttons">
                <button class="btn btn-confirm" id="confirm-reveal-btn">Раскрыть</button>
                <button class="btn btn-cancel" id="cancel-reveal-btn">Отмена</button>
            </div>
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Обработчик подтверждения
        const confirmBtn = document.getElementById('confirm-reveal-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                // Подготавливаем данные для отправки
                const data = {
                    gameId: gameData.currentGameId,
                    playerId: gameData.currentPlayerId,
                    cardType: cardType
                };
                
                console.log('Отправка данных на сервер:', data);
                
                // Проверяем данные перед отправкой
                if (!data.gameId) {
                    console.error('Ошибка: gameId не определен при отправке');
                    showNotification('Ошибка: ID игры не определен', 'error');
                    return;
                }
                
                if (!data.playerId) {
                    console.error('Ошибка: playerId не определен при отправке');
                    showNotification('Ошибка: ID игрока не определен', 'error');
                    return;
                }
                
                // Отправляем данные на сервер
                socket.emit('revealCard', data);
                
                // Удаляем модальное окно
                backdrop.remove();
                modal.remove();
            });
        }
        
        // Обработчик отмены
        const cancelBtn = document.getElementById('cancel-reveal-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                backdrop.remove();
                modal.remove();
            });
        }
    } catch (error) {
        console.error('Ошибка при создании модального окна:', error);
        showNotification('Произошла ошибка при раскрытии карты', 'error');
    }
}

// Обработчик события раскрытия карты
socket.on('cardRevealed', (data) => {
    console.log('=== ПОЛУЧЕНО СОБЫТИЕ РАСКРЫТИЯ КАРТЫ ===');
    console.log('Данные:', data);
    
    try {
        if (!data.success) {
            console.error('Ошибка при раскрытии карты:', data.message);
            showNotification(data.message || 'Ошибка при раскрытии карты', 'error');
            return;
        }
        
        const { username, cardType, value } = data.data;
        const cardName = getCardTypeName(cardType);
        
        console.log('Обновление интерфейса:', {
            username,
            cardType,
            value,
            cardName
        });
        
        // Обновляем карточку игрока в интерфейсе
        updateOtherPlayerCard(data.data);
        
        // Показываем уведомление
        showRevealNotification(
            'Характеристика раскрыта!',
            `${username} раскрыл ${cardName.toLowerCase()}: ${value}`
        );
        
        // Добавляем в лог
        addEventToLog(`${username} раскрыл характеристику: ${cardName} - ${value}`);
        
        // Воспроизводим звук
        playSound('reveal');
        
        // Обновляем состояние игры
        updateGameState();
        
        console.log('=== КАРТА УСПЕШНО РАСКРЫТА ===');
    } catch (error) {
        console.error('Ошибка при обработке раскрытия карты:', error);
        showNotification('Произошла ошибка при обработке раскрытия карты', 'error');
    }
});

// Функция для получения случайной характеристики
function getRandomCharacteristic() {
    const characteristics = ['profession', 'health', 'age', 'gender', 'hobby', 'phobia', 'baggage', 'fact', 'trait'];
    return characteristics[Math.floor(Math.random() * characteristics.length)];
}

// Обновление списка игроков
function updatePlayersList() {
    logDebug('Обновление списка игроков');
    
    const otherPlayersList = document.getElementById('other-players-list');
    if (!otherPlayersList) {
        console.error('Ошибка: контейнер списка игроков не найден');
        return;
    }
    
    try {
        // Очищаем список перед обновлением
        otherPlayersList.innerHTML = '';
        
        // Проверяем наличие данных о других игроках
        if (!gameData.playerData || !gameData.playerData.allPlayers || gameData.playerData.allPlayers.length === 0) {
            otherPlayersList.innerHTML = '<p>Нет других игроков</p>';
            return;
        }
        
        // Получаем всех игроков из данных игры, исключая текущего игрока
        gameData.playerData.allPlayers.forEach(player => {
            if (player.id && player.id !== gameData.currentPlayerId) {
                createOrUpdatePlayerCard(player);
            }
        });
        
        // Если список все еще пуст
        if (otherPlayersList.children.length === 0) {
            otherPlayersList.innerHTML = '<p>Нет других игроков</p>';
        }
        
        // После обновления списка игроков, обновляем список целей для хоста
        if (gameData.isHost) {
            updateTargetPlayersList();
            updateManagePlayersList();
        }
    } catch (error) {
        console.error('Ошибка при обновлении списка игроков:', error);
    }
}

// Создание или обновление карточки игрока
function createOrUpdatePlayerCard(player) {
    try {
        const otherPlayersList = document.getElementById('other-players-list');
        if (!otherPlayersList) return;
        
        if (!player || !player.id) {
            console.error('Ошибка: неверные данные игрока', player);
            return;
        }
        
        // Проверка, существует ли уже карточка этого игрока
        let playerCard = document.querySelector(`.other-player-card[data-player-id="${player.id}"]`);
        
        if (!playerCard) {
            // Создаем новую карточку
            playerCard = document.createElement('div');
            playerCard.className = 'other-player-card';
            playerCard.setAttribute('data-player-id', player.id);
            
            // Если игрок исключен, добавляем соответствующий класс
            if (player.isKicked || !player.isInBunker) {
                playerCard.classList.add('kicked');
            }
            
            // Если игрок отключен, добавляем соответствующий класс
            if (player.disconnected) {
                playerCard.classList.add('disconnected');
            }
            
            const playerName = document.createElement('h4');
            playerName.textContent = player.username || 'Игрок';
            
            // Если игрок исключен, добавляем метку
            if (player.isKicked || !player.isInBunker) {
                playerName.textContent += ' (Исключен)';
            }
            
            // Если игрок отключен, добавляем метку
            if (player.disconnected) {
                playerName.innerHTML += ' <span class="disconnected-label">(Отключен)</span>';
            }
            
            playerCard.appendChild(playerName);
            otherPlayersList.appendChild(playerCard);
        }
        
        // Обновляем или создаем характеристики
        const characteristicsContainer = playerCard.querySelector('.player-characteristics') || document.createElement('div');
        characteristicsContainer.className = 'player-characteristics';
        
        // Очищаем существующие характеристики
        characteristicsContainer.innerHTML = '';
        
        // Добавляем все типы характеристик
        const allCharTypes = ['profession', 'health', 'age', 'gender', 'hobby', 'phobia', 'baggage', 'fact', 'trait'];
        
        allCharTypes.forEach(charType => {
            const charDiv = document.createElement('div');
            charDiv.className = 'player-characteristic';
            charDiv.setAttribute('data-type', charType);
            
            const typeName = document.createElement('span');
            typeName.className = 'characteristic-name';
            typeName.textContent = getCardTypeName(charType) + ': ';
            
            const value = document.createElement('span');
            value.className = 'characteristic-value';
            
            // Проверяем, раскрыта ли характеристика
            if (player.revealedCards && player.revealedCards.includes(charType) && 
                player.characteristics && player.characteristics[charType]) {
                value.textContent = player.characteristics[charType];
            } else {
                value.textContent = 'Неизвестно';
                value.classList.add('unknown');
            }
            
            charDiv.appendChild(typeName);
            charDiv.appendChild(value);
            characteristicsContainer.appendChild(charDiv);
        });
        
        // Добавляем контейнер с характеристиками, если его еще нет
        if (!playerCard.querySelector('.player-characteristics')) {
            playerCard.appendChild(characteristicsContainer);
        }
    } catch (error) {
        console.error('Ошибка при создании карточки игрока:', error);
    }
}

// Обновление карточки игрока при раскрытии характеристики
function updateOtherPlayerCard(data) {
    try {
        const { playerId, username, cardType, value } = data;
        
        if (!playerId || !cardType) {
            console.error('Ошибка: неверные данные для обновления карточки игрока', data);
            return;
        }
        
        // Находим карточку игрока
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${playerId}"]`);
        
        if (playerCard) {
            // Находим или создаем контейнер для характеристик
            let characteristicsContainer = playerCard.querySelector('.player-characteristics');
            if (!characteristicsContainer) {
                characteristicsContainer = document.createElement('div');
                characteristicsContainer.className = 'player-characteristics';
                playerCard.appendChild(characteristicsContainer);
            }
            
            // Находим характеристику или создаем новую
            let charElement = characteristicsContainer.querySelector(`.player-characteristic[data-type="${cardType}"]`);
            
            if (!charElement) {
                // Создаем новый элемент характеристики
                charElement = document.createElement('div');
                charElement.className = 'player-characteristic';
                charElement.setAttribute('data-type', cardType);
                
                const typeName = document.createElement('span');
                typeName.className = 'characteristic-name';
                typeName.textContent = getCardTypeName(cardType) + ': ';
                
                const valueElement = document.createElement('span');
                valueElement.className = 'characteristic-value';
                
                charElement.appendChild(typeName);
                charElement.appendChild(valueElement);
                characteristicsContainer.appendChild(charElement);
            }
            
            // Обновляем значение
            const valueElement = charElement.querySelector('.characteristic-value');
            if (valueElement) {
                valueElement.textContent = value;
                valueElement.classList.remove('unknown');
                valueElement.classList.add('revealed');
                valueElement.style.animation = "highlight 1.5s";
                setTimeout(() => { valueElement.style.animation = ""; }, 1500);
            }
        } else {
            // Если карточки игрока нет, создаем её с этой характеристикой
            const newPlayer = {
                id: playerId,
                username: username || 'Игрок',
                characteristics: { [cardType]: value },
                revealedCards: [cardType]
            };
            
            createOrUpdatePlayerCard(newPlayer);
        }
        
        // Обновляем данные в gameData
        if (gameData.playerData && gameData.playerData.allPlayers) {
            const playerIndex = gameData.playerData.allPlayers.findIndex(p => p.id === playerId);
            
            if (playerIndex !== -1) {
                // Обновляем список раскрытых карт
                if (!gameData.playerData.allPlayers[playerIndex].revealedCards) {
                    gameData.playerData.allPlayers[playerIndex].revealedCards = [];
                }
                
                if (!gameData.playerData.allPlayers[playerIndex].revealedCards.includes(cardType)) {
                    gameData.playerData.allPlayers[playerIndex].revealedCards.push(cardType);
                }
                
                // Обновляем характеристики
                if (!gameData.playerData.allPlayers[playerIndex].characteristics) {
                    gameData.playerData.allPlayers[playerIndex].characteristics = {};
                }
                
                gameData.playerData.allPlayers[playerIndex].characteristics[cardType] = value;
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении карточки игрока:', error);
    }
}

// Инициализация панели управления хоста
function initGameControlPanel() {
    try {
        const controlBtn = document.getElementById('game-control-btn');
        const controlPanel = document.getElementById('game-control-panel');
        const backdrop = document.getElementById('panel-backdrop');
        const closeBtn = document.getElementById('close-panel');
        
        if (!controlBtn || !controlPanel || !backdrop || !closeBtn) {
            console.error('Ошибка: не найдены элементы панели управления');
            return;
        }
        
        // Открытие панели
        const newControlBtn = controlBtn.cloneNode(true);
        controlBtn.parentNode.replaceChild(newControlBtn, controlBtn);
        
        newControlBtn.addEventListener('click', function() {
            controlPanel.classList.add('open');
            backdrop.classList.add('show');
            updateTargetPlayersList(); // Обновляем список игроков при открытии
            updateManagePlayersList(); // Обновляем список игроков для управления
        });
        
        // Закрытие панели
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        newCloseBtn.addEventListener('click', function() {
            controlPanel.classList.remove('open');
            backdrop.classList.remove('show');
        });
        
        const newBackdrop = backdrop.cloneNode(true);
        backdrop.parentNode.replaceChild(newBackdrop, backdrop);
        
        newBackdrop.addEventListener('click', function() {
            controlPanel.classList.remove('open');
            newBackdrop.classList.remove('show');
        });
        
        // Обработчики кнопок в панели управления
        setupHostControlButton('start-voting-btn', function() {
            if (!gameData.currentGameId) {
                showNotification('Ошибка: ID игры не определен', 'error');
                return;
            }
            
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'startVoting'
            });
            
            showNotification('Запуск голосования...', 'info');
            controlPanel.classList.remove('open');
            newBackdrop.classList.remove('show');
        });
        
        setupHostControlButton('next-round-btn', function() {
            if (!gameData.currentGameId) {
                showNotification('Ошибка: ID игры не определен', 'error');
                return;
            }
            
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'nextRound'
            });
            
            controlPanel.classList.remove('open');
            newBackdrop.classList.remove('show');
        });
        
        // Управление таймером
        setupHostControlButton('start-timer-btn', function() {
            const seconds = parseInt(document.getElementById('timer-seconds').value) || 60;
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'startTimer',
                seconds: seconds
            });
        });
        
        setupHostControlButton('pause-timer-btn', function() {
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'pauseTimer'
            });
        });
        
        setupHostControlButton('stop-timer-btn', function() {
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'stopTimer'
            });
        });
        
        setupHostControlButton('set-timer-btn', function() {
            const seconds = parseInt(document.getElementById('timer-seconds').value) || 60;
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'setTimer',
                seconds: seconds
            });
        });
        
        // Управление игроками
        setupHostControlButton('kick-player-btn', function() {
            const playerSelect = document.getElementById('manage-player-select');
            if (!playerSelect) return;
            
            const playerId = playerSelect.value;
            if (!playerId) {
                showNotification('Выберите игрока для исключения', 'warning');
                return;
            }
            
            if (confirm('Вы действительно хотите исключить этого игрока из бункера?')) {
                socket.emit('hostAction', {
                    gameId: gameData.currentGameId,
                    action: 'kickPlayer',
                    playerId: playerId
                });
            }
        });
        
        setupHostControlButton('return-to-bunker-btn', function() {
            const playerSelect = document.getElementById('manage-player-select');
            if (!playerSelect) return;
            
            const playerId = playerSelect.value;
            if (!playerId) {
                showNotification('Выберите исключенного игрока для возврата в бункер', 'warning');
                return;
            }
            
            // Проверяем, действительно ли игрок исключен
            const option = document.querySelector(`#manage-player-select option[value="${playerId}"]`);
            if (option && !option.textContent.includes('(Исключен)')) {
                showNotification('Этот игрок уже в бункере', 'info');
                return;
            }
            
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'returnToBunker',
                playerId: playerId
            });
            
            showNotification('Запрос на возвращение игрока в бункер отправлен', 'info');
        });
        
        // Управление характеристиками
        setupHostControlButton('random-characteristic-btn', function() {
            changePlayerCharacteristic('random');
        });
        
        setupHostControlButton('improve-characteristic-btn', function() {
            changePlayerCharacteristic('improve');
        });
        
        setupHostControlButton('worsen-characteristic-btn', function() {
            changePlayerCharacteristic('worsen');
        });
        
        setupHostControlButton('set-exact-characteristic-btn', function() {
            const playerId = document.getElementById('target-player').value;
            const characteristicType = document.getElementById('target-characteristic').value;
            
            if (!playerId || !characteristicType) {
                showNotification('Выберите игрока и характеристику', 'warning');
                return;
            }
            
            if (characteristicType === 'age') {
                showExactAgeDialog(playerId);
            } else {
                showExactValueDialog(playerId, characteristicType);
            }
        });
    } catch (error) {
        console.error('Ошибка при инициализации панели управления хоста:', error);
    }
}

// Вспомогательная функция для установки обработчиков на кнопки хоста
function setupHostControlButton(btnId, callback) {
    try {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', callback);
    } catch (error) {
        console.error(`Ошибка при настройке кнопки ${btnId}:`, error);
    }
}

// Функция для отображения диалога установки точного возраста
function showExactAgeDialog(playerId) {
    try {
        // Находим имя игрока
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${playerId}"]`);
        const playerName = playerCard ? playerCard.querySelector('h4').textContent : 'игрока';
        
        // Удаляем старые модальные окна, если они есть
        const oldModals = document.querySelectorAll('.modal, .modal-backdrop');
        oldModals.forEach(el => el.remove());
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h3>Установка возраста для ${playerName}</h3>
            <div class="age-input-container">
                <p>Введите новый возраст (от 18 до 90):</p>
                <input type="number" class="age-input" id="exact-age-input" min="18" max="90" value="30">
            </div>
            <div class="modal-buttons">
                <button class="btn" id="cancel-age-btn">Отмена</button>
                <button class="btn btn-primary" id="confirm-age-btn">Установить</button>
            </div>
        `;
        
        // Создаем затемнение
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        // Добавляем элементы в DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Фокус на поле ввода
        document.getElementById('exact-age-input').focus();
        
        // Обработчики кнопок
        document.getElementById('cancel-age-btn').addEventListener('click', function() {
            backdrop.remove();
            modal.remove();
        });
        
        document.getElementById('confirm-age-btn').addEventListener('click', function() {
            const age = parseInt(document.getElementById('exact-age-input').value);
            if (isNaN(age) || age < 18 || age > 90) {
                showNotification('Введите корректный возраст (от 18 до 90)', 'warning');
                return;
            }
            
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'setExactAge',
                playerId: playerId,
                age: age
            });
            
            backdrop.remove();
            modal.remove();
        });
    } catch (error) {
        console.error('Ошибка при отображении диалога возраста:', error);
    }
}

// Функция для ввода произвольного значения характеристики
function showExactValueDialog(playerId, characteristicType) {
    try {
        // Находим имя игрока
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${playerId}"]`);
        const playerName = playerCard ? playerCard.querySelector('h4').textContent : 'игрока';
        
        // Удаляем старые модальные окна, если они есть
        const oldModals = document.querySelectorAll('.modal, .modal-backdrop');
        oldModals.forEach(el => el.remove());
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h3>Изменение ${getCardTypeName(characteristicType)} для ${playerName}</h3>
            <div class="age-input-container">
                <p>Введите новое значение:</p>
                <input type="text" class="age-input" id="exact-value-input" placeholder="Введите новое значение">
            </div>
            <div class="modal-buttons">
                <button class="btn" id="cancel-value-btn">Отмена</button>
                <button class="btn btn-primary" id="confirm-value-btn">Установить</button>
            </div>
        `;
        
        // Создаем затемнение
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        // Добавляем элементы в DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Фокус на поле ввода
        document.getElementById('exact-value-input').focus();
        
        // Обработчики кнопок
        document.getElementById('cancel-value-btn').addEventListener('click', function() {
            backdrop.remove();
            modal.remove();
        });
        
        document.getElementById('confirm-value-btn').addEventListener('click', function() {
            const newValue = document.getElementById('exact-value-input').value.trim();
            if (!newValue) {
                showNotification('Введите значение', 'warning');
                return;
            }
            
            socket.emit('hostAction', {
                gameId: gameData.currentGameId,
                action: 'setExactValue',
                playerId: playerId,
                characteristicType: characteristicType,
                newValue: newValue
            });
            
            backdrop.remove();
            modal.remove();
        });
    } catch (error) {
        console.error('Ошибка при отображении диалога значения:', error);
    }
}

// Обновление списка игроков для выбора цели
function updateTargetPlayersList() {
    try {
        const playerSelect = document.getElementById('target-player');
        if (!playerSelect) return;
        
        playerSelect.innerHTML = '<option value="">Выберите игрока</option>';
        
        // Добавляем всех других игроков
        document.querySelectorAll('.other-player-card').forEach(playerCard => {
            const playerId = playerCard.getAttribute('data-player-id');
            if (!playerId) return;
            
            const playerName = playerCard.querySelector('h4');
            if (!playerName) return;
            
            const option = document.createElement('option');
            option.value = playerId;
            option.textContent = playerName.textContent;
            
            // Если игрок исключен, отмечаем это в опции
            if (playerCard.classList.contains('kicked')) {
                option.textContent += ' (Исключен)';
                option.setAttribute('data-kicked', 'true');
            }
            
            playerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка при обновлении списка целей:', error);
    }
}

// Функция для обновления списка игроков в меню управления
function updateManagePlayersList() {
    try {
        const playerSelect = document.getElementById('manage-player-select');
        if (!playerSelect) return;
        
        playerSelect.innerHTML = '<option value="">Выберите игрока</option>';
        
        // Заполняем список всеми игроками
        document.querySelectorAll('.other-player-card').forEach(playerCard => {
            const playerId = playerCard.getAttribute('data-player-id');
            if (!playerId) return;
            
            const playerName = playerCard.querySelector('h4');
            if (!playerName) return;
            
            const option = document.createElement('option');
            option.value = playerId;
            option.textContent = playerName.textContent;
            
            // Если игрок исключен, отмечаем это в опции
            if (playerCard.classList.contains('kicked')) {
                option.textContent += ' (Исключен)';
                option.setAttribute('data-kicked', 'true');
            }
            
            playerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка при обновлении списка игроков для управления:', error);
    }
}

// Изменение характеристики игрока
function changePlayerCharacteristic(action) {
    try {
        const playerSelect = document.getElementById('target-player');
        const characteristicSelect = document.getElementById('target-characteristic');
        
        if (!playerSelect || !characteristicSelect) {
            console.error('Элементы выбора характеристик не найдены');
            return;
        }
        
        const playerId = playerSelect.value;
        const characteristicType = characteristicSelect.value;
        
        if (!playerId || !characteristicType) {
            showNotification('Выберите игрока и характеристику', 'warning');
            return;
        }
        
        if (!gameData.currentGameId) {
            showNotification('Ошибка: ID игры не определен', 'error');
            return;
        }
        
        logDebug('Изменение характеристики:', {
            gameId: gameData.currentGameId,
            playerId: playerId,
            characteristicType: characteristicType,
            action: action
        });
        
        socket.emit('hostChangeCharacteristic', {
            gameId: gameData.currentGameId,
            playerId: playerId,
            characteristicType: characteristicType,
            action: action
        });
        
        // Закрываем панель после действия
        const controlPanel = document.getElementById('game-control-panel');
        const backdrop = document.getElementById('panel-backdrop');
        
        if (controlPanel) controlPanel.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
    } catch (error) {
        console.error('Ошибка при изменении характеристики:', error);
    }
}

// Обработка кика игрока
function handlePlayerKicked(data) {
    try {
        const { playerId, playerName } = data;
        
        if (!playerId) {
            console.error('Ошибка: отсутствует ID исключенного игрока');
            return;
        }
        
        logDebug('Обработка исключения игрока:', playerId, playerName);
        
        // Находим карточку игрока и отмечаем его как исключенного
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${playerId}"]`);
        if (playerCard) {
            playerCard.classList.add('kicked');
            
            // Добавляем метку "Исключен" к имени игрока
            const playerNameElem = playerCard.querySelector('h4');
            if (playerNameElem) {
                // Очищаем текст и заново устанавливаем с пометкой
                playerNameElem.textContent = `${playerName || 'Игрок'} (Исключен)`;
            }
            
            // Перемещаем карточку в конец списка
            const parentContainer = playerCard.parentElement;
            if (parentContainer) {
                parentContainer.appendChild(playerCard);
            }
        }
        
        // Обновляем данные в gameData
        if (gameData.playerData && gameData.playerData.allPlayers) {
            const playerIndex = gameData.playerData.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameData.playerData.allPlayers[playerIndex].isKicked = true;
                gameData.playerData.allPlayers[playerIndex].isInBunker = false;
            }
        }
        
        // Обновляем списки выбора игроков
        if (gameData.isHost) {
            updateManagePlayersList();
            updateTargetPlayersList();
        }
        
        // Показываем уведомление
        showNotification(`Игрок ${playerName || 'неизвестный'} был исключен из бункера`, 'warning');
        addLogMessage(`${playerName || 'Игрок'} был исключен из бункера`);
    } catch (error) {
        console.error('Ошибка при обработке исключения игрока:', error);
    }
}

// Обработчик для возврата игрока в бункер
function handlePlayerReturnedToBunker(data) {
    try {
        const { playerId, playerName } = data;
        
        if (!playerId) {
            console.error('Ошибка: отсутствует ID возвращенного игрока');
            return;
        }
        
        // Находим карточку игрока и снимаем отметку об исключении
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${playerId}"]`);
        if (playerCard) {
            playerCard.classList.remove('kicked');
            
            // Обновляем визуальное представление
            const playerNameElement = playerCard.querySelector('h4');
            if (playerNameElement) {
                playerNameElement.textContent = playerName || 'Игрок';
            }
        }
        
        // Обновляем данные в gameData
        if (gameData.playerData && gameData.playerData.allPlayers) {
            const playerIndex = gameData.playerData.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameData.playerData.allPlayers[playerIndex].isKicked = false;
                gameData.playerData.allPlayers[playerIndex].isInBunker = true;
            }
        }
        
        // Обновляем списки игроков в интерфейсе
        if (gameData.isHost) {
            updateManagePlayersList();
            updateTargetPlayersList();
        }
        
        // Показываем уведомление
        showNotification(`${playerName || 'Игрок'} возвращен в бункер`, 'success');
        addLogMessage(`${playerName || 'Игрок'} возвращен в бункер хостом`);
    } catch (error) {
        console.error('Ошибка при возврате игрока в бункер:', error);
    }
}

// Функция для использования специальных способностей
function useAbility(abilityName, abilityType) {
    try {
        if (!gameData.currentGameId || !gameData.currentPlayerId) {
            showNotification('Ошибка: невозможно использовать способность', 'error');
            return;
        }
        
        logDebug('Использование способности:', abilityName, 'типа:', abilityType);
        
        // Определяем, требуется ли выбор цели
        const specialTargetRequired = ['Принудительное раскрытие', 'Защита союзника'].includes(abilityName);
        const profTargetRequired = [
            'Медицинский осмотр', 'Обучение навыку', 'Взлом системы', 'Раскрытие правды',
            'Терапевтическая сессия', 'Омоложение', 'Физическая подготовка'
        ].includes(abilityName);
        
        const requiresTarget = (abilityType === 'special' && specialTargetRequired) || 
                              (abilityType === 'professional' && profTargetRequired);

        // Показываем диалог подтверждения
        const confirmationText = requiresTarget 
            ? `Вы собираетесь использовать способность "${abilityName}". Вам нужно будет выбрать цель.`
            : `Вы собираетесь использовать способность "${abilityName}".`;

        showConfirmationModal(confirmationText, () => {
            if (requiresTarget) {
                // Показываем диалог выбора цели
                showTargetSelectionDialog(abilityName, abilityType);
            } else {
                // Используем способность без цели
                socket.emit('useSpecialAbility', {
                    gameId: gameData.currentGameId,
                    playerId: gameData.currentPlayerId,
                    abilityName: abilityName
                });
                
                showNotification(`Вы используете способность: ${abilityName}`, 'info');
            }
        });
    } catch (error) {
        console.error('Ошибка при использовании способности:', error);
    }
}

// Обновляем функцию показа диалога подтверждения
function showConfirmationModal(text, onConfirm) {
    try {
        // Удаляем старые модальные окна, если они есть
        const oldModals = document.querySelectorAll('.modal, .modal-backdrop');
        oldModals.forEach(el => el.remove());
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <h3>Подтверждение действия</h3>
            <p>${text}</p>
            <div class="modal-buttons">
                <button class="btn btn-cancel" id="cancel-action-btn">Отмена</button>
                <button class="btn btn-confirm" id="confirm-action-btn">Подтвердить</button>
            </div>
        `;
        
        // Добавляем элементы в DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Показываем модальное окно
        modal.classList.add('show');
        backdrop.classList.add('show');
        
        // Обработчики кнопок
        const confirmBtn = modal.querySelector('#confirm-action-btn');
        const cancelBtn = modal.querySelector('#cancel-action-btn');
        
        const handleConfirm = () => {
            modal.classList.remove('show');
            backdrop.classList.remove('show');
            onConfirm();
            cleanup();
        };
        
        const handleCancel = () => {
            modal.classList.remove('show');
            backdrop.classList.remove('show');
            cleanup();
        };
        
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            backdrop.removeEventListener('click', handleCancel);
            setTimeout(() => {
                modal.remove();
                backdrop.remove();
            }, 300);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        backdrop.addEventListener('click', handleCancel);
    } catch (error) {
        console.error('Ошибка при показе диалога подтверждения:', error);
    }
}

// Обновляем функцию показа диалога выбора цели
function showTargetSelectionDialog(abilityName, abilityType) {
    try {
        // Удаляем старые модальные окна, если они есть
        const oldModals = document.querySelectorAll('.modal, .modal-backdrop');
        oldModals.forEach(el => el.remove());
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        const title = abilityType === 'professional' 
            ? `Использование способности: ${abilityName}` 
            : `Использование возможности: ${abilityName}`;
        
        let modalContent = `
            <h3>${title}</h3>
            <p>Выберите цель для использования способности:</p>
            <div class="ability-target-list">
        `;
        
        // Получаем список игроков, которые могут быть целями
        const activePlayers = Array.from(document.querySelectorAll('.other-player-card'))
            .filter(card => !card.classList.contains('kicked'));
        
        if (activePlayers.length === 0) {
            modalContent += `<p>Нет доступных игроков для выбора цели</p>`;
        } else {
            activePlayers.forEach(playerCard => {
                const playerId = playerCard.getAttribute('data-player-id');
                if (!playerId) return;
                
                const playerNameEl = playerCard.querySelector('h4');
                if (!playerNameEl) return;
                
                const playerName = playerNameEl.textContent;
                
                modalContent += `
                    <div class="ability-target-option">
                        <span>${playerName}</span>
                        <button class="ability-btn ability-btn-select" data-player-id="${playerId}">Выбрать</button>
                    </div>
                `;
            });
        }
        
        modalContent += `
            </div>
            <div class="modal-buttons">
                <button class="btn btn-cancel" id="cancel-target-btn">Отмена</button>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        
        // Добавляем модал на страницу
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Показываем модальное окно
        modal.classList.add('show');
        backdrop.classList.add('show');
        
        // Обработчики кнопок
        const cancelBtn = modal.querySelector('#cancel-target-btn');
        
        const handleCancel = () => {
            modal.classList.remove('show');
            backdrop.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                backdrop.remove();
            }, 300);
        };
        
        cancelBtn.addEventListener('click', handleCancel);
        backdrop.addEventListener('click', handleCancel);
        
        // Обработчики выбора цели
        modal.querySelectorAll('.ability-btn-select').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-player-id');
                if (!targetId) return;
                
                socket.emit('useSpecialAbility', {
                    gameId: gameData.currentGameId,
                    playerId: gameData.currentPlayerId,
                    abilityName: abilityName,
                    targetId: targetId
                });
                
                showNotification(`Вы используете способность: ${abilityName}`, 'info');
                handleCancel();
            });
        });
    } catch (error) {
        console.error('Ошибка при отображении диалога выбора цели:', error);
    }
}

// Получение описания профессиональной способности
function getAbilityDescription(abilityName) {
    // Получаем описание из данных игрока
    if (gameData.playerData && gameData.playerData.professionalAbility && gameData.playerData.professionalAbility.name === abilityName) {
        return gameData.playerData.professionalAbility.description;
    }
    
    // Фиксированные описания для известных способностей
    const descriptions = {
        'Медицинский осмотр': 'Узнать здоровье любого игрока',
        'Улучшение бункера': 'Добавить одну дополнительную функцию в бункер',
        'Обучение навыку': 'Дать новое полезное хобби другому игроку',
        'Запас еды': 'Увеличить запасы еды в бункере на 1 год',
        'Полезные книги': 'Взять в бункер 3 полезные книги',
        'Омоложение': 'Уменьшить возраст любого игрока на 5 лет',
        'Терапевтическая сессия': 'Вылечить фобию любого игрока'
    };
    
    return descriptions[abilityName] || `Использовать профессиональную способность "${abilityName}"`;
}

// Обновляем функцию обновления способностей
function updateAbilities(data) {
    try {
        logDebug('Обновление способностей игрока');
        
        // Получаем контейнер для способностей
        const abilitiesContainer = document.getElementById('abilities-container');
        if (!abilitiesContainer) {
            console.error('Контейнер для способностей не найден');
            return;
        }
        
        // Очищаем контейнер
        abilitiesContainer.innerHTML = '';
        
        // Добавляем специальные возможности
        if (data.specialAbilities && data.specialAbilities.length > 0) {
            const specialAbilitiesDiv = document.createElement('div');
            specialAbilitiesDiv.className = 'special-abilities';
            specialAbilitiesDiv.innerHTML = `
                <h3>Специальные возможности</h3>
                <div class="abilities-list">
                    ${data.specialAbilities.map(ability => `
                        <div class="ability-card ${data.usedAbilities && data.usedAbilities.includes(ability) ? 'used' : ''}" 
                             data-ability="${ability}" 
                             data-type="special">
                            <div class="ability-content">
                                <div class="ability-name">${ability}</div>
                                ${data.usedAbilities && data.usedAbilities.includes(ability) 
                                    ? '<div class="ability-status used">Использовано</div>' 
                                    : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            abilitiesContainer.appendChild(specialAbilitiesDiv);
        }
        
        // Добавляем профессиональную способность, если она есть
        if (data.professionalAbility) {
            const profAbilityDiv = document.createElement('div');
            profAbilityDiv.className = 'professional-ability';
            profAbilityDiv.innerHTML = `
                <h3>Профессиональная способность</h3>
                <div class="abilities-list">
                    <div class="ability-card ${data.usedAbilities && data.usedAbilities.includes(data.professionalAbility.name) ? 'used' : ''}" 
                         data-ability="${data.professionalAbility.name}" 
                         data-type="professional">
                        <div class="ability-content">
                            <div class="ability-name">${data.professionalAbility.name}</div>
                            <div class="ability-description">${data.professionalAbility.description}</div>
                            ${data.usedAbilities && data.usedAbilities.includes(data.professionalAbility.name) 
                                ? '<div class="ability-status used">Использовано</div>' 
                                : ''}
                        </div>
                    </div>
                </div>
            `;
            abilitiesContainer.appendChild(profAbilityDiv);
        }
        
        // Добавляем обработчики для всех способностей
        abilitiesContainer.querySelectorAll('.ability-card').forEach(card => {
            // Проверяем, не использована ли уже способность
            if (!card.classList.contains('used')) {
                card.addEventListener('click', function() {
                    const ability = this.getAttribute('data-ability');
                    const abilityType = this.getAttribute('data-type');
                    useAbility(ability, abilityType);
                });
            }
        });
    } catch (error) {
        console.error('Ошибка при обновлении способностей:', error);
    }
}

// Отображение секции голосования
function showVotingSection() {
    try {
        const votingSection = document.getElementById('voting-section');
        const votingPlayersList = document.getElementById('voting-players-list');
        
        // Получаем список активных игроков
        const activePlayers = Array.from(document.querySelectorAll('.other-player-card'))
            .filter(card => !card.classList.contains('kicked'));
        
        if (activePlayers.length === 0) {
            votingPlayersList.innerHTML = '<p class="no-players">Нет игроков для голосования</p>';
        } else {
            votingPlayersList.innerHTML = activePlayers.map(playerCard => {
                const playerId = playerCard.getAttribute('data-player-id');
                const playerName = playerCard.querySelector('h4').textContent;
                return `
                    <div class="voting-option" data-player-id="${playerId}">
                        <div class="voting-option-content">
                            <span class="player-name">${playerName}</span>
                            <span class="vote-count">0</span>
                        </div>
                        <button class="vote-btn" data-player-id="${playerId}">Голосовать</button>
                    </div>
                `;
            }).join('');
        }
        
        // Показываем секцию голосования
        votingSection.classList.remove('hidden');
        
        // Обработчики кнопок голосования
        votingPlayersList.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const playerId = this.getAttribute('data-player-id');
                if (!playerId) return;
                
                // Отправляем голос
                socket.emit('vote', {
                    gameId: gameData.currentGameId,
                    voterId: gameData.currentPlayerId,
                    targetId: playerId
                });
                
                // Блокируем все кнопки голосования
                votingPlayersList.querySelectorAll('.vote-btn').forEach(b => b.disabled = true);
                
                // Показываем уведомление
                showNotification('Ваш голос учтен', 'info');
            });
        });
        
        showNotification('Началось голосование! Выберите, кого исключить из бункера', 'warning');
    } catch (error) {
        console.error('Ошибка при отображении секции голосования:', error);
    }
}

// Обработчик начала голосования
socket.on('startVoting', () => {
    try {
        showVotingSection();
    } catch (error) {
        console.error('Ошибка при запуске голосования:', error);
    }
});

// Обработчик подтверждения голоса
socket.on('voteConfirmed', () => {
    try {
        showNotification('Ваш голос учтен', 'success');
    } catch (error) {
        console.error('Ошибка при подтверждении голоса:', error);
    }
});

// Обработчик результатов голосования
socket.on('votingResults', (data) => {
    try {
        if (!data) {
            console.error('Ошибка: результаты голосования отсутствуют');
            return;
        }
        
        const eliminatedPlayer = data.eliminatedPlayerName || 'Неизвестный игрок';
        
        // Добавляем сообщение в лог
        if (eliminatedPlayer.includes('защищен')) {
            addEventToLog(`Голосование завершено. ${eliminatedPlayer}`);
        } else {
            addEventToLog(`Голосование завершено. ${eliminatedPlayer} исключен из бункера.`);
        }
        
        showNotification(`По результатам голосования: ${eliminatedPlayer}`, 'warning');
        
        // Скрываем секцию голосования
        document.getElementById('voting-section').classList.add('hidden');
        
        // Обновляем состояние игры
        updateGameState();
    } catch (error) {
        console.error('Ошибка при обработке результатов голосования:', error);
    }
});

// Управление таймером
function startTimer(seconds, paused = false) {
    try {
        const timerContainer = document.getElementById('timer-container');
        const timerElement = document.getElementById('timer');
        
        if (!timerContainer || !timerElement) {
            console.error('Элементы таймера не найдены');
            return;
        }
        
        // Останавливаем предыдущий таймер, если он был
        if (gameData.timerInterval) {
            clearInterval(gameData.timerInterval);
        }
        
        timerContainer.classList.remove('hidden');
        gameData.timerValue = seconds;
        gameData.timerPaused = paused;
        
        // Если таймер уже установлен на паузу, просто отображаем его
        if (paused) {
            timerElement.textContent = gameData.timerValue;
            return;
        }
        
        timerElement.textContent = gameData.timerValue;
        timerElement.style.color = '#FFF'; // Сбрасываем цвет
        
        // Запускаем интервал для обновления таймера
        gameData.timerInterval = setInterval(() => {
            if (!gameData.timerPaused) {
                gameData.timerValue--;
                timerElement.textContent = gameData.timerValue;
                
                // Изменение цвета, когда осталось мало времени
                if (gameData.timerValue <= 10) {
                    timerElement.style.color = '#ff5722';
                }
                
                if (gameData.timerValue <= 0) {
                    pauseTimer();
                    addLogMessage('Время вышло!');
                }
            }
        }, 1000);
    } catch (error) {
        console.error('Ошибка при запуске таймера:', error);
    }
}

function pauseTimer() {
    try {
        gameData.timerPaused = true;
        if (gameData.timerInterval) {
            clearInterval(gameData.timerInterval);
        }
    } catch (error) {
        console.error('Ошибка при паузе таймера:', error);
    }
}

function stopTimer() {
    try {
        if (gameData.timerInterval) {
            clearInterval(gameData.timerInterval);
        }
        
        const timerContainer = document.getElementById('timer-container');
        if (timerContainer) {
            timerContainer.classList.add('hidden');
        }
        
        gameData.timerValue = 0;
        gameData.timerPaused = false;
    } catch (error) {
        console.error('Ошибка при остановке таймера:', error);
    }
}

// Отображение результатов игры
function displayGameResults(results) {
    try {
        const survivorsList = document.getElementById('survivors-list');
        const eliminatedList = document.getElementById('eliminated-list');
        
        if (!survivorsList || !eliminatedList) {
            console.error('Элементы списков выживших/исключенных не найдены');
            return;
        }
        
        survivorsList.innerHTML = '';
        eliminatedList.innerHTML = '';
        
        // Проверка наличия данных
        if (!results || !results.survivors || !results.eliminated) {
            console.error('Неверные данные результатов игры:', results);
            
            const noDataLi1 = document.createElement('li');
            noDataLi1.textContent = 'Нет данных о выживших';
            survivorsList.appendChild(noDataLi1);
            
            const noDataLi2 = document.createElement('li');
            noDataLi2.textContent = 'Нет данных об исключенных';
            eliminatedList.appendChild(noDataLi2);
            
            return;
        }
        
        // Отображение выживших
        if (results.survivors.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Никто не выжил';
            survivorsList.appendChild(li);
        } else {
            results.survivors.forEach(player => {
                const li = document.createElement('li');
                const profession = player.characteristics && player.characteristics.profession 
                    ? player.characteristics.profession : 'неизвестная профессия';
                
                li.textContent = `${player.username || 'Неизвестный игрок'} - ${profession}`;
                survivorsList.appendChild(li);
            });
        }
        
        // Отображение исключенных
        if (results.eliminated.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Никто не был исключен';
            eliminatedList.appendChild(li);
        } else {
            results.eliminated.forEach(player => {
                const li = document.createElement('li');
                const profession = player.characteristics && player.characteristics.profession 
                    ? player.characteristics.profession : 'неизвестная профессия';
                
                li.textContent = `${player.username || 'Неизвестный игрок'} - ${profession}`;
                eliminatedList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Ошибка при отображении результатов игры:', error);
    }
}

// Добавление сообщения в лог
function addLogMessage(message) {
    try {
        const logMessages = document.getElementById('log-messages');
        if (!logMessages) {
            console.error('Контейнер лога не найден');
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'log-message';
        messageElement.textContent = message;
        
        logMessages.appendChild(messageElement);
        logMessages.scrollTop = logMessages.scrollHeight;
    } catch (error) {
        console.error('Ошибка при добавлении сообщения в лог:', error);
    }
}

// Получение названия типа карты
function getCardTypeName(cardType) {
    const cardNames = {
        'profession': 'Профессия',
        'health': 'Здоровье',
        'age': 'Возраст',
        'gender': 'Пол',
        'hobby': 'Хобби',
        'phobia': 'Фобия',
        'baggage': 'Багаж',
        'fact': 'Факт',
        'trait': 'Черта характера'
    };
    
    return cardNames[cardType] || cardType;
}

// Обновление информации о бункере
function updateBunkerInfo(data) {
    try {
        if (!data) {
            console.error('Ошибка: данные бункера отсутствуют');
            return;
        }
        
        const bunkerDescription = document.getElementById('bunker-description');
        const bunkerFeatures = document.getElementById('bunker-features');
        
        if (bunkerDescription && data.description) {
            bunkerDescription.textContent = data.description;
        }
        
        if (bunkerFeatures && data.features) {
            bunkerFeatures.innerHTML = '';
            
            data.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                bunkerFeatures.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Ошибка при обновлении информации о бункере:', error);
    }
}

// Воспроизведение звукового эффекта (опционально)
function playSound(type) {
    try {
        const sound = new Audio(`/assets/sounds/${type}.mp3`);
        sound.volume = 0.5;
        sound.play().catch(e => console.log('Не удалось воспроизвести звук', e));
    } catch (e) {
        console.log('Звук не воспроизведен:', e);
    }
}

// Показ уведомления
function showNotification(message, type = 'info') {
    try {
        const notification = document.getElementById('notification');
        if (!notification) {
            console.error('Элемент уведомления не найден');
            return;
        }
        
        // Очищаем все классы типов
        notification.className = 'notification';
        notification.classList.add(type);
        
        notification.textContent = message;
        notification.classList.add('show');
        
        // Скрываем уведомление через 5 секунд
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    } catch (error) {
        console.error('Ошибка при отображении уведомления:', error);
    }
}

// Функция для переключения экранов
function showScreen(screenId) {
    try {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Показываем нужный экран
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        } else {
            console.error(`Экран с ID "${screenId}" не найден`);
        }
    } catch (error) {
        console.error('Ошибка при переключении экранов:', error);
    }
}

// Обработчики событий сокетов
socket.on('gameStarted', (data) => {
    logDebug('Игра начата:', data);
    
    try {
        if (!data) {
            console.error('Ошибка: данные игры отсутствуют');
            showNotification('Ошибка при запуске игры', 'error');
            return;
        }
        
        // Обновляем глобальные данные
        window.currentGameId = data.gameId;
        window.currentPlayerId = data.id;
        window.isHost = data.isHost;
        
        logDebug('Установлены глобальные переменные:', {
            currentGameId: window.currentGameId,
            currentPlayerId: window.currentPlayerId,
            isHost: window.isHost
        });
        
        // Инициализируем игровой экран
        initGameScreen(data);
        
        // Показываем уведомление
        showNotification('Игра началась!', 'success');
    } catch (error) {
        console.error('Ошибка при запуске игры:', error);
        showNotification('Произошла ошибка при запуске игры', 'error');
    }
});

socket.on('cardRevealed', (data) => {
    console.log('=== ПОЛУЧЕНО СОБЫТИЕ РАСКРЫТИЯ КАРТЫ ===');
    console.log('Данные:', data);
    
    try {
        if (!data.success) {
            console.error('Ошибка при раскрытии карты:', data.message);
            showNotification(data.message || 'Ошибка при раскрытии карты', 'error');
            return;
        }
        
        const { username, cardType, value } = data.data;
        const cardName = getCardTypeName(cardType);
        
        console.log('Обновление интерфейса:', {
            username,
            cardType,
            value,
            cardName
        });
        
        // Обновляем карточку игрока в интерфейсе
        updateOtherPlayerCard(data.data);
        
        // Показываем уведомление
        showRevealNotification(
            'Характеристика раскрыта!',
            `${username} раскрыл ${cardName.toLowerCase()}: ${value}`
        );
        
        // Добавляем в лог
        addEventToLog(`${username} раскрыл характеристику: ${cardName} - ${value}`);
        
        // Воспроизводим звук
        playSound('reveal');
        
        // Обновляем состояние игры
        updateGameState();
        
        console.log('=== КАРТА УСПЕШНО РАСКРЫТА ===');
    } catch (error) {
        console.error('Ошибка при обработке раскрытия карты:', error);
        showNotification('Произошла ошибка при обработке раскрытия карты', 'error');
    }
});

socket.on('characteristicChanged', (data) => {
    try {
        // Если изменение касается текущего игрока, обновляем его карточку
        if (data.playerId === gameData.currentPlayerId) {
            const cardElement = document.querySelector(`.characteristic-item[data-type="${data.characteristicType}"]`);
            if (cardElement) {
                const cardContent = cardElement.querySelector('.card-content');
                if (cardContent) {
                    cardContent.textContent = data.newValue;
                    
                    // Добавляем анимацию
                    cardContent.style.animation = "highlight 1.5s";
                    setTimeout(() => {
                        cardContent.style.animation = "";
                    }, 1500);
                }
            }
        }
        
        // Обновляем у других игроков, если характеристика уже была раскрыта
        updateOtherPlayerCard({
            playerId: data.playerId,
            username: data.playerName,
            cardType: data.characteristicType,
            value: data.newValue
        });
        
        // Сообщение в лог
        addLogMessage(`Характеристика ${getCardTypeName(data.characteristicType)} игрока ${data.playerName || 'Игрок'} изменена на: ${data.newValue}`);
    } catch (error) {
        console.error('Ошибка при обработке изменения характеристики:', error);
    }
});

socket.on('playerDataUpdated', (data) => {
    try {
        // Обновляем данные игрока
        gameData.playerData = data;
        
        if (!data) {
            console.error('Ошибка: полученные данные игрока пусты');
            return;
        }
        
        // Обновляем карточки характеристик
        if (data.characteristics) {
            for (const cardType in data.characteristics) {
                const cardElement = document.querySelector(`.characteristic-item[data-type="${cardType}"]`);
                if (cardElement) {
                    const cardContent = cardElement.querySelector('.card-content');
                    if (cardContent) {
                        cardContent.textContent = data.characteristics[cardType];
                    }
                }
            }
        }
        
        // Обновляем специальные способности
        updateAbilities(data);
    } catch (error) {
        console.error('Ошибка при обновлении данных игрока:', error);
    }
});

socket.on('bunkerUpdated', (data) => {
    try {
        updateBunkerInfo(data);
        addLogMessage('Бункер был улучшен!');
    } catch (error) {
        console.error('Ошибка при обновлении бункера:', error);
    }
});

socket.on('nextRound', (data) => {
    try {
        if (!data) {
            console.error('Ошибка: данные о раунде отсутствуют');
            return;
        }
        
        // Обновляем номер раунда
        const roundEl = document.getElementById('current-round');
        if (roundEl) roundEl.textContent = data.round;
        
        // Добавляем сообщение в лог
        addLogMessage(`Начинается раунд ${data.round} из ${data.maxRounds}`);
        
        // Показываем уведомление
        showNotification(`Раунд ${data.round}`, 'info');
    } catch (error) {
        console.error('Ошибка при переходе к следующему раунду:', error);
    }
});

socket.on('gameOver', (results) => {
    try {
        // Отображаем экран результатов
        showScreen('results-screen');
        
        // Заполняем результаты
        displayGameResults(results);
        
        // Удаляем данные сессии
        localStorage.removeItem('gameSession');
        
        showNotification('Игра завершена!', 'success');
    } catch (error) {
        console.error('Ошибка при завершении игры:', error);
    }
});

socket.on('specialAbilityUsed', (data) => {
    try {
        if (!data) {
            console.error('Ошибка: данные об использовании способности отсутствуют');
            return;
        }
        
        // Добавляем сообщение в лог
        addEventToLog(`${data.playerName || 'Игрок'} использовал способность: ${data.abilityName}`);
        
        if (data.result && data.result.message) {
            addEventToLog(data.result.message);
        }
        
        // Если это наша способность, обновляем список использованных
        if (data.playerId === gameData.currentPlayerId) {
            // Добавляем способность в список использованных
            if (!gameData.playerData.usedAbilities) {
                gameData.playerData.usedAbilities = [];
            }
            if (!gameData.playerData.usedAbilities.includes(data.abilityName)) {
                gameData.playerData.usedAbilities.push(data.abilityName);
            }
            
            // Обновляем интерфейс только для использованной способности
            const abilityCard = document.querySelector(`.ability-card[data-ability="${data.abilityName}"]`);
            if (abilityCard) {
                abilityCard.classList.add('used');
                
                // Проверяем, есть ли уже статус "Использовано"
                if (!abilityCard.querySelector('.ability-status.used')) {
                const statusDiv = document.createElement('div');
                statusDiv.className = 'ability-status used';
                statusDiv.textContent = 'Использовано';
                abilityCard.querySelector('.ability-content').appendChild(statusDiv);
                }
                
                // Удаляем обработчик клика только с этой карты
                const newCard = abilityCard.cloneNode(true);
                abilityCard.parentNode.replaceChild(newCard, abilityCard);
            }
        }
        
        // Если способность раскрыла характеристику, обновляем интерфейс
        if (data.result && data.result.revealedData) {
            updateOtherPlayerCard(data.result.revealedData);
        }
        
        // Если способность как-то изменила бункер
        if (data.result && data.result.bunkerUpdated) {
            updateBunkerInfo(data.result.bunkerUpdated);
        }
        
        // Воспроизводим звуковой эффект
        playSound('ability');
    } catch (error) {
        console.error('Ошибка при обработке использованной способности:', error);
    }
});

socket.on('playerDisconnected', (data) => {
    try {
        if (!data) return;
        
        showNotification(`${data.username || 'Игрок'} отключился`, 'warning');
        
        // Отмечаем игрока как отключенного в интерфейсе
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${data.playerId}"]`);
        if (playerCard) {
            playerCard.classList.add('disconnected');
            const playerName = playerCard.querySelector('h4');
            if (playerName && !playerName.innerHTML.includes('(Отключен)')) {
                playerName.innerHTML += ' <span class="disconnected-label">(Отключен)</span>';
            }
        }
        
        addLogMessage(`${data.username || 'Игрок'} отключился от игры`);
    } catch (error) {
        console.error('Ошибка при обработке отключения игрока:', error);
    }
});

socket.on('playerReconnected', (data) => {
    try {
        if (!data) return;
        
        showNotification(`${data.username || 'Игрок'} переподключился`, 'success');
        
        // Убираем отметку об отключении
        const playerCard = document.querySelector(`.other-player-card[data-player-id="${data.playerId}"]`);
        if (playerCard) {
            playerCard.classList.remove('disconnected');
            const playerName = playerCard.querySelector('h4');
            if (playerName) {
                playerName.innerHTML = data.username || 'Игрок';
            }
        }
        
        addLogMessage(`${data.username || 'Игрок'} вернулся в игру`);
    } catch (error) {
        console.error('Ошибка при обработке переподключения игрока:', error);
    }
});

socket.on('timerAction', function(data) {
    try {
        if (!data) return;
        
        const { action, seconds } = data;
        
        switch (action) {
            case 'start':
                startTimer(seconds);
                break;
            case 'pause':
                pauseTimer();
                break;
            case 'stop':
                stopTimer();
                break;
            case 'set':
                startTimer(seconds, true); // Устанавливаем с паузой
                break;
        }
    } catch (error) {
        console.error('Ошибка при обработке действия таймера:', error);
    }
});

// Проверяем, установлены ли обработчики для исключенных игроков
if (!window.handlePlayerKickedAdded) {
    socket.on('playerKicked', handlePlayerKicked);
    socket.on('playerReturnedToBunker', handlePlayerReturnedToBunker);
    window.handlePlayerKickedAdded = true;
}

// Обработчик для кнопки возврата из результатов в меню
document.addEventListener('DOMContentLoaded', () => {
    try {
        const backBtn = document.getElementById('back-to-lobby-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.reload(); // Перезагружаем страницу для возврата в меню
            });
        }
        
        logDebug('DOM полностью загружен и готов');
    } catch (error) {
        console.error('Ошибка при инициализации обработчиков DOM:', error);
    }
});

// Функция для добавления события в лог
function addEventToLog(event) {
    const logList = document.getElementById('event-log-list');
    if (!logList) return;

    const time = new Date().toLocaleTimeString();
    const li = document.createElement('li');
    li.className = 'event-log-item';
    li.innerHTML = `<span class="time">[${time}]</span> ${event}`;
    
    logList.insertBefore(li, logList.firstChild);
    
    // Ограничиваем количество событий в логе
    while (logList.children.length > 50) {
        logList.removeChild(logList.lastChild);
    }
}

// Функция обновления состояния игры
function updateGameState() {
    try {
        // Обновляем список игроков
        updatePlayersList();
        
        // Обновляем информацию о бункере
        if (gameData.currentGameId) {
            socket.emit('getBunkerInfo', { gameId: gameData.currentGameId });
        }
    } catch (error) {
        console.error('Ошибка при обновлении состояния игры:', error);
    }
}

// Инициализация интерфейса наблюдателя
function initSpectatorInterface(data) {
    logDebug('Инициализация интерфейса наблюдателя', data);
    
    try {
        // Скрываем элементы управления и панель действий
        const actionPanelEl = document.getElementById('action-panel');
        if (actionPanelEl) actionPanelEl.classList.add('hidden');
        
        const abilitiesPanelEl = document.getElementById('abilities-panel');
        if (abilitiesPanelEl) abilitiesPanelEl.classList.add('hidden');
        
        const gameControlBtn = document.getElementById('game-control-btn');
        if (gameControlBtn) gameControlBtn.classList.add('hidden');
        
        // Скрываем интерфейс голосования
        const votingPanelEl = document.getElementById('voting-section');
        if (votingPanelEl) votingPanelEl.classList.add('hidden');
        
        // Скрываем свои карточки
        const characteristicsBoxEl = document.querySelector('.characteristics-box');
        if (characteristicsBoxEl) characteristicsBoxEl.classList.add('hidden');
        
        // Добавляем заголовок "Режим наблюдателя"
        const spectatorHeader = document.createElement('div');
        spectatorHeader.className = 'spectator-header';
        spectatorHeader.innerHTML = '<h2>Режим наблюдателя</h2><p>Вы видите всю информацию об игре, но не участвуете в ней</p>';
        
        // Добавляем контейнер для карточек игроков
        const spectatorPlayersContainer = document.createElement('div');
        spectatorPlayersContainer.className = 'spectator-players-container';
        spectatorPlayersContainer.id = 'spectator-players-container';
        
        // Находим место для вставки элементов
        const gameContentEl = document.querySelector('.game-content');
        if (gameContentEl) {
            gameContentEl.innerHTML = '';
            gameContentEl.appendChild(spectatorHeader);
            gameContentEl.appendChild(spectatorPlayersContainer);
            
            // Отображаем всех игроков
            if (data.players && data.players.length > 0) {
                data.players.forEach(player => {
                    createSpectatorPlayerCard(player);
                });
            }
        }
        
        logDebug('Интерфейс наблюдателя инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации интерфейса наблюдателя:', error);
        showNotification('Ошибка инициализации интерфейса наблюдателя', 'error');
    }
}

// Создание карточки игрока для наблюдателя
function createSpectatorPlayerCard(player) {
    logDebug('Создание карточки игрока для наблюдателя', player);
    
    try {
        const container = document.getElementById('spectator-players-container');
        if (!container) return;
        
        // Создаем карточку игрока
        const playerCard = document.createElement('div');
        playerCard.className = 'spectator-player-card';
        playerCard.dataset.playerId = player.id;
        
        // Если игрок выбыл, добавляем класс
        if (player.isOut) {
            playerCard.classList.add('player-out');
        }
        
        // Заголовок с именем игрока
        const playerHeader = document.createElement('div');
        playerHeader.className = 'spectator-player-header';
        playerHeader.innerHTML = `<h3>${player.username}</h3>`;
        if (player.isHost) {
            playerHeader.innerHTML += '<span class="host-badge">Хост</span>';
        }
        
        // Контейнер для характеристик
        const characteristicsContainer = document.createElement('div');
        characteristicsContainer.className = 'spectator-player-characteristics';
        
        // Добавляем все характеристики
        if (player.characteristics) {
            const charTypes = ['profession', 'health', 'age', 'gender', 'hobby', 'phobia', 'baggage', 'fact', 'trait'];
            
            charTypes.forEach(charType => {
                const charValue = player.characteristics[charType];
                
                const charItem = document.createElement('div');
                charItem.className = 'spectator-characteristic-item';
                charItem.dataset.type = charType;
                
                const header = document.createElement('div');
                header.className = 'card-header';
                header.textContent = getCardTypeName(charType);
                
                const content = document.createElement('div');
                content.className = 'card-content';
                content.textContent = charValue || 'Нет данных';
                
                charItem.appendChild(header);
                charItem.appendChild(content);
                characteristicsContainer.appendChild(charItem);
            });
        }
        
        // Собираем карточку
        playerCard.appendChild(playerHeader);
        playerCard.appendChild(characteristicsContainer);
        container.appendChild(playerCard);
        
        logDebug('Карточка игрока для наблюдателя создана');
    } catch (error) {
        console.error('Ошибка создания карточки игрока для наблюдателя:', error);
    }
}

// Обновление интерфейса наблюдателя при получении новых данных
socket.on('updateSpectatorView', (data) => {
    logDebug('Получены данные для обновления интерфейса наблюдателя', data);
    
    try {
        if (window.isSpectator) {
            // Обновляем данные игроков
            if (data.players && data.players.length > 0) {
                const container = document.getElementById('spectator-players-container');
                if (container) {
                    container.innerHTML = '';
                    data.players.forEach(player => {
                        createSpectatorPlayerCard(player);
                    });
                }
            }
            
            // Обновляем информацию о катастрофе если она изменилась
            if (data.catastrophe) {
                const titleEl = document.getElementById('catastrophe-title');
                const descEl = document.getElementById('catastrophe-description');
                
                if (titleEl) titleEl.textContent = data.catastrophe.title;
                if (descEl) descEl.textContent = data.catastrophe.description;
            }
            
            // Обновляем информацию о бункере если она изменилась
            if (data.bunker) {
                updateBunkerInfo(data.bunker);
            }
            
            // Обновляем номер раунда
            if (data.currentRound) {
                const roundEl = document.getElementById('current-round');
                if (roundEl) roundEl.textContent = data.currentRound;
            }
        }
    } catch (error) {
        console.error('Ошибка обновления интерфейса наблюдателя:', error);
    }
});

// Инициализация экрана для наблюдателя
function initObserverScreen(data) {
    try {
        // Устанавливаем ID игры
        document.getElementById('observer-game-id').textContent = data.gameId;
        
        // Обновляем информацию о катастрофе и бункере
        updateObserverBunkerInfo(data);
        
        // Обновляем таблицу игроков
        updateObserverPlayersTable(data.players);
        
        // Показываем экран наблюдателя
        showScreen('observer-screen');
        
        // Добавляем обработчик для кнопки выхода
        document.getElementById('leave-observer-btn').addEventListener('click', function() {
            socket.emit('leaveGame');
            showScreen('login-screen');
        });
    } catch (error) {
        console.error('Ошибка при инициализации экрана наблюдателя:', error);
    }
}

// Обновление информации о бункере и катастрофе для наблюдателя
function updateObserverBunkerInfo(data) {
    try {
        if (data.catastrophe) {
            document.getElementById('observer-catastrophe-title').textContent = data.catastrophe.title || 'Неизвестная катастрофа';
            document.getElementById('observer-catastrophe-description').textContent = data.catastrophe.description || 'Описание отсутствует';
        }
        
        if (data.bunker) {
            document.getElementById('observer-bunker-description').textContent = data.bunker.description || 'Обычный бункер';
            
            const featuresList = document.getElementById('observer-bunker-features');
            featuresList.innerHTML = '';
            
            if (data.bunker.features && data.bunker.features.length > 0) {
                data.bunker.features.forEach(feature => {
                    const li = document.createElement('li');
                    li.textContent = feature;
                    featuresList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'Нет особенностей';
                featuresList.appendChild(li);
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении информации для наблюдателя:', error);
    }
}

// Обновление таблицы игроков для наблюдателя
function updateObserverPlayersTable(players) {
    try {
        const tableBody = document.getElementById('observer-players-list');
        tableBody.innerHTML = '';
        
        if (!players || players.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 10;
            cell.textContent = 'Нет игроков';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        
        // Характеристики, которые мы хотим отобразить
        const characteristics = ['gender', 'age', 'profession', 'health', 'hobby', 'phobia', 'baggage', 'fact', 'trait'];
        
        players.forEach(player => {
            if (player.isObserver) return; // Пропускаем наблюдателей
            
            const row = document.createElement('tr');
            if (player.isKicked) row.classList.add('kicked');
            
            // Имя игрока
            const nameCell = document.createElement('td');
            nameCell.className = 'player-name';
            nameCell.textContent = player.name + (player.isKicked ? ' (исключен)' : '');
            row.appendChild(nameCell);
            
            // Характеристики
            characteristics.forEach(charType => {
                const cell = document.createElement('td');
                
                if (player.revealedCards && player.revealedCards.includes(charType)) {
                    // Если карта раскрыта, показываем ее значение
                    cell.textContent = player.characteristics[charType] || '?';
                } else {
                    // Иначе показываем, что она скрыта
                    cell.textContent = '***';
                    cell.style.color = '#666';
                }
                
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при обновлении таблицы игроков для наблюдателя:', error);
    }
}

// Обработчик события обновления состояния игры (для наблюдателя)
socket.on('observerGameUpdate', (data) => {
    try {
        if (!data) {
            console.error('Ошибка: данные обновления игры отсутствуют');
            return;
        }
        
        // Обновляем информацию о бункере и катастрофе
        updateObserverBunkerInfo(data);
        
        // Обновляем таблицу игроков
        updateObserverPlayersTable(data.players);
    } catch (error) {
        console.error('Ошибка при обновлении данных для наблюдателя:', error);
    }
});

// Обработчик успешного входа в игру
socket.on('joinGameSuccess', function(data) {
    console.log('Успешное подключение к игре:', data);
    
    // Устанавливаем глобальные переменные
    gameData.currentGameId = data.gameId;
    gameData.currentPlayerId = data.playerId;
    gameData.isHost = data.isHost;
    
    // Проверяем, наблюдатель ли игрок
    if (data.isObserver) {
        // Инициализируем экран наблюдателя
        initObserverScreen(data);
    } else if (data.gameStarted) {
        // Если игра уже идет, инициализируем игровой экран
        initGameScreen(data);
    } else {
        // Иначе показываем экран лобби
        initLobby(data);
    }
});
