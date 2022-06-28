const defaultLang = 'en';

const Locales: LocaleDefinitionList = {
    en: {
        name: 'English',
        displayName: '🇺🇸',
        texts: {
            LogIn: 'Log In',
            Play: 'Play!',
            PlayAgain: 'Play Again',
            PlaySandbox: 'Sandbox Map Editor',
            Connecting: '🌐 Connecting...',
            SearchingOpponent: '🔍 Searching for opponent...',
            MatchWithdraw: '🏳️ Draw!',
            MatchWon: '👑 You won!',
            MatchLost: '⭕️ You lost!',
            MatchOver: 'Match is Over',
            YourTurn: '🟢 Your turn',
            OpponentTurn: '⏳ Opponent\'s turn',
            NoMoves: '🔴 No moves available',
            OpponentNoMoves: '🔒 Opponent blocked!',
            OpponentEliminated: '☠️ Opponent eliminated!',
            OpponentLeft: '🔌 Opponent left the match',
            SandboxToolEmptyNone: 'Cell',
            SandboxToolPlayer1: 'Player 1',
            SandboxToolPlayer2: 'Player 2',
            SandboxExport: 'Export to F12',
            Quit: 'Quit',
            PointsEarned: 'Points Earned',
            PointsToday: 'Points Today',
            PointsTotal: 'Points Total',
            TopPlayers_today: 'Top Players Today',
            TopPlayers_total: 'Top Players All-time',
            Points: 'Your ranking points',
            HowTo: 'How to play',
            HowToGameGoal: 'Goal of the Game',
            HowToGameGoalText: 'The goal is to cover as many spaces of the board with your color as possible. This is done by moving, jumping, and converting your opponents pieces',
            HowToMovement: 'Movement',
            HowToMovementText: 'When it is your turn to move, simply select the piece that you wish to move by clicking on it. Once the piece is selected, touch an empty space on the board you want to move to. A player must make a move if one is available. It is possible to move one space in any direction or jump two spaces in any direction as long as the the destination is empty',
            HowToMovementCloneText: 'If you move 1 space, you clone the piece. If you jump 2 spaces, you move the piece',
            HowToCapture: 'Capture',
            HowToCaptureText: 'After a player captures an empty space by either moving or jumping, any of the opponents pieces that are adjacent to that new location will also be captured',
            HowToWin: 'Winning',
            HowToWinText: 'The game ends when there are no empty spaces or when one player cannot move. If a player cannot move, the remaining empty spaces are captured by the other player and the game ends. The player with the majority of pieces on the board wins',
        }
    },
    es: {
        name: 'Español',
        displayName: '🇪🇸',
        texts: {
            LogIn: 'Iniciar sesión',
            Play: '¡Tocar!',
            PlayAgain: 'Juega de nuevo',
            PlaySandbox: 'Sandbox Map Editor',
            Connecting: '🌐 Conectando...',
            SearchingOpponent: '🔍 Buscando oponente...',
            MatchWithdraw: '🏳️ ¡Dibujar!',
            MatchWon: '👑 ¡Ganaste!',
            MatchLost: '⭕️ ¡Perdiste!',
            MatchOver: 'El partido ha terminado',
            YourTurn: '🟢 Tu turno',
            OpponentTurn: '⏳ Turno del oponente',
            NoMoves: '🔴 No hay movimientos disponibles',
            OpponentNoMoves: '🔒 Oponente bloqueado',
            OpponentEliminated: '☠️ ¡Oponente eliminado!',
            OpponentLeft: '🔌 El oponente abandonó el partido',
            SandboxToolEmptyNone: 'Célula',
            SandboxToolPlayer1: 'Jugador 1',
            SandboxToolPlayer2: 'Jugador 2',
            SandboxExport: 'Exportar a F12',
            Quit: 'Abandonar',
            PointsEarned: 'Puntos ganados',
            PointsToday: 'Puntos hoy',
            PointsTotal: 'Total de puntos',
            Points: 'Tus puntos de clasificación',
            TopPlayers_today: 'Mejores jugadores hoy',
            TopPlayers_total: 'Mejores jugadores',
            HowTo: 'Cómo jugar',
            HowToGameGoal: 'Gol del juego',
            HowToGameGoalText: 'El objetivo es cubrir tantos espacios del tablero con tu color como sea posible. Esto se hace moviendo, saltando y convirtiendo las piezas de tus oponentes',
            HowToMovement: 'Movimienot',
            HowToMovementText: 'Cuando sea tu turno de mover, simplemente selecciona la pieza que deseas mover haciendo clic en ella. Una vez seleccionada la pieza, toca un espacio vacío en el tablero al que quieras moverte. Un jugador debe hacer un movimiento si hay uno disponible. Es posible moverse un espacio en cualquier dirección o saltar dos espacios en cualquier dirección siempre que el destino esté vacío',
            HowToMovementCloneText: 'Si te mueves 1 espacio, clonas la pieza. Si saltas 2 espacios, mueves la pieza',
            HowToCapture: 'Captura',
            HowToCaptureText: 'Después de que un jugador captura un espacio vacío moviéndose o saltando, también se capturará cualquiera de las piezas de los oponentes que estén adyacentes a esa nueva ubicación.',
            HowToWin: 'Victorioso',
            HowToWinText: 'El juego termina cuando no hay espacios vacíos o cuando un jugador no puede moverse. Si un jugador no puede moverse, los espacios vacíos restantes son capturados por el otro jugador y el juego termina. El jugador con la mayoría de piezas en el tablero gana',
        }
    },
    de: {
        name: 'Deutsch',
        displayName: '🇩🇪',
        texts: {
            LogIn: 'Einloggen',
            Play: 'Spielen!',
            PlayAgain: 'Nochmal abspielen',
            PlaySandbox: 'Sandbox Map Editor',
            Connecting: '🌐 Verbinden...',
            SearchingOpponent: '🔍 Gegner gesucht...',
            MatchWithdraw: '🏳️ Unentschieden!',
            MatchWon: '👑 Du hast gewonnen!',
            MatchLost: '⭕️ Du hast verloren!',
            MatchOver: 'Das Spiel ist vorbei',
            YourTurn: '🟢 Du bist dran',
            OpponentTurn: '⏳ Gegner an der Reihe',
            NoMoves: '🔴 Keine Bewegungen verfügbar',
            OpponentNoMoves: '🔒 Der Gegner hat keine Züge zur Verfügung',
            OpponentEliminated: '☠️ Gegner wurde eliminiert!',
            OpponentLeft: '🔌 Der Gegner hat das Spiel verlassen',
            SandboxToolEmptyNone: 'Zelle',
            SandboxToolPlayer1: 'Spieler 1',
            SandboxToolPlayer2: 'Spieler 2',
            SandboxExport: 'Exportieren F12',
            Quit: 'Aufhören',
            PointsEarned: 'Punkte erhalten',
            PointsToday: 'Punkte heute',
            PointsTotal: 'Punkte insgesamt',
            Points: 'Ihre Ranglistenpunkte',
            TopPlayers_today: 'Top-Spieler heute',
            TopPlayers_total: 'Top-Spieler aller Zeiten',
            HowTo: 'Spielanleitung',
            HowToGameGoal: 'Ziel des Spiels',
            HowToGameGoalText: 'Das Ziel ist es, so viele Felder des Bretts wie möglich mit deiner Farbe zu bedecken. Dies geschieht durch Bewegen, Springen und Umwandeln der Steine deines Gegners',
            HowToMovement: 'Bewegung',
            HowToMovementText: 'Wenn Sie an der Reihe sind, wählen Sie einfach die Figur aus, die Sie bewegen möchten, indem Sie darauf klicken. Sobald die Figur ausgewählt ist, berühren Sie ein leeres Feld auf dem Brett, zu dem Sie wechseln möchten. Ein Spieler muss einen Zug machen, wenn einer verfügbar ist. Es ist möglich, sich ein Feld in eine beliebige Richtung zu bewegen oder zwei Felder in eine beliebige Richtung zu springen, solange das Ziel leer ist',
            HowToMovementCloneText: 'Wenn Sie sich 1 Feld bewegen, klonen Sie das Stück. Wenn Sie 2 Felder überspringen, bewegen Sie die Figur',
            HowToCapture: 'Erfassung',
            HowToCaptureText: 'Nachdem ein Spieler ein leeres Feld erobert hat, indem er sich entweder bewegt oder springt, werden alle gegnerischen Figuren, die an diesen neuen Ort angrenzen, ebenfalls erobert',
            HowToWin: 'Gewinnen',
            HowToWinText: 'Das Spiel endet, wenn es keine leeren Felder mehr gibt oder wenn ein Spieler sich nicht bewegen kann. Wenn ein Spieler sich nicht bewegen kann, werden die verbleibenden leeren Felder vom anderen Spieler erobert und das Spiel endet. Der Spieler mit den meisten Steinen auf dem Brett gewinnt',
        }
    },
    fr: {
        name: 'Français',
        displayName: '🇫🇷',
        texts: {
            LogIn: 'Connexion',
            Play: 'Jouer!',
            PlayAgain: 'Rejouer',
            PlaySandbox: 'Sandbox Map Editor',
            SearchingOpponent: '🌐 Recherche d\'adversaire...',
            MatchWithdraw: '🏳️ fin de partie avec match nul!',
            MatchWon: '👑 Tu as gagné!',
            MatchLost: '⭕️ Tu as perdu!',
            MatchOver: 'Le match est terminé',
            YourTurn: '🟢 À ton tour',
            OpponentTurn: '⏳ Tour de l\'adversaire',
            NoMoves: '🔴 Aucun déménagement disponible',
            OpponentNoMoves: '🔒 L\'adversaire n\'a pas de coups disponibles',
            OpponentEliminated: '☠️ L\'adversaire a été éliminé!',
            OpponentLeft: '🔌 L\'adversaire a quitté le match',
            SandboxToolEmptyNone: 'Cellule',
            SandboxToolPlayer1: 'Joueur 1',
            SandboxToolPlayer2: 'Joueur 2',
            SandboxExport: 'Exporter vers F12',
            Quit: 'Quitter',
            PointsEarned: 'Points gagnés',
            PointsToday: 'Points aujourd\'hui',
            PointsTotal: 'Total de points',
            Points: 'Vos points de classement',
            TopPlayers_today: 'Top aujourd\'hui',
            TopPlayers_total: 'Meilleurs joueurs',
            HowTo: 'Comment jouer',
            HowToGameGoal: 'But du jeu',
            HowToGameGoalText: 'Le but est de couvrir autant d\'espaces du plateau avec votre couleur que possible. Cela se fait en déplaçant, en sautant et en convertissant les pièces de vos adversaires',
            HowToMovement: 'Mouvement',
            HowToMovementText: 'Lorsque c\'est à votre tour de vous déplacer, sélectionnez simplement la pièce que vous souhaitez déplacer en cliquant dessus. Une fois la pièce sélectionnée, touchez un espace vide sur le plateau vers lequel vous souhaitez vous déplacer. Un joueur doit faire un coup s\'il y en a un de disponible. Il est possible de se déplacer d\'une case dans n\'importe quelle direction ou de sauter deux cases dans n\'importe quelle direction tant que la destination est vide',
            HowToMovementCloneText: 'Si vous vous déplacez d\'une case, vous clonez la pièce. Si vous sautez de 2 cases, vous déplacez la pièce',
            HowToCapture: 'Capture',
            HowToCaptureText: 'Après qu\'un joueur a capturé un espace vide en se déplaçant ou en sautant, toutes les pièces adverses adjacentes à ce nouvel emplacement seront également capturées',
            HowToWin: 'Gagnant',
            HowToWinText: 'Le jeu se termine lorsqu\'il n\'y a plus de cases vides ou lorsqu\'un joueur ne peut plus se déplacer. Si un joueur ne peut pas se déplacer, les espaces vides restants sont capturés par l\'autre joueur et la partie se termine. Le joueur avec la majorité des pièces sur le plateau gagne',
        }
    },
    ru: {
        name: 'Русский',
        displayName: '🇷🇺',
        texts: {
            LogIn: 'Войти',
            Play: 'Играть!',
            PlayAgain: 'Играть еще раз',
            PlaySandbox: 'Редактор карты',
            Connecting: '🌐 Подключение...',
            SearchingOpponent: '🔍 Поиск оппонента...',
            MatchWithdraw: '🏳️ Ничья!',
            MatchWon: '👑 Вы победили!',
            MatchLost: '⭕️ Вы проиграли!',
            MatchOver: 'Матч завершен',
            YourTurn: '🟢 Ваш ход',
            OpponentTurn: '⏳ Ход оппонента',
            NoMoves: '🔴 Не осталось ходов',
            OpponentNoMoves: '📌 Оппонент блокирован!',
            OpponentEliminated: '☠️ Оппонент уничтожен!',
            OpponentLeft: '🔌 Оппонент покинул игру',
            SandboxToolEmptyNone: 'Ячейка',
            SandboxToolPlayer1: 'Игрок 1',
            SandboxToolPlayer2: 'Игрок 2',
            SandboxExport: 'Экспорт в F12',
            Quit: 'Выйти',
            PointsEarned: 'Получено очков',
            PointsToday: 'Очков за сегодня',
            PointsTotal: 'Всего очков',
            Points: 'Ваши очки рейтинга',
            TopPlayers_today: 'Топ игроков сегодня',
            TopPlayers_total: 'Топ игроков',
            HowTo: 'Правила игры',
            HowToGameGoal: 'Цель игры',
            HowToGameGoalText: 'Цель игры в том, чтобы захватить как можно больше клеток доски своим цветом. Это делается путем клонирования, прыжков и захвата фишек оппонента.',
            HowToMovement: 'Как ходить',
            HowToMovementText: 'Кликните, чтобы выбрать фишку для хода. Затем кликните по пустой клетке рядом. Ходить можно на соседние пустые клетки или через одну. Вы обязаны сделать ход, если он есть.',
            HowToMovementCloneText: 'При ходе на соседнюю клетку - ваша фишка клонируется, а при ходе через клетку - прыгает',
            HowToCapture: 'Захват',
            HowToCaptureText: 'Фишка, которой вы ходите, захватывает все соседние клетки в конце хода',
            HowToWin: 'Победа',
            HowToWinText: 'Матч кончается, когда занято всё поле или один из игроков не может ходить. Если игрок не может ходить, все пустые клетки на поле автоматически отдаются оппоненту. Для победы вы должны иметь больше клеток, чем оппонент.',
        }
    },
}

type LocaleTextDict = {
    [key: string]: string
};

type LocaleDefinition = {
    name: string,
    displayName: string,
    texts: LocaleTextDict
};

type LocaleBriefDefinition = {
    lang: string,
    name: string,
    displayName: string,
};

type LocaleDefinitionList = {
    [key: string]: LocaleDefinition
}

export function getUserLang(): string {
    let userLang = localStorage.getItem('hexgame:lang') || navigator.language.split('-')[0];
    return (userLang in Locales) ? userLang : defaultLang;
}

export function getBriefLocalesList(): LocaleBriefDefinition[] {
    const list: LocaleBriefDefinition[] = [];

    Object.keys(Locales).forEach(lang => {
        list.push({
            lang,
            name: Locales[lang].name,
            displayName: Locales[lang].displayName,
        })
    })

    return list;
}

export function getLocaleTexts(): LocaleTextDict {
    return Locales[getUserLang()].texts;
};