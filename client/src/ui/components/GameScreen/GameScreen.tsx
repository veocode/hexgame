import React, { useState } from 'react';
import { Game, GameResult, GameScoreList, GameStateMessage } from '../../../game/game';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from './HexField/HexField';
import { StatePanel } from './StatePanel/StatePanel';
import './GameScreen.css';

interface GameScreenProps {
    game: Game,
};

export const GameScreen: React.FC<GameScreenProps> = ({ game }) => {
    const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());
    const [stateMessage, setStateMessage] = useState<GameStateMessage>({ text: '', className: '' });
    const [matchScores, setMatchScores] = useState<GameScoreList | null>(game.getScores());
    const [gameResult, setGameResult] = useState<GameResult | null>(null);

    game.whenMapUpdated((updatedCells: HexMapCell[]) => {
        setCells(updatedCells);
    });

    game.whenStateMessageUpdated((stateMessage: GameStateMessage) => {
        setStateMessage({ ...stateMessage });
    });

    game.whenMatchScoreUpdated((scores: GameScoreList) => {
        console.log('whenMatchScoreUpdated', scores);
        setMatchScores(scores);
    });

    game.whenMatchOver((result: GameResult) => {
        setGameResult(result);
    });

    const resultBox = gameResult ? (
        <div className='result-wrap'>
            <div className='result-box'>
                <div className='message'>
                    {gameResult?.isWinner ? '👑 Вы победили!' : '⭕️ Вы проиграли!'}
                </div>
                <div className='button'>
                    <button onClick={() => game.searchAndStart()}>Играть еще раз</button>
                </div>
            </div>
        </div>
    ) : '';

    return (
        <div className='game-screen'>
            <StatePanel
                stateMessage={stateMessage}
                scores={matchScores}
            />
            <div className='game-field'>
                <HexField
                    width={game.getMap().getWidth()}
                    height={game.getMap().getHeight()}
                    cells={cells}
                    onCellClick={id => game.onCellClick(id)}
                    playerColors={game.getPlayerColors()}
                />
                {resultBox}
            </div>
        </div>
    );
};
