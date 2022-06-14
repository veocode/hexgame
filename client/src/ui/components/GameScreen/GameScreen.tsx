import React, { useState } from 'react';
import { Game, GameResult, GameScoreList, GameStateMessage } from '../../../game/game';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from './HexField/HexField';
import { StatePanel } from './StatePanel/StatePanel';
import { getLocaleTexts } from '../../../game/locales';
import './GameScreen.css';

const texts = getLocaleTexts();

interface GameScreenProps {
    game: Game,
};

export const GameScreen: React.FC<GameScreenProps> = ({ game }) => {
    const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());
    const [stateMessage, setStateMessage] = useState<GameStateMessage>({ text: '', className: '' });
    const [matchScores, setMatchScores] = useState<GameScoreList | null>(game.getScores());
    const [gameResult, setGameResult] = useState<GameResult | null>(null);

    game.whenMapUpdated(setCells);
    game.whenStateMessageUpdated(setStateMessage);
    game.whenMatchScoreUpdated(setMatchScores);
    game.whenMatchOver(setGameResult);

    const resultBox = gameResult ? (
        <div className='result-wrap'>
            <div className='result-box'>
                <div className='message'>
                    {gameResult.isWithdraw
                        ? texts.MatchWithdraw
                        : (gameResult.isWinner ? texts.MatchWon : texts.MatchLost)}
                </div>
                <div className='button'>
                    <button onClick={() => game.searchAndStart()}>{texts.PlayAgain}</button>
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
