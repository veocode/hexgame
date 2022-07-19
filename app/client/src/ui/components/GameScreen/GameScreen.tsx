import React, { useState } from 'react';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from './HexField/HexField';
import { StatePanel } from './StatePanel/StatePanel';
import { getLocaleTexts } from '../../../game/locales';
import { Match, MatchScoreDict, MatchStateMessage } from '../../../game/match';
import { EmojiSelector } from './EmojiSelector/EmojiSelector';
import { EmojiDisplay, EmojisByPlayersDict } from './EmojiDisplay/EmojiDisplay';
import { ResultBox } from './ResultBox/ResultBox';
import './GameScreen.css';
import { Surrender } from './Surrender/Surrender';

const texts = getLocaleTexts();

interface GameScreenProps {
    match: Match,
};

export const GameScreen: React.FC<GameScreenProps> = ({ match }) => {
    const [cells, setCells] = useState<HexMapCell[]>(match.getMap().getCells());
    const [stateMessage, setStateMessage] = useState<MatchStateMessage>({ text: '' });
    const [matchScores, setMatchScores] = useState<MatchScoreDict | null>(match.getScores());
    const [emojis, setEmojis] = useState<EmojisByPlayersDict>(match.getCurrentEmojis());
    const [isEmojisLocked, setEmojisLocked] = useState<boolean>(match.isEmojisLockedForCooldown());
    const [spectatorCount, setSpectatorCount] = useState<number>(0);

    match.whenMapUpdated(setCells);
    match.whenStateMessageUpdated(setStateMessage);
    match.whenScoreUpdated(setMatchScores);

    match.whenEmojisUpdated(setEmojis);
    match.whenEmojisLockUpdated(setEmojisLocked);

    match.whenSpectatorCountUpdated(setSpectatorCount);

    return (
        <div className='game-screen screen'>
            <StatePanel
                scores={matchScores}
            />
            <EmojiDisplay emojis={emojis} />
            <div className='game-wrap'>
                <div className='state-message'>
                    <div className='message'>
                        {stateMessage.text || match.getInitialStateMessage()}
                    </div>
                </div>
                <div className='game-field'>
                    <HexField
                        width={match.getMap().getWidth()}
                        height={match.getMap().getHeight()}
                        cells={cells}
                        onCellClick={id => match.onCellClick(id)}
                        playerColors={match.getPlayerColors()}
                    />
                    <div className='actions-panel'>
                        <div className={`spectator-counter ${spectatorCount > 0 ? 'visible' : ''}`}>
                            <i className='icon icon-eye'></i> {Math.max(spectatorCount, 1)}
                        </div>
                        {!match.isSpectating() &&
                            <EmojiSelector onSelected={emoji => match.sendEmoji(emoji)} enabled={isEmojisLocked === false} />
                        }
                        {!match.isSpectating() &&
                            <Surrender onConfirmed={() => match.surrender()} enabled={!match.isSurrender() && match.getTurnCount() > 5} />
                        }
                        {match.isSpectating() &&
                            <button onClick={() => match.getGame().stopSpectating()} title={texts.Quit}>
                                <i className='icon icon-close'></i>
                            </button>
                        }
                    </div>
                </div>
            </div>
            <ResultBox match={match} />
        </div >
    );
};
