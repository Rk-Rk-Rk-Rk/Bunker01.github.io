class BunkerGame {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.spectators = []; // Добавляем массив наблюдателей
        this.minPlayers = 4;
        this.maxPlayers = 12;
        this.isStarted = false;
        this.currentRound = 0;
        this.maxRounds = 5;
        this.catastrophe = null;
        this.bunker = null;
        this.votes = {};
        this.observers = []; // Список наблюдателей
        
        // Типы характеристик
        this.characteristicTypes = [
            'profession', // Профессия
            'health',     // Здоровье
            'age',        // Возраст
            'gender',     // Пол
            'hobby',      // Хобби
            'phobia',     // Фобия
            'baggage',    // Багаж (предмет)
            'fact',       // Дополнительный факт
            'trait'       // Человеческое качество
        ];
        
        // Особые возможности
        this.specialAbilities = [
            'Двойной голос',
            'Иммунитет',
            'Принудительное раскрытие',
            'Защита союзника'
        ];
        
        // Профессиональные способности
        this.professionalAbilities = {
            'Врач': {
                name: 'Медицинский осмотр',
                description: 'Узнать здоровье любого игрока'
            },
            'Инженер': {
                name: 'Улучшение бункера',
                description: 'Добавить одну дополнительную функцию в бункер'
            },
            'Учитель': {
                name: 'Обучение навыку',
                description: 'Дать новое полезное хобби другому игроку'
            },
            'Программист': {
                name: 'Взлом системы',
                description: 'Предотвратить исключение одного игрока'
            },
            'Фермер': {
                name: 'Запас еды',
                description: 'Увеличить запасы еды в бункере на 1 год'
            },
            'Военный': {
                name: 'Боевая подготовка',
                description: 'Усилить защиту бункера от внешних угроз'
            },
            'Повар': {
                name: 'Экономия продуктов',
                description: 'Продлить запасы еды на 6 месяцев'
            },
            'Ученый': {
                name: 'Научное открытие',
                description: 'Исследовать катастрофу и найти способ минимизировать её последствия'
            },
            'Строитель': {
                name: 'Укрепление бункера',
                description: 'Увеличить безопасность бункера'
            },
            'Полицейский': {
                name: 'Раскрытие правды',
                description: 'Заставить игрока раскрыть одну характеристику'
            },
            'Пожарный': {
                name: 'Спасательная подготовка',
                description: 'Снизить риски внутренних происшествий в бункере'
            },
            'Агроном': {
                name: 'Выращивание еды',
                description: 'Можнет выращивать еду в более серьезных условиях чем обычно'
            },
            'Ветеринар': {
                name: 'Адаптация животных',
                description: 'Можно взять с собой одно животное'
            },
            'Юрист': {
                name: 'Серьёзные аргументы',
                description: 'Может снимать и добовлять голос'
            },
            'Электрик': {
                name: 'Альтернативная энергия',
                description: 'Создать дополнительный источник энергии'
            },
            'Бухгалтер': {
                name: 'Рациональное распределение',
                description: 'Оптимизировать использование ресурсов'
            },
            'Архитектор': {
                name: 'Оптимизация пространства',
                description: 'Увеличить полезную площадь бункера'
            },
            'Дизайнер': {
                name: 'Эргономика',
                description: 'Улучшить условия проживания в бункере'
            },
            'Музыкант': {
                name: 'Поддержка морального духа',
                description: 'Снизить уровень стресса у всех игроков'
            },
            'Психолог': {
                name: 'Терапевтическая сессия',
                description: 'Вылечить фобию у одного игрока'
            },
            'Социальный работник': {
                name: 'Хорошая страрость',
                description: 'Обеспечить хорошую страрость'
            },
            'Хирург': {
                name: 'Сложная операция',
                description: 'Вылечить тяжелое заболевание у одного игрока'
            },
            'Пилот': {
                name: 'Разведка местности',
                description: 'Найти безопасное место для эвакуации'
            },
            'Автомеханик': {
                name: 'Ремонт техники',
                description: 'Восстановить работу систем бункера'
            },
            'Библиотекарь': {
                name: 'Полезные книги',
                description: 'Добавить в бункер полезные книги по выживанию'
            },
            'Косметолог': {
                name: 'Гигиена',
                description: 'Улучшить санитарные условия в бункере'
            },
            'Спортсмен': {
                name: 'Физическая подготовка',
                description: 'Улучшить здоровье одного игрока'
            },
            'Химик': {
                name: 'Химический анализ',
                description: 'Проверить безопасность воды и воздуха'
            },
            'Геолог': {
                name: 'Исследование грунта',
                description: 'Найти подземные источники воды'
            },
            'Садовник': {
                name: 'Оранжерея',
                description: 'Создать систему выращивания растений'
            },
            'Физик': {
                name: 'Радиационная защита',
                description: 'Усилить защиту от радиации'
            },
            'Историк': {
                name: 'Анализ катастроф',
                description: 'Предсказать возможные последствия катастрофы'
            },
            'Механик': {
                name: 'Ремонт оборудования',
                description: 'Восстановить работу жизненно важных систем'
            },
            'Сантехник': {
                name: 'Водоснабжение',
                description: 'Улучшить систему водоснабжения'
            },
            'Лингвист': {
                name: 'Коммуникация',
                description: 'Улучшить общение между игроками'
            },
            'Швея': {
                name: 'Одежда',
                description: 'Создать защитную одежду'
            },
            'Биолог': {
                name: 'Биологическая защита',
                description: 'Создать защиту от биологических угроз'
            },
            'Художник': {
                name: 'Визуальная коммуникация',
                description: 'Улучшить систему оповещения в бункере'
            },
            'Кузнец': {
                name: 'Создание инструментов',
                description: 'Изготовить полезные инструменты'
            },
            'Плотник': {
                name: 'Деревянные конструкции',
                description: 'Построить удобную мебель и улучшения'
            },
            'Сварщик': {
                name: 'Металлические конструкции',
                description: 'Укрепить стены бункера'
            },
            'Метеоролог': {
                name: 'Прогноз погоды',
                description: 'Предсказать безопасное время для выхода'
            },
            'Экономист': {
                name: 'Распределение ресурсов',
                description: 'Оптимизировать использование запасов'
            },
            'Экскурсовод': {
                name: 'Ориентация',
                description: 'Найти безопасные пути эвакуации'
            }
        };

        // Данные для характеристик
        this.traits = {
            profession: [
                'Врач', 'Инженер', 'Учитель', 'Программист', 'Фермер', 'Военный', 'Повар', 
                'Ученый', 'Строитель', 'Полицейский', 'Пожарный', 'Агроном', 'Ветеринар',
                'Юрист', 'Электрик', 'Бухгалтер', 'Архитектор', 'Дизайнер', 'Музыкант',
                'Психолог', 'Социальный работник', 'Хирург', 'Пилот', 'Автомеханик',
                // Новые профессии (20)
                'Библиотекарь', 'Косметолог', 'Спортсмен', 'Химик', 'Геолог',
                'Садовник', 'Физик', 'Историк', 'Механик', 'Сантехник',
                'Лингвист', 'Швея', 'Биолог', 'Художник', 'Кузнец',
                'Плотник', 'Сварщик', 'Метеоролог', 'Экономист', 'Экскурсовод'
            ],
            health: [
                'Полностью здоров',
                'Диабет 1 степени', 'Диабет 2 степени', 'Диабет 3 степени',
                'Легкая астма', 'Средняя астма', 'Тяжелая астма',
                'Легкая аллергия', 'Средняя аллергия', 'Сильная аллергия',
                'Легкая сердечная недостаточность', 'Средняя сердечная недостаточность', 'Тяжелая сердечная недостаточность',
                'Почечная недостаточность 1 стадии', 'Почечная недостаточность 2 стадии', 'Почечная недостаточность 3 стадии',
                'Легкое психическое расстройство', 'Среднее психическое расстройство', 'Тяжелое психическое расстройство',
                'Инвалидность 3 группы', 'Инвалидность 2 группы', 'Инвалидность 1 группы',
                // Новые состояния здоровья (20)
                'Дальтонизм', 'Близорукость', 'Дальнозоркость', 'Артрит легкой степени',
                'Артрит средней степени', 'Сколиоз', 'Бронхит хронический', 'Гипертония 1 степени',
                'Гипертония 2 степени', 'Гипотония', 'Потеря слуха частичная', 'Потеря зрения частичная',
                'Язва желудка', 'Гастрит', 'Мигрень', 'Эпилепсия контролируемая',
                'ВСД (вегетососудистая дистония)', 'Рубцы после ожогов', 'Посттравматический синдром',
                'Ампутированная конечность'
            ],
            hobby: [
                'Рыбалка', 'Садоводство', 'Программирование', 'Выживание', 'Охота', 
                'Кулинария', 'Медицина', 'Механика', 'Рукоделие', 'Плавание', 'Скалолазание',
                'Первая помощь', 'Чтение', 'Столярное дело', 'Сварка', 'Пчеловодство',
                'Шитье', 'Фотография', 'Радиолюбительство', 'Конструирование',
                // Новые хобби (20)
                'Альпинизм', 'Выращивание лекарственных растений', 'Ориентирование', 
                'Система выживания', 'Боевые искусства', 'Стрельба из лука', 
                'Навыки обращения с оружием', 'Консервирование', 'Изготовление свечей', 
                'Вязание', 'Ткачество', 'Гончарное дело', 'Картография', 
                'Изготовление мыла', 'Нетрадиционная медицина', 'Резьба по дереву', 
                'Астрономия', 'Метеорология', 'Кожевенное дело', 'Изготовление бумаги'
            ],
            phobia: [
                'Страх высоты', 'Страх замкнутых пространств', 'Страх пауков', 'Страх темноты', 
                'Страх громких звуков', 'Страх одиночества', 'Страх воды', 'Страх перелетов',
                'Страх змей', 'Страх собак', 'Страх микробов', 'Страх толпы', 'Страх болезней',
                'Страх крови', 'Страх грозы', 'Страх глубины', 'Страх публичных выступлений',
                // Новые фобии (20)
                'Страх инсектов', 'Страх радиации', 'Страх огня', 'Страх электричества',
                'Страх грязи', 'Страх игл', 'Страх рвоты', 'Страх призраков',
                'Страх растений', 'Страх зеркал', 'Страх пыли', 'Страх кошек',
                'Страх чужих прикосновений', 'Страх лифтов', 'Страх острых предметов',
                'Страх клоунов', 'Страх пуговиц', 'Страх дыр', 'Страх старения',
                'Страх смерти'
            ],
            baggage: [
                'Набор инструментов', 'Аптечка', 'Книга по выживанию', 'Семена растений', 
                'Оружие', 'Рация', 'Компас', 'Спички', 'Очиститель воды', 'Топор',
                'Спальный мешок', 'Консервированная еда', 'Канистра с бензином',
                'Батарейки', 'Солнечная панель', 'GPS навигатор', 'Набор для рыбалки',
                'Веревка', 'Палатка', 'Мультиинструмент',
                // Новые предметы багажа (20)
                'Портативный генератор', 'Набор для шитья', 'Противогаз', 'Защитный костюм',
                'Бинокль', 'Радиоприемник на батарейках', 'Запас антибиотиков', 'Дистиллятор',
                'Огнетушитель', 'Карта местности', 'Нож швейцарский', 'Фонарик динамо',
                'Тепловизор', 'Набор для разведения огня', 'Сигнальные ракеты', 'Термос',
                'Походная плита', 'Фильтр для воды', 'Книга лекарственных растений',
                'Соляной блок'
            ],
            fact: [
                'Был военным', 'Путешествовал по всему миру', 'Владеет несколькими языками', 
                'Имеет навыки выживания', 'Бывший спортсмен', 'Работал в экстремальных условиях',
                'Мастер боевых искусств', 'Имеет опыт жизни в дикой природе', 'Врач без границ',
                'Выжил в катастрофе', 'Бывший космонавт', 'Имеет медицинское образование',
                'Дайвер с опытом', 'Охотник и следопыт', 'Бывший спецназовец',
                // Новые факты (20)
                'Выжил в авиакатастрофе', 'Умеет добывать огонь без спичек', 'Знает съедобные растения',
                'Выжил после укуса ядовитой змеи', 'Был волонтером в зоне бедствия', 'Пережил сильное землетрясение',
                'Умеет читать следы животных', 'Имеет опыт выживания в пустыне', 'Знает технику очистки воды',
                'Обучался в школе выживания', 'Имеет опыт строительства укрытий', 'Пережил сильное наводнение',
                'Бывший инструктор по выживанию', 'Знает как ориентироваться по звездам', 'Умеет делать ловушки',
                'Проходил курсы первой помощи', 'Имеет опыт жизни в горах', 'Бывший инструктор по скалолазанию',
                'Выжил в сильную метель', 'Имеет навыки обращения с огнестрельным оружием'
            ],
            trait: [
                'Лидерские качества', 'Стрессоустойчивость', 'Коммуникабельность', 'Эмпатия', 
                'Креативность', 'Педантичность', 'Бесстрашие', 'Логическое мышление',
                'Дипломатичность', 'Оптимизм', 'Выносливость', 'Самоотверженность',
                'Внимательность к деталям', 'Быстрая обучаемость', 'Хладнокровие',
                'Упорство', 'Терпение', 'Честность', 'Искренность',
                // Новые черты характера (20)
                'Целеустремленность', 'Находчивость', 'Спокойствие', 'Прагматичность',
                'Умение работать в команде', 'Сосредоточенность', 'Надежность', 'Ответственность',
                'Адаптивность', 'Собранность', 'Рациональность', 'Решительность',
                'Изобретательность', 'Экономность', 'Пунктуальность', 'Трудолюбие',
                'Бережливость', 'Предусмотрительность', 'Организованность', 'Преданность'
            ]
        };
        
        // Уровни здоровья (для улучшения/ухудшения)
        this.healthLevels = {
            'Диабет': ['Диабет 3 степени', 'Диабет 2 степени', 'Диабет 1 степени'],
            'Астма': ['Тяжелая астма', 'Средняя астма', 'Легкая астма'],
            'Аллергия': ['Сильная аллергия', 'Средняя аллергия', 'Легкая аллергия'],
            'Сердечная недостаточность': ['Тяжелая сердечная недостаточность', 'Средняя сердечная недостаточность', 'Легкая сердечная недостаточность'],
            'Почечная недостаточность': ['Почечная недостаточность 3 стадии', 'Почечная недостаточность 2 стадии', 'Почечная недостаточность 1 стадии'],
            'Психическое расстройство': ['Тяжелое психическое расстройство', 'Среднее психическое расстройство', 'Легкое психическое расстройство'],
            'Инвалидность': ['Инвалидность 1 группы', 'Инвалидность 2 группы', 'Инвалидность 3 группы'],
            'Артрит': ['Артрит средней степени', 'Артрит легкой степени'],
            'Гипертония': ['Гипертония 2 степени', 'Гипертония 1 степени']
        };
    }
    
    // Добавление игрока
    addPlayer(username, socketId, isHost = false) {
        // Убедимся, что имя не undefined
        const playerName = username || `Игрок-${Date.now().toString().slice(-4)}`;
        
        const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        const player = {
            id: playerId,
            username: playerName,
            socketId,
            isHost,
            isBot: false,
            disconnected: false,
            characteristics: null,
            abilities: [],
            revealedCards: [],
            inBunker: true,
            specialAbilities: [this.getRandomSpecialAbility(), this.getRandomSpecialAbility()],
            professionalAbility: null
        };
        
        this.players.push(player);
        return playerId;
    }
    
    // Добавление ботов
    addBots(count) {
        for (let i = 1; i <= count; i++) {
            const botId = `bot-${Date.now()}-${i}`;
            
            const bot = {
                id: botId,
                username: `Бот ${i}`,
                socketId: `bot-socket-${i}`,
                isHost: false,
                isBot: true,
                isInBunker: true,
                isKicked: false,
                characteristics: {},
                revealedCards: [],
                specialAbilities: [],
                professionalAbility: null
            };
            
            this.players.push(bot);
        }
    }
    
    // Получение игрока по ID
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    // Удаление игрока
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            // Отменяем таймер отключения, если он есть
            const player = this.players[index];
            if (player.disconnectTimer) {
                clearTimeout(player.disconnectTimer);
            }
            
            // Удаляем игрока
            this.players.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // Назначение нового хоста
    assignNewHost() {
        // Находим первого не-бота игрока
        const newHost = this.players.find(p => !p.isBot);
        
        if (newHost) {
            newHost.isHost = true;
            return newHost;
        }
        
        return null;
    }
    
    // Получение случайной спецвозможности
    getRandomSpecialAbility() {
        return this.specialAbilities[
            Math.floor(Math.random() * this.specialAbilities.length)
        ];
    }
    
    // Запуск игры
    startGame() {
        this.isStarted = true;
        this.currentRound = 1;
        
        // Генерация катастрофы
        this.catastrophe = this.generateCatastrophe();
        
        // Генерация бункера
        this.bunker = this.generateBunker();
        
        // Генерация характеристик игроков
        this.generateCharacteristics();
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            gameId: this.gameId,
            round: this.currentRound,
            catastrophe: this.catastrophe,
            bunker: this.bunker
        };
    }
    
    // Генерация катастрофы
    generateCatastrophe() {
        const catastrophes = [
            {
                type: 'nuclear',
                title: 'Ядерная война',
                description: 'Мировая ядерная война уничтожила большую часть населения Земли. Радиационный фон повышен, города разрушены.'
            },
            {
                type: 'pandemic',
                title: 'Глобальная пандемия',
                description: 'Смертельный вирус распространился по всему миру, убивая 95% зараженных. Вакцина не найдена.'
            },
            {
                type: 'asteroid',
                title: 'Столкновение с астероидом',
                description: 'Крупный астероид столкнулся с Землей, вызвав глобальные разрушения и затяжную зиму из-за пыли в атмосфере.'
            },
            {
                type: 'climate',
                title: 'Климатическая катастрофа',
                description: 'Резкое изменение климата привело к затоплению прибрежных территорий и экстремальным температурам.'
            },
            {
                type: 'alien',
                title: 'Инопланетное вторжение',
                description: 'Агрессивные инопланетяне атаковали Землю, уничтожив большую часть человечества.'
            },
            {
                type: 'zombies',
                title: 'Зомби-апокалипсис',
                description: 'Неизвестное заболевание превращает умерших людей в зомби. Большая часть населения заражена.'
            },
            {
                type: 'robot',
                title: 'Восстание машин',
                description: 'Искусственный интеллект вышел из-под контроля и начал уничтожать человечество с помощью роботов и дронов.'
            },
            {
                type: 'chemical',
                title: 'Химическая катастрофа',
                description: 'Глобальная утечка токсичных химикатов отравила атмосферу и водоемы. Поверхность планеты стала опасной.'
            },
            {
                type: 'solar',
                title: 'Солнечная буря',
                description: 'Мощнейшая солнечная буря вывела из строя всю электронику и вызвала массовую смерть от радиации.'
            },
            {
                type: 'magnetic',
                title: 'Инверсия магнитных полюсов',
                description: 'Смена магнитных полюсов Земли вызвала катастрофические изменения климата и массовую гибель животных.'
            }
        ];
        
        return catastrophes[Math.floor(Math.random() * catastrophes.length)];
    }
    
    // Генерация бункера
    generateBunker() {
        // Подстраиваем размер бункера под количество игроков
        const playerCount = this.players.length;
        let bunkerSize;
        
        if (playerCount <= 5) {
            bunkerSize = 'small';  // Маленький бункер для 4-5 игроков
        } else if (playerCount <= 8) {
            bunkerSize = 'medium'; // Средний бункер для 6-8 игроков
        } else {
            bunkerSize = 'large';  // Большой бункер для 9-12 игроков
        }
        
        const bunkers = {
            small: {
                description: `Небольшой бункер, рассчитанный на ${playerCount + 1} человек. Запасов еды хватит на 1 год.`,
                features: ['Генератор электричества', 'Базовая медицинская аптечка', 'Система фильтрации воды']
            },
            medium: {
                description: `Средний бункер, рассчитанный на ${playerCount + 2} человек. Запасов еды хватит на 2 года.`,
                features: ['Продвинутая система жизнеобеспечения', 'Гидропонная ферма', 'Медицинский отсек']
            },
            large: {
                description: `Большой военный бункер, рассчитанный на ${playerCount + 3} человек. Запасов хватит на 5 лет.`,
                features: ['Автономная энергосистема', 'Лаборатория', 'Арсенал оружия', 'Медицинское оборудование']
            }
        };
        
        return bunkers[bunkerSize];
    }
    
    // Генерация характеристик для всех игроков
    generateCharacteristics() {
        this.players.forEach(player => {
            // Генерируем базовые характеристики
            player.characteristics = {
                profession: this.getRandomItem(this.traits.profession),
                health: this.getRandomItem(this.traits.health),
                age: Math.floor(Math.random() * 40) + 20, // 20-60 лет
                gender: Math.random() > 0.5 ? 'Мужской' : 'Женский',
                hobby: this.getRandomItem(this.traits.hobby),
                phobia: this.getRandomItem(this.traits.phobia),
                baggage: this.getRandomItem(this.traits.baggage),
                fact: this.getRandomItem(this.traits.fact),
                trait: this.getRandomItem(this.traits.trait)
            };
            
            // Устанавливаем профессиональную способность на основе профессии
            const profession = player.characteristics.profession;
            if (this.professionalAbilities[profession]) {
                player.professionalAbility = this.professionalAbilities[profession];
            }
        });
    }
    
    // Получение случайного элемента из массива
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // Получение данных игрока
    getPlayerData(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return null;
        
        // Подготовка данных о других игроках
        const allPlayers = this.players.map(p => ({
            id: p.id,
            username: p.username,
            isHost: p.isHost,
            isBot: p.isBot || false,
            isKicked: p.isKicked || false,
            isInBunker: p.isInBunker,
            disconnected: p.disconnected || false,
            revealedCards: p.revealedCards || [],
            characteristics: p.revealedCards ? p.revealedCards.reduce((obj, cardType) => {
                obj[cardType] = p.characteristics[cardType];
                return obj;
            }, {}) : {}
        }));
        
        return {
            gameId: this.gameId,
            id: player.id,
            username: player.username,
            isHost: player.isHost,
            characteristics: player.characteristics,
            revealedCards: player.revealedCards || [],
            specialAbilities: player.specialAbilities || [],
            professionalAbility: player.professionalAbility || null,
            catastrophe: this.catastrophe,
            bunker: this.bunker,
            currentRound: this.currentRound,
            allPlayers: allPlayers
        };
    }
    
    // Получение информации об всех игроках
    getPlayersInfo() {
        return this.players.map(p => ({
            id: p.id,
            username: p.username,
            isHost: p.isHost,
            isBot: p.isBot || false,
            disconnected: p.disconnected || false
        }));
    }
    
    // Раскрытие карты
    revealCard(playerId, cardType) {
        const player = this.getPlayer(playerId);
        
        if (!player) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        if (!this.characteristicTypes.includes(cardType)) {
            return { success: false, message: 'Неверный тип характеристики' };
        }
        
        // Проверка, не раскрыта ли уже карта
        if (player.revealedCards && player.revealedCards.includes(cardType)) {
            return { success: false, message: 'Эта карта уже раскрыта' };
        }
        
        // Проверка наличия характеристики
        if (!player.characteristics || !player.characteristics[cardType]) {
            return { success: false, message: 'Характеристика не найдена' };
        }
        
        // Создаем массив раскрытых карт, если его нет
        if (!player.revealedCards) {
            player.revealedCards = [];
        }
        
        // Добавляем карту в список раскрытых
        player.revealedCards.push(cardType);
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            success: true,
            data: {
                playerId: player.id,
                username: player.username,
                cardType: cardType,
                value: player.characteristics[cardType]
            }
        };
    }
    
    // Изменение характеристики игрока
    changeCharacteristic(playerId, characteristicType, action) {
        const player = this.getPlayer(playerId);
        
        if (!player) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        if (!this.characteristicTypes.includes(characteristicType)) {
            return { success: false, message: 'Неверный тип характеристики' };
        }
        
        let newValue;
        
        switch (action) {
            case 'random':
                newValue = this.getRandomCharacteristic(characteristicType);
                break;
            case 'improve':
                newValue = this.modifyCharacteristic(player.characteristics[characteristicType], characteristicType, true);
                break;
            case 'worsen':
                newValue = this.modifyCharacteristic(player.characteristics[characteristicType], characteristicType, false);
                break;
            default:
                return { success: false, message: 'Неверное действие' };
        }
        
        // Обновляем значение
        player.characteristics[characteristicType] = newValue;
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            success: true,
            playerName: player.username,
            newValue: newValue
        };
    }
    
    // Явная установка значения характеристики
    setCharacteristicValue(playerId, characteristicType, value) {
        const player = this.getPlayer(playerId);
        
        if (!player) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        if (!this.characteristicTypes.includes(characteristicType)) {
            return { success: false, message: 'Неверный тип характеристики' };
        }
        
        // Проверка валидности возраста
        if (characteristicType === 'age') {
            const age = parseInt(value);
            if (isNaN(age) || age < 18 || age > 90) {
                return { success: false, message: 'Некорректный возраст' };
            }
        }
        
        // Обновляем значение
        player.characteristics[characteristicType] = value;
        
        // Проверяем, была ли уже раскрыта эта карта
        const wasRevealed = player.revealedCards && player.revealedCards.includes(characteristicType);
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            success: true,
            playerName: player.username,
            wasRevealed: wasRevealed
        };
    }
    
    // Получение случайной характеристики
    getRandomCharacteristic(type) {
        // Для возраста и пола - особая логика
        if (type === 'age') {
            return (Math.floor(Math.random() * 40) + 20).toString(); // Возраст от 20 до 60
        }
        
        if (type === 'gender') {
            return Math.random() > 0.5 ? 'Мужской' : 'Женский';
        }
        
        // Для других типов - выбор из списка
        const traitsList = this.traits[type];
        return traitsList[Math.floor(Math.random() * traitsList.length)];
    }
    
    // Модификация характеристики (улучшение/ухудшение)
    modifyCharacteristic(currentValue, type, isImprovement) {
        // Для здоровья есть четкие уровни
        if (type === 'health') {
            // Полностью здоров - особый случай
            if (currentValue === 'Полностью здоров') {
                if (!isImprovement) {
                    // Ухудшаем до случайной легкой болезни
                    const lightIllnesses = [
                        'Легкая астма',
                        'Легкая аллергия',
                        'Легкое психическое расстройство',
                        'Диабет 1 степени',
                        'Легкая сердечная недостаточность',
                        'Почечная недостаточность 1 стадии',
                        'Инвалидность 3 группы'
                    ];
                    return this.getRandomItem(lightIllnesses);
                }
                return currentValue; // Уже максимально здоров
            }
            
            // Ищем заболевание в нашем списке
            for (const disease in this.healthLevels) {
                if (currentValue.toLowerCase().includes(disease.toLowerCase())) {
                    const levels = this.healthLevels[disease];
                    const currentIndex = levels.indexOf(currentValue);
                    
                    if (currentIndex !== -1) {
                        if (isImprovement) {
                            // Улучшение: переход к более легкой степени
                            if (currentIndex < levels.length - 1) {
                                return levels[currentIndex + 1];
                            } else {
                                // Если уже на самой легкой стадии, переходим к полному здоровью
                                return 'Полностью здоров';
                            }
                        } else {
                            // Ухудшение: переход к более тяжелой степени
                            if (currentIndex > 0) {
                                return levels[currentIndex - 1];
                            }
                            // Если уже на самой тяжелой стадии, остаемся на ней
                            return levels[0];
                        }
                    }
                }
            }
            
            // Если не нашли точное соответствие, возвращаем случайное значение
            return this.getRandomCharacteristic(type);
        }
        
        // Для возраста
        if (type === 'age') {
            const age = parseInt(currentValue);
            if (isNaN(age)) return currentValue;
            
            const newAge = isImprovement 
                ? Math.max(20, age - 5) // Молодеет
                : Math.min(80, age + 5); // Стареет
            
            return newAge.toString();
        }
        
        // Для других характеристик возвращаем случайное значение
        return this.getRandomCharacteristic(type);
    }
    
    // Исключение игрока из бункера
    kickPlayer(playerId) {
        const player = this.getPlayer(playerId);
        
        if (!player) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        // Исключаем
        player.isInBunker = false;
        player.isKicked = true;
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            success: true,
            playerName: player.username
        };
    }
    
    // Возвращение игрока в бункер
    returnToBunker(playerId) {
        const player = this.getPlayer(playerId);
        
        if (!player) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        if (player.isInBunker) {
            return { success: false, message: 'Игрок уже в бункере' };
        }
        
        // Возвращаем
        player.isInBunker = true;
        player.isKicked = false;
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            success: true,
            playerName: player.username
        };
    }
    
    // Обработка голоса
    processVote(voterId, targetId) {
        // Проверка игроков
        const voter = this.getPlayer(voterId);
        const target = this.getPlayer(targetId);
        
        if (!voter || !target) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        if (!voter.isInBunker || !target.isInBunker) {
            return { success: false, message: 'Игрок должен быть в бункере' };
        }
        
        // Сохраняем голос
        this.votes[voterId] = targetId;
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return { success: true };
    }
    
    // Проверка, все ли проголосовали
    isVotingComplete() {
        // Считаем активных игроков (в бункере, не боты)
        const activePlayers = this.players.filter(p => p.isInBunker && !p.isBot);
        const votes = Object.keys(this.votes).length;
        
        return votes >= activePlayers.length;
    }
    
    // Получение результатов голосования
    getVotingResults() {
        const voteCounts = {};
        
        // Считаем голоса, учитывая "Двойной голос"
        for (const voterId in this.votes) {
            const voter = this.getPlayer(voterId);
            const targetId = this.votes[voterId];
            
            // Если у игрока есть двойной голос, учитываем его дважды
            const voteWeight = (voter && voter.hasDoubleVote) ? 2 : 1;
            voteCounts[targetId] = (voteCounts[targetId] || 0) + voteWeight;
        }
        
        // Находим игрока с максимальным числом голосов
        let maxVotes = 0;
        let eliminatedPlayerId = null;
        
        for (const targetId in voteCounts) {
            if (voteCounts[targetId] > maxVotes) {
                maxVotes = voteCounts[targetId];
                eliminatedPlayerId = targetId;
            }
        }
        
        // Если есть исключаемый игрок
        let eliminatedPlayerName = 'Никто';
        if (eliminatedPlayerId) {
            const player = this.getPlayer(eliminatedPlayerId);
            if (player) {
                // Проверяем защиту от голосования
                if (!player.hasImmunity && !player.isProtected) {
                    player.isInBunker = false;
                    player.isKicked = true;
                    eliminatedPlayerName = player.username;
                } else {
                    eliminatedPlayerName = `${player.username} (защищен)`;
                    eliminatedPlayerId = null; // Обнуляем ID, так как игрок не исключен
                }
            }
        }
        
        // Сбрасываем голоса
        this.votes = {};
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            voteCounts,
            eliminatedPlayerId,
            eliminatedPlayerName
        };
    }
    
    // Использование специальной возможности
    useSpecialAbility(playerId, abilityName, targetId = null) {
        const player = this.getPlayer(playerId);
        
        if (!player) {
            return { success: false, message: 'Игрок не найден' };
        }
        
        // Проверяем, есть ли это обычная спецвозможность
        const isRegularAbility = player.specialAbilities && player.specialAbilities.includes(abilityName);
        // Или профессиональная
        const isProfessionalAbility = player.professionalAbility && player.professionalAbility.name === abilityName;
        
        if (!isRegularAbility && !isProfessionalAbility) {
            return { success: false, message: 'У вас нет такой способности' };
        }
        
        // Проверка необходимости цели для обычных способностей
        const requiresTarget = ['Принудительное раскрытие', 'Защита союзника'].includes(abilityName);
        
        // Проверка необходимости цели для профессиональных способностей
        const profTargetRequired = [
            'Медицинский осмотр', 'Обучение навыку', 'Взлом системы', 'Раскрытие правды',
            'Терапевтическая сессия', 'Омоложение', 'Физическая подготовка'
        ].includes(abilityName);
        
        // Общая проверка необходимости цели
        const needsTarget = requiresTarget || profTargetRequired;
        
        if (needsTarget && !targetId) {
            return { success: false, message: 'Необходимо выбрать цель' };
        }
        
        // Проверка валидности цели
        if (needsTarget) {
            const target = this.getPlayer(targetId);
            if (!target || !target.isInBunker) {
                return { success: false, message: 'Неверная цель' };
            }
        }
        
        // Удаляем использованную способность
        if (isRegularAbility) {
            const abilityIndex = player.specialAbilities.indexOf(abilityName);
            player.specialAbilities.splice(abilityIndex, 1);
        } else if (isProfessionalAbility) {
            // Профессиональные способности можно использовать только 1 раз
            player.professionalAbility = null;
        }
        
        // Эффект способности
        let effect = { success: true, message: `Способность ${abilityName} использована` };
        
        switch (abilityName) {
            // Обычные специальные способности
            case 'Двойной голос':
                effect.message = `${player.username} будет иметь двойной голос в следующем голосовании`;
                player.hasDoubleVote = true;
                break;
                
            case 'Иммунитет':
                effect.message = `${player.username} получил иммунитет от голосования в этом раунде`;
                player.hasImmunity = true;
                break;
                
            case 'Принудительное раскрытие':
                const target = this.getPlayer(targetId);
                
                if (target) {
                    // Выбираем случайную нераскрытую характеристику
                    const unrevealedTypes = this.characteristicTypes.filter(
                        type => !target.revealedCards || !target.revealedCards.includes(type)
                    );
                    
                    if (unrevealedTypes.length > 0) {
                        const randomType = this.getRandomItem(unrevealedTypes);
                        const revealResult = this.revealCard(targetId, randomType);
                        
                        if (revealResult.success) {
                            effect.message = `${player.username} принудительно раскрыл ${this.getCardTypeName(randomType)} игрока ${target.username}`;
                            effect.revealedData = revealResult.data;
                        } else {
                            effect.message = `Не удалось раскрыть характеристику ${target.username}`;
                        }
                    } else {
                        effect.message = `У ${target.username} уже раскрыты все характеристики`;
                    }
                }
                break;
                
            case 'Защита союзника':
                const ally = this.getPlayer(targetId);
                if (ally) {
                    effect.message = `${player.username} защищает ${ally.username} в этом раунде`;
                    ally.isProtected = true;
                }
                break;
                
            // Профессиональные способности
            case 'Медицинский осмотр':
                const patientId = targetId;
                const patient = this.getPlayer(patientId);
                if (patient) {
                    effect.message = `${player.username} провел медицинский осмотр ${patient.username}`;
                    effect.revealedData = {
                        playerId: patient.id,
                        username: patient.username,
                        cardType: 'health',
                        value: patient.characteristics.health
                    };
                    // Добавляем в раскрытые карты
                    if (!patient.revealedCards) patient.revealedCards = [];
                    if (!patient.revealedCards.includes('health')) {
                        patient.revealedCards.push('health');
                    }
                }
                break;
                
            case 'Улучшение бункера':
                const bunkerFeatures = [
                    'Дополнительная система фильтрации воздуха',
                    'Солнечные батареи на поверхности',
                    'Система регенерации воды',
                    'Повышенная изоляция от радиации',
                    'Запасной выход'
                ];
                const newFeature = this.getRandomItem(bunkerFeatures);
                this.bunker.features.push(newFeature);
                effect.message = `${player.username} улучшил бункер: добавлена ${newFeature}`;
                break;
                
            case 'Обучение навыку':
                const studentId = targetId;
                const student = this.getPlayer(studentId);
                if (student) {
                    const oldHobby = student.characteristics.hobby;
                    const usefulHobbies = [
                        'Первая помощь', 'Выживание', 'Охота', 'Сварка',
                        'Медицина', 'Механика', 'Радиолюбительство', 'Столярное дело'
                    ];
                    const newHobby = this.getRandomItem(usefulHobbies);
                    student.characteristics.hobby = newHobby;
                    effect.message = `${player.username} обучил ${student.username} новому хобби: ${newHobby}`;
                    
                    // Если хобби было раскрыто, уведомляем всех об изменении
                    if (student.revealedCards && student.revealedCards.includes('hobby')) {
                        effect.revealedData = {
                            playerId: student.id,
                            username: student.username,
                            cardType: 'hobby',
                            value: newHobby
                        };
                    }
                }
                break;
                
            case 'Запас еды':
                // Продлеваем запасы еды в бункере
                effect.message = `${player.username} увеличил запасы продовольствия в бункере на 1 год`;
                // Обновляем описание бункера
                const food = /Запасов еды хватит на (\d+) (год|года|лет)/;
                const match = this.bunker.description.match(food);
                if (match) {
                    const yearsNum = parseInt(match[1]) + 1;
                    const yearsWord = yearsNum === 1 ? 'год' : yearsNum < 5 ? 'года' : 'лет';
                    this.bunker.description = this.bunker.description.replace(
                        food, 
                        `Запасов еды хватит на ${yearsNum} ${yearsWord}`
                    );
                }
                break;
                
            case 'Полезные книги':
                const books = [
                    'Энциклопедия выживания',
                    'Справочник по первой помощи',
                    'Руководство по охоте и рыбалке',
                    'Выращивание растений в закрытых помещениях',
                    'Основы электротехники',
                    'Ремонт механизмов',
                    'Рецепты консервирования пищи'
                ];
                const selectedBooks = [];
                for (let i = 0; i < 3; i++) {
                    const book = this.getRandomItem(books.filter(b => !selectedBooks.includes(b)));
                    selectedBooks.push(book);
                }
                effect.message = `${player.username} добавил в бункер полезные книги: ${selectedBooks.join(', ')}`;
                break;
                
            case 'Омоложение':
                const targetToYounger = this.getPlayer(targetId);
                if (targetToYounger) {
                    const oldAge = parseInt(targetToYounger.characteristics.age);
                    if (!isNaN(oldAge)) {
                        const newAge = Math.max(18, oldAge - 5);
                        targetToYounger.characteristics.age = newAge.toString();
                        effect.message = `${player.username} омолодил ${targetToYounger.username} на 5 лет, теперь возраст: ${newAge}`;
                        
                        // Если возраст был раскрыт, уведомляем всех об изменении
                        if (targetToYounger.revealedCards && targetToYounger.revealedCards.includes('age')) {
                            effect.revealedData = {
                                playerId: targetToYounger.id,
                                username: targetToYounger.username,
                                cardType: 'age',
                                value: newAge.toString()
                            };
                        }
                    }
                }
                break;
                
            case 'Физическая подготовка':
                const targetToHealthier = this.getPlayer(targetId);
                if (targetToHealthier) {
                    const oldHealth = targetToHealthier.characteristics.health;
                    // Улучшаем здоровье
                    const newHealth = this.modifyCharacteristic(oldHealth, 'health', true);
                    targetToHealthier.characteristics.health = newHealth;
                    effect.message = `${player.username} улучшил здоровье ${targetToHealthier.username} до: ${newHealth}`;
                    
                    // Если здоровье было раскрыто, уведомляем всех об изменении
                    if (targetToHealthier.revealedCards && targetToHealthier.revealedCards.includes('health')) {
                        effect.revealedData = {
                            playerId: targetToHealthier.id,
                            username: targetToHealthier.username,
                            cardType: 'health',
                            value: newHealth
                        };
                    }
                }
                break;
                
            case 'Терапевтическая сессия':
                const patientPhobia = this.getPlayer(targetId);
                if (patientPhobia) {
                    const oldPhobia = patientPhobia.characteristics.phobia;
                    patientPhobia.characteristics.phobia = 'Отсутствует (вылечено)';
                    effect.message = `${player.username} вылечил фобию ${patientPhobia.username}: ${oldPhobia}`;
                    
                    // Если фобия была раскрыта, уведомляем всех об изменении
                    if (patientPhobia.revealedCards && patientPhobia.revealedCards.includes('phobia')) {
                        effect.revealedData = {
                            playerId: patientPhobia.id,
                            username: patientPhobia.username,
                            cardType: 'phobia',
                            value: 'Отсутствует (вылечено)'
                        };
                    }
                }
                break;
                
            default:
                // Для остальных профессиональных способностей просто отправляем сообщение
                if (player.professionalAbility && player.professionalAbility.name === abilityName) {
                    effect.message = `${player.username} использовал профессиональную способность: ${abilityName}`;
                    effect.description = player.professionalAbility.description;
                }
        }
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            success: true,
            playerName: player.username,
            effect: effect
        };
    }
    
    // Переход к следующему раунду
    nextRound() {
        this.currentRound++;
        
        // Сбрасываем временные эффекты
        this.players.forEach(player => {
            player.hasDoubleVote = false;
            player.hasImmunity = false;
            player.isProtected = false;
        });
        
        // Обновляем наблюдателей
        this.updateObservers();
        
        return {
            round: this.currentRound,
            maxRounds: this.maxRounds
        };
    }
    
    // Получение информации о текущем раунде
    getRoundInfo() {
        return {
            round: this.currentRound,
            maxRounds: this.maxRounds,
            playersInBunker: this.players.filter(p => p.isInBunker).length
        };
    }
    
    // Проверка окончания игры
    isGameOver() {
        return this.currentRound >= this.maxRounds;
    }
    
    // Получение результатов игры
    getGameResults() {
        return {
            survivors: this.players.filter(p => p.isInBunker).map(p => ({
                id: p.id,
                username: p.username,
                characteristics: p.characteristics
            })),
            eliminated: this.players.filter(p => !p.isInBunker).map(p => ({
                id: p.id,
                username: p.username,
                characteristics: p.characteristics
            }))
        };
    }
    
    // Получение названия типа карты
    getCardTypeName(cardType) {
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
    
    // Добавление наблюдателя
    addSpectator(username, socketId) {
        const spectatorId = 'SP_' + Math.random().toString(36).substring(2, 8);
        
        this.spectators.push({
            id: spectatorId,
            username,
            socketId,
            disconnected: false
        });
        
        return spectatorId;
    }
    
    // Получение информации о всех наблюдателях
    getSpectatorsInfo() {
        return this.spectators.map(spectator => ({
            id: spectator.id,
            username: spectator.username,
            disconnected: spectator.disconnected
        }));
    }
    
    // Получение общедоступных данных всех игроков для наблюдателей
    getPlayersPublicData() {
        return this.players.map(player => {
            const publicData = {
                id: player.id,
                username: player.username,
                isHost: player.isHost,
                isOut: player.isOut,
                revealedCards: player.revealedCards || [],
                characteristics: {}
            };
            
            // Добавляем все характеристики (для наблюдателей они все видны)
            this.characteristicTypes.forEach(charType => {
                publicData.characteristics[charType] = player.characteristics[charType];
            });
            
            return publicData;
        });
    }
    
    // Удаление наблюдателя
    removeSpectator(spectatorId) {
        const index = this.spectators.findIndex(spec => spec.id === spectatorId);
        if (index !== -1) {
            this.spectators.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // Добавление наблюдателя
    addObserver(observerId, name, socketId) {
        // Проверяем, что имя не undefined
        const observerName = name || `Наблюдатель-${Date.now().toString().slice(-4)}`;
        
        this.observers.push({
            id: observerId,
            username: observerName,
            socketId: socketId,
            isObserver: true
        });
        
        return observerId;
    }
    
    // Удаление наблюдателя
    removeObserver(observerId) {
        this.observers = this.observers.filter(observer => observer.id !== observerId);
    }
    
    // Получение всех игроков для наблюдателя (включая их характеристики)
    getPlayersForObserver() {
        // Получаем список игроков с информацией о раскрытых картах
        return this.players.map(player => {
            // Создаем копию игрока, чтобы не изменять оригинал
            const playerCopy = { ...player };
            
            // Добавляем свойство revealedCards, если его нет
            if (!playerCopy.revealedCards) {
                playerCopy.revealedCards = [];
            }
            
            return playerCopy;
        });
    }
    
    // Обновление всех наблюдателей
    updateObservers() {
        // Получаем данные для наблюдателей
        const updateData = {
            players: this.getPlayersForObserver(),
            catastrophe: this.catastrophe,
            bunker: this.bunker,
            currentRound: this.currentRound
        };
        
        // Отправляем обновления всем наблюдателям
        this.observers.forEach(observer => {
            io.to(observer.socketId).emit('observerGameUpdate', updateData);
        });
    }
}

module.exports = BunkerGame;
