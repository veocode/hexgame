import React from 'react';
import { GameScoreList, GameStateMessage } from '../../../../game/game';
import { PlayerTag } from '../../../../shared/player';
import { ScoreCounter } from '../ScoreCounter/StatePanel';
import './StatePanel.css';

interface StatePanelProps {
    stateMessage: GameStateMessage,
    scores: GameScoreList | null
};

export const StatePanel: React.FC<StatePanelProps> = ({ stateMessage, scores }) => {
    return (
        <div className='state-panel'>
            <ScoreCounter
                orientation='left'
                nickname={scores?.own.nickname || ''}
                score={scores?.own.score || 0}
            />
            <div className='center'>
                <div className='message'>
                    {stateMessage.text || '...'}
                </div>
            </div>
            <ScoreCounter
                orientation='right'
                nickname={scores?.opponent.nickname || ''}
                score={scores?.opponent.score || 0}
            />
        </div>
    );
};
