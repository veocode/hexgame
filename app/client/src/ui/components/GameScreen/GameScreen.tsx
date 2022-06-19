import React, { useState } from 'react';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from './HexField/HexField';
import { StatePanel } from './StatePanel/StatePanel';
import { getLocaleTexts } from '../../../game/locales';
import './GameScreen.css';
import { Match, MatchResult, MatchScoreDict, MatchStateMessage } from '../../../game/match';
import { EmojiSelector } from './EmojiSelector/EmojiSelector';
import { EmojiDisplay, EmojisByPlayersDict } from './EmojiDisplay/EmojiDisplay';

const texts = getLocaleTexts();

interface GameScreenProps {
    match: Match,
};

export const GameScreen: React.FC<GameScreenProps> = ({ match }) => {
    const [cells, setCells] = useState<HexMapCell[]>(match.getMap().getCells());
    const [stateMessage, setStateMessage] = useState<MatchStateMessage>({ text: '' });
    const [matchScores, setMatchScores] = useState<MatchScoreDict | null>(match.getScores());
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [emojis, setEmojis] = useState<EmojisByPlayersDict>(match.getCurrentEmojis());
    const [isEmojisLocked, setEmojisLocked] = useState<boolean>(match.isEmojisLockedForCooldown());

    match.whenMapUpdated(setCells);
    match.whenStateMessageUpdated(setStateMessage);
    match.whenScoreUpdated(setMatchScores);
    match.whenOver(setMatchResult);

    match.whenEmojisUpdated(setEmojis);
    match.whenEmojisLockUpdated(setEmojisLocked);

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
            <EmojiDisplay emojis={emojis} />
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
                {!isEmojisLocked ? <EmojiSelector onSelected={emoji => match.sendEmoji(emoji)} /> : ''}
                {resultBox}
            </div>
        </div>
    );
};
