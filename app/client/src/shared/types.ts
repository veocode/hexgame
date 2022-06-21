export interface Point2D {
    x: number,
    y: number
};

export enum PlayerTag {
    Player1 = 1,
    Player2 = 2,
};

export enum PlayerHasNoMovesReasons {
    Left = 'left',
    Eliminated = 'eliminated',
    NoMoves = 'no-moves'
}

export type PlayerColorsList = { [key: number]: string }
