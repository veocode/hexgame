import React from 'react';
import { Game, GameResult } from '../../../game/game';
import './ResultScreen.css';

interface ResultScreenProps {
    game: Game
};

export const ResultScreen: React.FC<ResultScreenProps> = ({ game }) => {
    const result: GameResult | null = game.getResult();

    return (
        <div className='result-screen'>
            <div className='message'>
                {result?.isWinner ? 'Вы победили!' : 'Вы проиграли!'}
            </div>
            <div className='scores'>

            </div>
            <div className='button'>
                <button onClick={() => game.searchAndStart()}>Play Again</button>
            </div>
        </div>
    );
};
