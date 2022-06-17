import React, { useState } from 'react';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from './HexField/HexField';
import { StatePanel } from './StatePanel/StatePanel';
import { getLocaleTexts } from '../../../game/locales';
import './GameScreen.css';
import { Match, MatchResult, MatchScoreDict, MatchStateMessage } from '../../../game/match';

const texts = getLocaleTexts();

interface GameScreenProps {
    match: Match,
};

export const GameScreen: React.FC<GameScreenProps> = ({ match }) => {
    const [cells, setCells] = useState<HexMapCell[]>(match.getMap().getCells());
    const [stateMessage, setStateMessage] = useState<MatchStateMessage>({ text: '' });
    const [matchScores, setMatchScores] = useState<MatchScoreDict | null>(match.getScores());
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

    match.whenMapUpdated(setCells);
    match.whenStateMessageUpdated(setStateMessage);
    match.whenScoreUpdated(setMatchScores);
    match.whenOver(setMatchResult);

    const resultBox = matchResult ? (
        <div className='result-wrap'>
            <div className='result-box'>
                <div className='message'>
                    {matchResult.isWithdraw
                        ? texts.MatchWithdraw
                        : (matchResult.isWinner ? texts.MatchWon : texts.MatchLost)}
                </div>
                <div className='button'>
                    <button onClick={() => match.getGame().searchAndStart()}>{texts.PlayAgain}</button>
                </div>
            </div>
        </div>
    ) : '';

    return (
        <div className='game-screen'>
            <StatePanel
                scores={matchScores}
            />
            <div className='game-field'>
                <div className='state-message'>
                    <div className='message'>
                        {stateMessage.text || '...'}
                    </div>
                </div>
                <HexField
                    width={match.getMap().getWidth()}
                    height={match.getMap().getHeight()}
                    cells={cells}
                    onCellClick={id => match.onCellClick(id)}
                    playerColors={match.getPlayerColors()}
                />
                {resultBox}
            </div>
        </div>
    );
};
