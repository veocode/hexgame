import React from 'react';
import './ScoreCounter.css';

interface ScoreCounterProps {
    orientation: 'left' | 'right',
    nickname: string,
    score: number
};

export const ScoreCounter: React.FC<ScoreCounterProps> = ({ orientation, nickname, score }) => {
    return (
        <div className={`score-counter ${orientation}`}>
            <div className='icon'></div>
            <div className='score'>{score}</div>
            <div className='nickname'>{nickname}</div>
        </div>
    );
};
