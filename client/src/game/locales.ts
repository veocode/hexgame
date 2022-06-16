const defaultLang = 'en';

const Locales: LocaleDefinitionList = {
    en: {
        name: 'English',
        displayName: '🇺🇸',
        texts: {
            Play: 'Play!',
            PlayAgain: 'Play Again',
            PlaySandbox: 'Sandbox Map Editor',
            SearchingOpponent: '🌐 Searching for opponent...',
            MatchWithdraw: '🏳️ Draw!',
            MatchWon: '👑 You won!',
            MatchLost: '⭕️ You lost!',
            MatchOver: 'Match is Over',
            YourTurn: '🟢 Your turn',
            OppoentTurn: '⏳ Opponent\'s turn',
            NoMoves: '🔴 No moves available',
            OpponentNoMoves: '🔒 Opponent has no moves available',
            OpponentEliminated: '☠️ Opponent has been eliminated!',
            OpponentLeft: '🔌 Opponent has left the match',
            SandboxToolEmptyNone: 'Cell',
            SandboxToolPlayer1: 'Player 1',
            SandboxToolPlayer2: 'Player 2',
            SandboxExport: 'Export to F12',
            Quit: 'Quit',
            howTo: 'How to Play',
            howToGameGoal: 'Goal of the Game',
            howToGameGoalText: 'The goal is to cover as many spaces of the board with your color as possible. This is done by moving, jumping, and converting your opponents peices.',
            howToMovement: 'Movement',
            howToMovementText: 'When it is your turn to move, simply select the piece that you wish to move by clicking on it. Once the piece is selected, touch an empty space on the board you want to move to. A player must make a move if one is available. It is possible to move one space in any direction or jump two spaces in any direction as long as the the destination is empty.',
            howToMovementCloneText: 'If you move 1 space, you clone the piece',
            howToMovementJumpText: 'If you jump 2 spaces, you move the piece',
            howToCapture: 'Capture',
            howToCaptureText: 'After a player captures an empty space by either moving or jumping, any of the opponents pieces that are adjacent to that new location will also be captured.',
            howToWin: 'Winning',
            howToWinText: 'The game ends when there are no empty spaces or when one player cannot move. If a player cannot move, the remaining empty spaces are captured by the other player and the game ends. The player with the majority of pieces on the board wins.',
        }
    },
    de: {
        name: 'Deutsch',
        displayName: '🇩🇪',
        texts: {
            Play: 'Spielen!',
            PlayAgain: 'Nochmal abspielen',
            PlaySandbox: 'Sandbox Map Editor',
            SearchingOpponent: '🌐 Gegner gesucht...',
            MatchWithdraw: '🏳️ Unentschieden!',
            MatchWon: '👑 Du hast gewonnen!',
            MatchLost: '⭕️ Du hast verloren!',
            MatchOver: 'Das Spiel ist vorbei',
            YourTurn: '🟢 Du bist dran',
            OppoentTurn: '⏳ Gegner an der Reihe',
            NoMoves: '🔴 Keine Bewegungen verfügbar',
            OpponentNoMoves: '🔒 Der Gegner hat keine Züge zur Verfügung',
            OpponentEliminated: '☠️ Gegner wurde eliminiert!',
            OpponentLeft: '🔌 Der Gegner hat das Spiel verlassen',
            SandboxToolEmptyNone: 'Zelle',
            SandboxToolPlayer1: 'Spieler 1',
            SandboxToolPlayer2: 'Spieler 2',
            SandboxExport: 'Exportieren F12',
            Quit: 'Aufhören',
        }
    },
    fr: {
        name: 'Français',
        displayName: '🇫🇷',
        texts: {
            Play: 'Jouer!',
            PlayAgain: 'Rejouer',
            PlaySandbox: 'Sandbox Map Editor',
            SearchingOpponent: '🌐 Recherche d\'adversaire...',
            MatchWithdraw: '🏳️ fin de partie avec match nul!',
            MatchWon: '👑 Tu as gagné!',
            MatchLost: '⭕️ Tu as perdu!',
            MatchOver: 'Le match est terminé',
            YourTurn: '🟢 À ton tour',
            OppoentTurn: '⏳ Tour de l\'adversaire',
            NoMoves: '🔴 Aucun déménagement disponible',
            OpponentNoMoves: '🔒 L\'adversaire n\'a pas de coups disponibles',
            OpponentEliminated: '☠️ L\'adversaire a été éliminé!',
            OpponentLeft: '🔌 L\'adversaire a quitté le match',
            SandboxToolEmptyNone: 'Cellule',
            SandboxToolPlayer1: 'Joueur 1',
            SandboxToolPlayer2: 'Joueur 2',
            SandboxExport: 'Exporter vers F12',
            Quit: 'Quitter',
        }
    },
    ru: {
        name: 'Русский',
        displayName: '🇷🇺',
        texts: {
            Play: 'Играть!',
            PlayAgain: 'Играть еще раз',
            PlaySandbox: 'Редактор карты',
            SearchingOpponent: '🌐 Поиск противника...',
            MatchWithdraw: '🏳️ Ничья!',
            MatchWon: '👑 Вы победили!',
            MatchLost: '⭕️ Вы проиграли!',
            MatchOver: 'Матч завершен',
            YourTurn: '🟢 Ваш ход',
            OppoentTurn: '⏳ Ходит противник',
            NoMoves: '🔴 Не осталось ходов',
            OpponentNoMoves: '🔒 Соперник не имеет ходов!',
            OpponentEliminated: '☠️ Соперник уничтожен!',
            OpponentLeft: '🔌 Соперник покинул игру',
            SandboxToolEmptyNone: 'Ячейка',
            SandboxToolPlayer1: 'Игрок 1',
            SandboxToolPlayer2: 'Игрок 2',
            SandboxExport: 'Экспорт в F12',
            Quit: 'Выйти',
            howTo: 'Как играть?',
            howToGameGoal: 'Цель игры',
            howToGameGoalText: 'Цель игры в том, чтобы захватить как можно больше клеток доски своим цветом. Это делается путем клонирования, прыжков и захвата фишек оппонента.',
            howToMovement: 'Как ходить',
            howToMovementText: 'Кликните, чтобы выбрать фишку для хода. Затем кликните по пустой клетке рядом. Ходить можно на соседние пустые клетки или через одну. Вы обязаны сделать ход, если он есть.',
            howToMovementCloneText: 'При ходе на соседнюю клетку - ваша фишка клонируется',
            howToMovementJumpText: 'При ходе через клетку - ваша фишка прыгает',
            howToCapture: 'Захват',
            howToCaptureText: 'После хода клетка, на которую вы сходили, захватывает все соседние клетки, окрашивая их в ваш цвет',
            howToWin: 'Победа',
            howToWinText: 'Матч кончается, когда занято всё поле или один из игроков не может ходить. Если игрок не может ходить, все пустые клетки на поле автоматически отдаются оппоненту. Для победы вы должны иметь больше клеток, чем оппонент.',
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