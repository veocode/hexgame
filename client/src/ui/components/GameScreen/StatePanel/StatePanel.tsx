import React from 'react';
import { GameScoreList, GameStateMessage } from '../../../../game/game';
import { ScoreCounter } from '../ScoreCounter/StatePanel';
import './StatePanel.css';

interface StatePanelProps {
    scores: GameScoreList | null
};

export const StatePanel: React.FC<StatePanelProps> = ({ scores }) => {
    return (
        <div className='state-panel'>
            <div className='score-counters'>
                <ScoreCounter
                    orientation='left'
                    nickname={scores?.own.nickname || ''}
                    score={scores?.own.score || 0}
                />
                <div className='separator'></div>
                <ScoreCounter
                    orientation='right'
                    nickname={scores?.opponent.nickname || ''}
                    score={scores?.opponent.score || 0}
                />
            </div>
        </div>
    );
};
