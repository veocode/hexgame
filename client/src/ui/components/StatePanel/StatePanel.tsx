import React from 'react';
import { GameStateMessage } from "../../../game/game";
import './StatePanel.css';

interface StatePanelProps {
    stateMessage: GameStateMessage
};

export const StatePanel: React.FC<StatePanelProps> = ({ stateMessage }) => {
    return (
        <div className='state-panel'>
            <div className='col icon'>
                <div className={stateMessage.className}></div>
            </div>
            <div className='col message'>
                {stateMessage.text}
            </div>
            <div className='col timer'>
                <div className='timer-counter'></div>
            </div>
        </div>
    );
};
