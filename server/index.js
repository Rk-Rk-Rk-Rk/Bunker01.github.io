// Обработчик присоединения к игре
socket.on('joinGame', (data) => {
    try {
        const { gameId, playerName, isObserver } = data;
        
        // Проверяем существование игры
        const game = games[gameId];
        if (!game) {
            socket.emit('notification', { text: 'Игра с таким ID не найдена', type: 'error' });
            return;
        }
        
        // Если это наблюдатель, добавляем его с особым флагом
        if (isObserver) {
            // Генерируем уникальный ID для наблюдателя
            const observerId = `observer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            // Добавляем наблюдателя к игре
            game.addObserver(observerId, playerName, socket.id);
            
            // Подключаем сокет к комнате игры
            socket.join(gameId);
            
            // Отправляем данные о текущем состоянии игры
            socket.emit('joinGameSuccess', {
                gameId,
                playerId: observerId,
                isHost: false,
                isObserver: true,
                players: game.getPlayersForObserver(),
                gameStarted: game.isStarted,
                catastrophe: game.catastrophe,
                bunker: game.bunker
            });
            
            console.log(`Наблюдатель ${playerName} (${observerId}) присоединился к игре ${gameId}`);
            return;
        }
        
        // Обычный игрок...
        // (остальной код для добавления обычного игрока остается без изменений)
    } catch (error) {
        console.error('Ошибка при присоединении к игре:', error);
        socket.emit('notification', { text: 'Произошла ошибка при присоединении к игре', type: 'error' });
    }
}); 