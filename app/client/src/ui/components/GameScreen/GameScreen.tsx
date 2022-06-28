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

    let resultBox: JSX.Element | null = null;

    if (matchResult) {
        const points = matchResult.pointsEarned;
        const signedPoints = points > 0 ? `+${points}` : `${points}`;
        const signClass = points > 0 ? 'positive' : 'negative';

        resultBox = (
            <div className='result-wrap'>
                <div className='result-box'>
                    <div className='message'>
                        {matchResult.message}
                    </div>
                    {points !== 0 && !match.isSpectating() ?
                        <div className='result-points'>
                            <div className='row'>
                                <div className='label'>{texts.PointsEarned}:</div>
                                <div className={`points ${signClass}`}>{signedPoints}</div>
                            </div>
                            <div className='row'>
                                <div className='label'>{texts.PointsToday}:</div>
                                <div className='points'>{matchResult.pointsToday}</div>
                            </div>
                            <div className='row'>
                                <div className='label'>{texts.PointsTotal}:</div>
                                <div className='points'>{matchResult.pointsTotal}</div>
                            </div>
                        </div>
                        : ''}
                    <div className='button'>
                        {match.isSpectating()
                            ? <button onClick={() => match.getGame().stopSpectating()}>{texts.Quit}</button>
                            : <div>
                                <button onClick={() => match.getGame().searchAndStart()}>{texts.PlayAgain}</button>
                                <button onClick={() => match.getGame().setLobby()}>{texts.Quit}</button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='game-screen screen'>
            <StatePanel
                scores={matchScores}
            />
            <EmojiDisplay emojis={emojis} />
            <div className='game-field'>
                <div className='state-message'>
                    <div className='message'>
                        {stateMessage.text || match.getInitialStateMessage()}
                    </div>
                </div>
                <HexField
                    width={match.getMap().getWidth()}
                    height={match.getMap().getHeight()}
                    cells={cells}
                    onCellClick={id => match.onCellClick(id)}
                    playerColors={match.getPlayerColors()}
                />
                {match.isSpectating() ?
                    <div className='spectator-panel'>
                        <span>Spectator Mode</span>
                        <button onClick={() => match.getGame().stopSpectating()}>Quit</button>
                    </div> : ''}
                {resultBox}
            </div>
            {(!isEmojisLocked && !match.isSpectating()) ? <EmojiSelector onSelected={emoji => match.sendEmoji(emoji)} /> : ''}
        </div>
    );
};
