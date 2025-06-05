const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const BunkerGame = require('./bunkerGame');

const app = express();
const server = http.createServer(app);

// Настройка CORS
const io = socketIo(server, {
    cors: {
        origin: "*", // В продакшене замените на ваш домен
        methods: ["GET", "POST"],
        credentials: true
    },
    // Настройки для работы за прокси
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Настройка порта
const PORT = process.env.PORT || 3000;

// Настройка обслуживания статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Добавляем явный маршрут для корневого пути
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка всех остальных маршрутов (для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Хранилище активных игр
const games = new Map();
const playerConnections = new Map();

// Обработка WebSocket соединений
io.on('connection', (socket) => {
    console.log(`Новое соединение: ${socket.id}`);

    // Восстановление сессии
    socket.on('restoreSession', async (data) => {
        try {
            console.log('=== ВОССТАНОВЛЕНИЕ СЕССИИ ===');
            const { gameId, playerId, username } = data;
            console.log('Данные для восстановления:', { gameId, playerId, username });
            console.log('Текущие активные игры:', Array.from(games.keys()));
            
            // Проверяем существование игры
            if (!games.has(gameId)) {
                console.log(`Игра ${gameId} не найдена, создаем новую`);
                // Создаем новую игру
                const game = new BunkerGame(gameId);
                
                // Добавляем игрока как хоста
                const newPlayerId = game.addPlayer(username, socket.id, true);
                playerConnections.set(socket.id, { gameId, playerId: newPlayerId });
                
                // Сохраняем игру в Map
                games.set(gameId, game);
                
                console.log('Новая игра создана при восстановлении:', {
                    gameId,
                    newPlayerId,
                    gamesSize: games.size,
                    gamesKeys: Array.from(games.keys())
                });
                
                // Присоединяем к комнате
                socket.join(gameId);
                
                // Отправляем данные игроку
                socket.emit('gameCreated', {
                    gameId,
                    playerId: newPlayerId,
                    isHost: true
                });
                
                socket.emit('playersList', { players: game.getPlayersInfo() });
                return;
            }
            
            const game = games.get(gameId);
            console.log(`Игра ${gameId} найдена, проверяем игрока ${playerId}`);
            console.log('Состояние игры:', {
                gameId: game.gameId,
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username,
                    socketId: p.socketId
                }))
            });
            
            const player = game.getPlayer(playerId);
            
            if (!player) {
                console.log(`Игрок ${playerId} не найден, добавляем нового`);
                // Добавляем нового игрока
                const newPlayerId = game.addPlayer(username, socket.id, false);
                playerConnections.set(socket.id, { gameId, playerId: newPlayerId });
                
                // Обновляем игру в Map
                games.set(gameId, game);
                
                console.log('Новый игрок добавлен:', {
                    gameId,
                    newPlayerId,
                    gamesSize: games.size,
                    gamesKeys: Array.from(games.keys())
                });
                
                // Присоединяем к комнате
                socket.join(gameId);
                
                // Отправляем данные игроку
                socket.emit('gameJoined', {
                    gameId,
                    playerId: newPlayerId,
                    isHost: false
                });
                
                socket.emit('playersList', { players: game.getPlayersInfo() });
                return;
            }
            
            // Обновляем socketId игрока
            player.socketId = socket.id;
            player.disconnected = false;
            playerConnections.set(socket.id, { gameId, playerId });
            
            // Если был установлен таймер отключения, отменяем его
            if (player.disconnectTimer) {
                clearTimeout(player.disconnectTimer);
                delete player.disconnectTimer;
            }
            
            // Обновляем игру в Map
            games.set(gameId, game);
            
            // Присоединяем к комнате игры
            socket.join(gameId);
            
            // Отправляем данные в зависимости от состояния игры
            if (game.isStarted) {
                socket.emit('gameStarted', {
                    catastrophe: game.catastrophe,
                    bunker: game.bunker,
                    players: game.getPlayersPublicData(),
                    currentRound: game.currentRound,
                    isSpectator: true
                });
                socket.emit('reconnectStatus', { success: true });
                
                // Уведомляем других
                socket.to(gameId).emit('playerReconnected', {
                    playerId: playerId,
                    username: player.username
                });
            } else {
                socket.emit('gameJoined', {
                    gameId,
                    playerId,
                    isHost: player.isHost
                });
                
                socket.emit('playersList', { players: game.getPlayersInfo() });
            }
            
            console.log(`Сессия успешно восстановлена для ${username} в игре ${gameId}`);
            console.log('Финальное состояние игры:', {
                gameId: game.gameId,
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username,
                    socketId: p.socketId
                }))
            });
            console.log('=== СЕССИЯ УСПЕШНО ВОССТАНОВЛЕНА ===');
        } catch (error) {
            console.error('Ошибка восстановления сессии:', error);
            socket.emit('error', { message: 'Ошибка восстановления сессии' });
        }
    });

    // Создание новой игры
    socket.on('createGame', (username) => {
        try {
            console.log('=== СОЗДАНИЕ НОВОЙ ИГРЫ ===');
            console.log('Имя игрока:', username);
            
            // Генерируем уникальный ID игры
            const gameId = generateGameId();
            console.log('Сгенерирован ID игры:', gameId);
            
            // Создаем новую игру
            const game = new BunkerGame(gameId);
            
            // Добавляем первого игрока (хост)
            const playerId = game.addPlayer(username, socket.id, true);
            console.log('Добавлен хост:', { playerId, username });
            
            // Сохраняем игру и связь игрока с игрой
            games.set(gameId, game);
            playerConnections.set(socket.id, { gameId, playerId });
            
            console.log('Игра сохранена:', {
                gameId,
                playerId,
                gamesSize: games.size,
                gamesKeys: Array.from(games.keys())
            });
            
            // Присоединяем сокет к комнате
            socket.join(gameId);
            
            // Отправляем информацию игроку
            socket.emit('gameCreated', {
                gameId,
                playerId,
                isHost: true
            });
            
            // Логируем список игроков
            const playersList = game.getPlayersInfo();
            console.log('Создана игра. Текущий список игроков:', playersList);
            
            // Отправляем список игроков в комнату
            io.in(gameId).emit('playersList', { 
                players: playersList
            });
            
            console.log('=== ИГРА УСПЕШНО СОЗДАНА ===');
        } catch (error) {
            console.error('Ошибка создания игры:', error);
            socket.emit('error', { message: 'Не удалось создать игру' });
        }
    });
    
    // Тестовая игра с ботами
    socket.on('startTestGame', (username) => {
        try {
            // Генерируем уникальный ID игры
            const gameId = generateGameId();
            
            // Создаем новую игру
            const game = new BunkerGame(gameId);
            
            // Добавляем первого игрока (хост)
            const playerId = game.addPlayer(username, socket.id, true);
            
            // Добавляем ботов
            game.addBots(3);
            
            // Сохраняем игру и связь игрока с игрой
            games.set(gameId, game);
            playerConnections.set(socket.id, { gameId, playerId });
            
            // Присоединяем сокет к комнате
            socket.join(gameId);
            
            // Отправляем информацию игроку
            socket.emit('gameCreated', {
                gameId,
                playerId,
                isHost: true
            });
            
            socket.emit('playersList', { 
                players: game.getPlayersInfo() 
            });
            
            console.log(`Тестовая игра ${gameId} создана с ботами`);
        } catch (error) {
            console.error('Ошибка создания тестовой игры:', error);
            socket.emit('error', { message: 'Не удалось создать тестовую игру' });
        }
    });

    // Присоединение к существующей игре
    socket.on('joinGame', (data) => {
        try {
            console.log('=== ЗАПРОС НА ПРИСОЕДИНЕНИЕ К ИГРЕ ===');
            const { gameId, playerName, isObserver } = data;
            console.log('Данные запроса:', { gameId, playerName, isObserver });
            
            // Проверяем существование игры
            if (!games.has(gameId)) {
                console.log(`Игра ${gameId} не найдена`);
                socket.emit('error', { message: 'Игра не найдена' });
                return;
            }
            
            const game = games.get(gameId);
            
            // Проверяем количество игроков
            if (!isObserver && game.players.length >= game.maxPlayers) {
                console.log(`Игра ${gameId} заполнена`);
                socket.emit('error', { message: 'Игра заполнена' });
                return;
            }
            
            // Проверяем, началась ли игра
            if (!isObserver && game.isStarted) {
                console.log(`Игра ${gameId} уже началась`);
                socket.emit('error', { message: 'Игра уже началась' });
                return;
            }
            
            // Добавляем игрока или наблюдателя
            let playerId;
            if (isObserver) {
                playerId = game.addSpectator(playerName, socket.id);
                console.log(`Добавлен наблюдатель: ${playerName} (${playerId})`);
            } else {
                playerId = game.addPlayer(playerName, socket.id);
                console.log(`Добавлен игрок: ${playerName} (${playerId})`);
            }
            
            // Сохраняем связь сокета с игрой
            playerConnections.set(socket.id, { gameId, playerId, isObserver, username: playerName });
            
            // Присоединяем к комнате
            socket.join(gameId);
            
            // Отправляем данные игроку
            socket.emit('gameJoined', {
                gameId,
                playerId,
                isHost: isObserver ? false : game.getPlayer(playerId)?.isHost || false,
                isSpectator: isObserver,
                username: playerName
            });
            
            // Логируем список игроков
            const playersList = game.getPlayersInfo();
            console.log('Текущий список игроков:', playersList);
            
            // Отправляем список игроков ВСЕМ в комнате, включая присоединившегося игрока
            io.in(gameId).emit('playersList', { 
                players: playersList,
                spectators: game.getSpectatorsInfo ? game.getSpectatorsInfo() : []
            });
            
            if (isObserver && game.isStarted) {
                // Если игра уже началась, отправляем наблюдателю текущее состояние игры
                socket.emit('gameStarted', {
                    catastrophe: game.catastrophe,
                    bunker: game.bunker,
                    players: game.getPlayersPublicData(),
                    currentRound: game.currentRound,
                    isSpectator: true
                });
            }
            
            // Уведомляем всех о новом игроке/наблюдателе
            console.log('Отправляем уведомление о новом игроке:', { playerName, isObserver });
            
            // Проверяем, что имя пользователя определено
            const safeUsername = playerName || 'Игрок';
            
            socket.to(gameId).emit('playerJoined', { 
                username: safeUsername,
                isSpectator: isObserver
            });
            
            console.log(`Игрок успешно присоединился к игре ${gameId}`);
            console.log('=== УСПЕШНОЕ ПРИСОЕДИНЕНИЕ К ИГРЕ ===');
        } catch (error) {
            console.error('Ошибка при присоединении к игре:', error);
            socket.emit('error', { message: 'Ошибка при присоединении к игре' });
        }
    });

    // Начало игры
    socket.on('startGame', (gameId) => {
        try {
            console.log('=== ЗАПРОС НА НАЧАЛО ИГРЫ ===');
            console.log(`ID игры: ${gameId}`);
            
            // Проверяем наличие игры
            if (!games.has(gameId)) {
                console.log(`Игра ${gameId} не найдена`);
                socket.emit('error', { message: 'Игра не найдена' });
                return;
            }
            
            const game = games.get(gameId);
            
            // Проверяем количество игроков
            if (game.players.length < game.minPlayers) {
                console.log(`Недостаточно игроков (${game.players.length}/${game.minPlayers})`);
                socket.emit('error', { message: `Для начала игры нужно минимум ${game.minPlayers} игроков` });
                return;
            }
            
            // Получаем данные о соединении
            const connection = playerConnections.get(socket.id);
            if (!connection) {
                console.log(`Соединение для ${socket.id} не найдено`);
                socket.emit('error', { message: 'Ошибка соединения' });
                return;
            }
            
            const player = game.getPlayer(connection.playerId);
            
            // Проверяем, является ли игрок хостом
            if (!player || !player.isHost) {
                console.log(`Игрок не имеет прав хоста: ${connection.playerId}`);
                socket.emit('error', { message: 'У вас нет прав на начало игры' });
                return;
            }
            
            // Начинаем игру
            game.startGame();
            console.log(`Игра ${gameId} началась`);
            
            // Отправляем данные всем игрокам
            game.players.forEach(player => {
                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) {
                    playerSocket.emit('gameStarted', game.getPlayerData(player.id));
                }
            });
            
            // Отправляем данные наблюдателям
            game.spectators.forEach(spectator => {
                const spectatorSocket = io.sockets.sockets.get(spectator.socketId);
                if (spectatorSocket) {
                    spectatorSocket.emit('gameStarted', {
                        catastrophe: game.catastrophe,
                        bunker: game.bunker,
                        players: game.getPlayersPublicData(),
                        currentRound: game.currentRound,
                        isSpectator: true
                    });
                }
            });
            
            console.log('=== ИГРА УСПЕШНО ЗАПУЩЕНА ===');
        } catch (error) {
            console.error('Ошибка при начале игры:', error);
            socket.emit('error', { message: 'Ошибка при начале игры' });
        }
    });

    // Раскрытие карты
    socket.on('revealCard', (data) => {
        try {
            console.log('=== НАЧАЛО РАСКРЫТИЯ КАРТЫ ===');
            console.log('Получены данные:', data);
            
            // Проверяем наличие всех необходимых данных
            if (!data || !data.gameId || !data.playerId || !data.cardType) {
                console.error('Отсутствуют необходимые данные:', data);
                return socket.emit('cardRevealed', {
                    success: false,
                    message: 'Отсутствуют необходимые данные'
                });
            }

            const { gameId, playerId, cardType } = data;
            
            // Проверяем существование игры
            if (!games.has(gameId)) {
                console.error('Игра не найдена:', gameId);
                return socket.emit('cardRevealed', {
                    success: false,
                    message: 'Игра не найдена'
                });
            }

            const game = games.get(gameId);
            console.log('Игра найдена:', {
                gameId: game.gameId,
                players: game.players.map(p => ({
                    id: p.id,
                    username: p.username
                }))
            });

            // Проверяем существование игрока
            const player = game.getPlayer(playerId);
            if (!player) {
                console.error('Игрок не найден:', playerId);
                return socket.emit('cardRevealed', {
                    success: false,
                    message: 'Игрок не найден'
                });
            }

            console.log('Игрок найден:', {
                id: player.id,
                username: player.username,
                characteristics: player.characteristics
            });

            // Проверяем, не раскрыта ли уже карта
            if (player.revealedCards && player.revealedCards.includes(cardType)) {
                console.error('Карта уже раскрыта:', cardType);
                return socket.emit('cardRevealed', {
                    success: false,
                    message: 'Эта карта уже раскрыта'
                });
            }

            // Проверяем наличие характеристики
            if (!player.characteristics || !player.characteristics[cardType]) {
                console.error('Характеристика не найдена:', cardType);
                return socket.emit('cardRevealed', {
                    success: false,
                    message: 'Характеристика не найдена'
                });
            }

            // Создаем массив раскрытых карт, если его нет
            if (!player.revealedCards) {
                player.revealedCards = [];
            }

            // Добавляем карту в список раскрытых
            player.revealedCards.push(cardType);

            // Подготавливаем данные для отправки
            const revealData = {
                playerId: player.id,
                username: player.username,
                cardType: cardType,
                value: player.characteristics[cardType]
            };

            console.log('Отправляем данные о раскрытии:', revealData);

            // Отправляем результат всем игрокам
            io.to(gameId).emit('cardRevealed', {
                success: true,
                data: revealData
            });

            console.log('=== КАРТА УСПЕШНО РАСКРЫТА ===');
        } catch (error) {
            console.error('Ошибка при раскрытии карты:', error);
            socket.emit('cardRevealed', {
                success: false,
                message: 'Произошла ошибка при раскрытии карты'
            });
        }
    });

    // Управление хостом
    socket.on('hostAction', (data) => {
        try {
            const { gameId, action } = data;
            
            if (!games.has(gameId)) {
                return socket.emit('error', { message: 'Игра не найдена' });
            }
            
            const game = games.get(gameId);
            const connection = playerConnections.get(socket.id);
            
            if (!connection) {
                return socket.emit('error', { message: 'Ошибка соединения' });
            }
            
            const player = game.getPlayer(connection.playerId);
            
            // Проверяем права хоста
            if (!player || !player.isHost) {
                return socket.emit('error', { message: 'Только хост может выполнять это действие' });
            }
            
            // Обрабатываем разные действия
            switch (action) {
                case 'startVoting':
                    io.to(gameId).emit('startVoting');
                    console.log(`Хост запустил голосование в игре ${gameId}`);
                    break;
                    
                case 'startTimer':
                    const startSeconds = data.seconds || 60;
                    io.to(gameId).emit('timerAction', { 
                        action: 'start', 
                        seconds: startSeconds 
                    });
                    console.log(`Таймер запущен: ${startSeconds} сек`);
                    break;
                    
                case 'pauseTimer':
                    io.to(gameId).emit('timerAction', { action: 'pause' });
                    break;
                    
                case 'stopTimer':
                    io.to(gameId).emit('timerAction', { action: 'stop' });
                    break;
                    
                case 'setTimer':
                    const setSeconds = data.seconds || 60;
                    io.to(gameId).emit('timerAction', { 
                        action: 'set', 
                        seconds: setSeconds 
                    });
                    break;
                    
                case 'nextRound':
                    game.nextRound();
                    io.to(gameId).emit('nextRound', game.getRoundInfo());
                    console.log(`Начат раунд ${game.currentRound} в игре ${gameId}`);
                    break;
                    
                case 'kickPlayer':
                    const targetId = data.playerId;
                    const result = game.kickPlayer(targetId);
                    
                    if (result.success) {
                        io.to(gameId).emit('playerKicked', {
                            playerId: targetId,
                            playerName: result.playerName
                        });
                        console.log(`Игрок ${result.playerName} исключен из бункера`);
                    } else {
                        socket.emit('error', { message: result.message });
                    }
                    break;
                    
                case 'returnToBunker':
                    const returnId = data.playerId;
                    const returnResult = game.returnToBunker(returnId);
                    
                    if (returnResult.success) {
                        io.to(gameId).emit('playerReturnedToBunker', {
                            playerId: returnId,
                            playerName: returnResult.playerName
                        });
                        console.log(`Игрок ${returnResult.playerName} возвращен в бункер`);
                    } else {
                        socket.emit('error', { message: returnResult.message });
                    }
                    break;
                    
                case 'setExactAge':
                case 'setExactValue':
                    const value = action === 'setExactAge' ? data.age : data.newValue;
                    const type = action === 'setExactAge' ? 'age' : data.characteristicType;
                    
                    const changeResult = game.setCharacteristicValue(
                        data.playerId, 
                        type, 
                        value
                    );
                    
                    if (changeResult.success) {
                        // Уведомляем всех об изменении
                        io.to(gameId).emit('characteristicChanged', {
                            playerId: data.playerId,
                            playerName: changeResult.playerName,
                            characteristicType: type,
                            newValue: value
                        });
                        
                        // Если характеристика уже была раскрыта
                        if (changeResult.wasRevealed) {
                            io.to(gameId).emit('cardRevealed', {
                                playerId: data.playerId,
                                username: changeResult.playerName,
                                cardType: type,
                                value: value
                            });
                        }
                        
                        // Обновляем данные игрока
                        const targetPlayer = game.getPlayer(data.playerId);
                        if (targetPlayer && !targetPlayer.isBot) {
                            io.to(targetPlayer.socketId).emit(
                                'playerDataUpdated', 
                                game.getPlayerData(data.playerId)
                            );
                        }
                    } else {
                        socket.emit('error', { message: changeResult.message });
                    }
                    break;
                    
                default:
                    socket.emit('error', { message: 'Неизвестное действие' });
            }
        } catch (error) {
            console.error('Ошибка действия хоста:', error);
            socket.emit('error', { message: 'Не удалось выполнить действие' });
        }
    });

    // Изменение характеристики игрока хостом
    socket.on('hostChangeCharacteristic', (data) => {
        try {
            const { gameId, playerId, characteristicType, action } = data;
            
            if (!games.has(gameId)) {
                return socket.emit('error', { message: 'Игра не найдена' });
            }
            
            const game = games.get(gameId);
            const connection = playerConnections.get(socket.id);
            
            if (!connection) {
                return socket.emit('error', { message: 'Ошибка соединения' });
            }
            
            const player = game.getPlayer(connection.playerId);
            
            // Проверяем права хоста
            if (!player || !player.isHost) {
                return socket.emit('error', { message: 'Только хост может изменять характеристики' });
            }
            
            // Меняем характеристику
            const result = game.changeCharacteristic(playerId, characteristicType, action);
            
            if (result.success) {
                // Оповещаем всех об изменении
                io.to(gameId).emit('characteristicChanged', {
                    playerId,
                    playerName: result.playerName,
                    characteristicType,
                    newValue: result.newValue
                });
                
                // Обновляем данные игрока
                const targetPlayer = game.getPlayer(playerId);
                if (targetPlayer && !targetPlayer.isBot) {
                    io.to(targetPlayer.socketId).emit(
                        'playerDataUpdated', 
                        game.getPlayerData(playerId)
                    );
                }
            } else {
                socket.emit('error', { message: result.message });
            }
        } catch (error) {
            console.error('Ошибка изменения характеристики:', error);
            socket.emit('error', { message: 'Не удалось изменить характеристику' });
        }
    });

    // Голосование
    socket.on('vote', (data) => {
        try {
            const { gameId, voterId, targetId } = data;
            
            if (!games.has(gameId)) {
                return socket.emit('error', { message: 'Игра не найдена' });
            }
            
            const game = games.get(gameId);
            const result = game.processVote(voterId, targetId);
            
            if (result.success) {
                // Подтверждаем голос
                socket.emit('voteConfirmed', { targetId });
                
                // Проверяем завершение голосования
                if (game.isVotingComplete()) {
                    const votingResults = game.getVotingResults();
                    io.to(gameId).emit('votingResults', votingResults);
                    
                    // Если исключили игрока
                    if (votingResults.eliminatedPlayerId) {
                        io.to(gameId).emit('playerKicked', {
                            playerId: votingResults.eliminatedPlayerId,
                            playerName: votingResults.eliminatedPlayerName
                        });
                    }
                    
                    // Проверяем окончание игры
                    if (game.isGameOver()) {
                        io.to(gameId).emit('gameOver', game.getGameResults());
                        games.delete(gameId);
                    } else {
                        game.nextRound();
                        io.to(gameId).emit('nextRound', game.getRoundInfo());
                    }
                }
            } else {
                socket.emit('error', { message: result.message });
            }
        } catch (error) {
            console.error('Ошибка голосования:', error);
            socket.emit('error', { message: 'Не удалось обработать голосование' });
        }
    });

    // Использование специальной возможности (стандартной или профессиональной)
    socket.on('useSpecialAbility', (data) => {
        try {
            const { gameId, playerId, abilityName, targetId } = data;
            
            if (!games.has(gameId)) {
                return socket.emit('error', { message: 'Игра не найдена' });
            }
            
            const game = games.get(gameId);
            const result = game.useSpecialAbility(playerId, abilityName, targetId);
            
            if (result.success) {
                // Оповещаем всех об использовании
                io.to(gameId).emit('specialAbilityUsed', {
                    playerId,
                    playerName: result.playerName,
                    abilityName,
                    result: result.effect
                });
                
                // Обновляем данные игрока
                const playerData = game.getPlayerData(playerId);
                socket.emit('playerDataUpdated', playerData);
                
                // Если есть раскрытые данные, оповещаем о них отдельно
                if (result.effect.revealedData) {
                    io.to(gameId).emit('cardRevealed', result.effect.revealedData);
                }
                
                // Если способность изменила бункер, обновляем информацию
                if (abilityName === 'Улучшение бункера' || abilityName === 'Запас еды') {
                    game.players.forEach(p => {
                        if (!p.isBot) {
                            io.to(p.socketId).emit('bunkerUpdated', {
                                description: game.bunker.description,
                                features: game.bunker.features
                            });
                        }
                    });
                }
            } else {
                socket.emit('error', { message: result.message });
            }
        } catch (error) {
            console.error('Ошибка использования способности:', error);
            socket.emit('error', { message: 'Не удалось использовать способность' });
        }
    });

    // Выход из игры
    socket.on('leaveGame', () => {
        try {
            const connection = playerConnections.get(socket.id);
            
            if (connection) {
                const { gameId, playerId } = connection;
                
                if (games.has(gameId)) {
                    const game = games.get(gameId);
                    const player = game.getPlayer(playerId);
                    
                    if (player) {
                        const wasHost = player.isHost;
                        const username = player.username;
                        
                        // Удаляем игрока
                        game.removePlayer(playerId);
                        
                        // Оповещаем остальных
                        socket.to(gameId).emit('playerLeft', {
                            playerId,
                            username,
                            remainingPlayers: game.players.length
                        });
                        
                        // Назначаем нового хоста, если нужно
                        if (wasHost && game.players.length > 0) {
                            const newHost = game.assignNewHost();
                            io.to(newHost.socketId).emit('hostAssigned', { isHost: true });
                        }
                        
                        // Отправляем список игроков всем в комнате
                        io.to(gameId).emit('playersList', { 
                            players: game.getPlayersInfo(),
                            spectators: game.getSpectatorsInfo ? game.getSpectatorsInfo() : []
                        });
                        
                        // Если игроков не осталось, удаляем игру
                        if (game.players.length === 0) {
                            games.delete(gameId);
                        }
                    }
                }
                
                // Удаляем запись о соединении
                playerConnections.delete(socket.id);
            }
            
            // Отправляем подтверждение
            socket.emit('gameLeft');
            
        } catch (error) {
            console.error('Ошибка выхода из игры:', error);
            socket.emit('error', { message: 'Ошибка при выходе из игры' });
        }
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        try {
            console.log(`Отключение сокета: ${socket.id}`);
            
            // Получаем данные о соединении
            const connection = playerConnections.get(socket.id);
            if (!connection) {
                console.log('Соединение не найдено в playerConnections');
                return;
            }
            
            const { gameId, playerId, isObserver } = connection;
            console.log('Данные отключающегося:', { gameId, playerId, isObserver });
            
            // Проверяем существование игры
            if (!games.has(gameId)) {
                console.log(`Игра ${gameId} не найдена`);
                playerConnections.delete(socket.id);
                return;
            }
            
            const game = games.get(gameId);
            
            // Если наблюдатель, просто удаляем его
            if (isObserver) {
                console.log(`Удаляем наблюдателя ${playerId}`);
                game.removeSpectator(playerId);
                playerConnections.delete(socket.id);
                return;
            }
            
            // Если обычный игрок, обрабатываем по стандартной логике
            const player = game.getPlayer(playerId);
            
            if (!player) {
                console.log(`Игрок ${playerId} не найден в игре ${gameId}`);
                playerConnections.delete(socket.id);
                return;
            }
            
            console.log(`Игрок ${player.username} (${playerId}) отключился от игры ${gameId}`);
            
            // Отмечаем игрока как отключившегося
            player.disconnected = true;
            
            // Устанавливаем таймер для полного удаления игрока
            player.disconnectTimer = setTimeout(() => {
                // Повторно проверяем, что игра все еще существует
                if (games.has(gameId)) {
                    const currentGame = games.get(gameId);
                    
                    // Проверяем, остался ли игрок отключенным
                    const currentPlayer = currentGame.getPlayer(playerId);
                    if (currentPlayer && currentPlayer.disconnected) {
                        console.log(`Удаление отключенного игрока ${playerId} из игры ${gameId}`);
                        
                        // Удаляем игрока
                        currentGame.removePlayer(playerId);
                        
                        // Если игра не началась, уведомляем остальных
                        if (!currentGame.isStarted) {
                            io.to(gameId).emit('playersList', { 
                                players: currentGame.getPlayersInfo(),
                                spectators: currentGame.getSpectatorsInfo()
                            });
                        }
                        
                        // Если игроков не осталось, удаляем игру
                        if (currentGame.players.length === 0) {
                            console.log(`Удаление пустой игры ${gameId}`);
                            games.delete(gameId);
                        } else {
                            // Назначаем нового хоста, если нужно
                            if (currentPlayer.isHost) {
                                currentGame.assignNewHost();
                                
                                // Уведомляем о новом хосте
                                const newHost = currentGame.players.find(p => p.isHost);
                                if (newHost) {
                                    io.to(gameId).emit('newHost', {
                                        playerId: newHost.id,
                                        username: newHost.username
                                    });
                                    
                                    // Отправляем сообщение новому хосту
                                    const hostSocket = io.sockets.sockets.get(newHost.socketId);
                                    if (hostSocket) {
                                        hostSocket.emit('youAreHost');
                                    }
                                }
                            }
                            
                            // Обновляем наблюдателей
                            updateSpectators(gameId);
                        }
                    }
                }
            }, 60000); // 60 секунд на переподключение
            
            // Уведомляем остальных игроков
            socket.to(gameId).emit('playerDisconnected', {
                playerId,
                username: player.username
            });
            
            // Удаляем связь с сокетом
            playerConnections.delete(socket.id);
        } catch (error) {
            console.error('Ошибка при обработке отключения:', error);
        }
    });
});

// Генерация ID игры
function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Функция для отправки обновлений наблюдателям
function updateSpectators(gameId) {
    try {
        const game = games.get(gameId);
        if (!game || !game.spectators || game.spectators.length === 0) return;
        
        // Формируем данные для наблюдателей
        const spectatorData = {
            catastrophe: game.catastrophe,
            bunker: game.bunker,
            players: game.getPlayersPublicData(),
            currentRound: game.currentRound
        };
        
        // Отправляем данные всем наблюдателям игры
        game.spectators.forEach(spectator => {
            if (!spectator.disconnected) {
                const spectatorSocket = io.sockets.sockets.get(spectator.socketId);
                if (spectatorSocket) {
                    spectatorSocket.emit('updateSpectatorView', spectatorData);
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при обновлении данных для наблюдателей:', error);
    }
}

// Запуск сервера
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Откройте в браузере http://localhost:${PORT} (или IP-адрес компьютера:${PORT} в локальной сети)`);
});
