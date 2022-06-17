import React, { useState } from 'react';
import './EmojiSelector.css';

const emojis: string[] = ['😀', '👍', '☹️', '😡'];

enum State {
    Closed = 0,
    Closing,
    Opened,
    Opening
}

export type EmojiSelectedCallback = (emoji: string) => void;

interface EmojiSelectorProps {
    onSelected: EmojiSelectedCallback
};

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({ onSelected }) => {
    const [state, setState] = useState<State>(State.Closed);

    const open = () => {
        setState(State.Opening);
        setTimeout(() => setState(State.Opened), 400);
    }

    const close = () => {
        setState(State.Closing);
        setTimeout(() => setState(State.Closed), 400);
    }

    const toggle = () => {
        if (state === State.Closed) open();
        if (state === State.Opened) close();
    }

    const selectEmoji = (emoji: string) => {
        onSelected(emoji);
        close();
    }

    const classes = ['emoji-selector'];
    if (state === State.Opening) classes.push('opening');
    if (state === State.Closing) classes.push('closing');
    if (state === State.Closed) classes.push('closed');
    if (state === State.Opened) classes.push('opened');

    const emojiButtons: JSX.Element[] = [];
    emojis.forEach((emoji, index) => {
        emojiButtons.push(
            <button key={index} onClick={() => selectEmoji(emoji)}>{emoji}</button>
        );
    })

    return (
        <div className={classes.join(' ')}>
            <button onClick={() => toggle()} >😀</button>
            <div className='emoji-overlay' onClick={() => toggle()}></div>
            <div className='emoji-bar'>
                <div className='emoji-list'>
                    {emojiButtons}
                </div>
            </div>
        </div>
    );
};
