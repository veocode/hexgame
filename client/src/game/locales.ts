const defaultLang = 'en';

type LocaleTextDict = {
    [key: string]: {
        [key: string]: string
    }
};

const LocaleTexts: LocaleTextDict = {
    ru: {
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
    },

    en: {
        Play: 'Play!',
        PlayAgain: 'Play Again',
        PlaySandbox: 'Sandbox Map Editor',
        SearchingOpponent: '🌐 Searching for opponent...',
        MatchWithdraw: '🏳️ Draw!',
        MatchWon: '👑 You have won!',
        MatchLost: '⭕️ You have lost!',
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
    },
}

export const getLocaleTexts = () => {
    let userLang = localStorage.getItem('hexgame:lang') || navigator.language.split('-')[0];
    if (!(userLang in LocaleTexts)) userLang = defaultLang;
    return LocaleTexts[userLang];
};