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
            OpponentTurn: '⏳ Opponent\'s turn',
            NoMoves: '🔴 No moves available',
            OpponentNoMoves: '🔒 Opponent has no moves available',
            OpponentEliminated: '☠️ Opponent has been eliminated!',
            OpponentLeft: '🔌 Opponent has left the match',
            SandboxToolEmptyNone: 'Cell',
            SandboxToolPlayer1: 'Player 1',
            SandboxToolPlayer2: 'Player 2',
            SandboxExport: 'Export to F12',
            Quit: 'Quit',
            HowTo: 'Instructions',
            HowToGameGoal: 'Goal of the Game',
            HowToGameGoalText: 'The goal is to cover as many spaces of the board with your color as possible. This is done by moving, jumping, and converting your opponents peices.',
            HowToMovement: 'Movement',
            HowToMovementText: 'When it is your turn to move, simply select the piece that you wish to move by clicking on it. Once the piece is selected, touch an empty space on the board you want to move to. A player must make a move if one is available. It is possible to move one space in any direction or jump two spaces in any direction as long as the the destination is empty.',
            HowToMovementCloneText: 'If you move 1 space, you clone the piece',
            HowToMovementJumpText: 'If you jump 2 spaces, you move the piece',
            HowToCapture: 'Capture',
            HowToCaptureText: 'After a player captures an empty space by either moving or jumping, any of the opponents pieces that are adjacent to that new location will also be captured.',
            HowToWin: 'Winning',
            HowToWinText: 'The game ends when there are no empty spaces or when one player cannot move. If a player cannot move, the remaining empty spaces are captured by the other player and the game ends. The player with the majority of pieces on the board wins.',
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
        }
    },
    ru: {
        name: 'Русский',
        displayName: '🇷🇺',
        texts: {
            Play: 'Играть!',
            PlayAgain: 'Играть еще раз',
            PlaySandbox: 'Редактор карты',
            SearchingOpponent: '🌐 Поиск оппонента...',
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