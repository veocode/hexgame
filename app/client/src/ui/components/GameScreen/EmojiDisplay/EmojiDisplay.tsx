import React, { useState } from 'react';
import './EmojiDisplay.css';

export interface EmojisByPlayersDict {
    [key: number]: string | null
}

interface EmojiDisplayProps {
    emojis: EmojisByPlayersDict
};

export const EmojiDisplay: React.FC<EmojiDisplayProps> = ({ emojis }) => {
    const bubbles: JSX.Element[] = [];
    const sides: { [key: number]: string } = {
        1: 'left',
        2: 'right'
    };

    Object.keys(sides).forEach(key => {
        const playerTag = parseInt(key);
        const side = sides[playerTag];
        const state = emojis[playerTag] ? 'opened' : 'closed';

        bubbles.push(
            <div key={playerTag} className={`emoji-bubble ${side} ${state}`}>
                <div className='triangle'></div>
                <div className='body'>
                    <div className='emoji'>{emojis[playerTag]}</div>
                </div>
            </div>
        );
    })

    return (
        <div className='emoji-display'>
            {bubbles}
        </div>
    )
};
