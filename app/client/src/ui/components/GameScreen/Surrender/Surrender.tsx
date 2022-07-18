import React, { useState } from 'react';
import { getLocaleTexts } from '../../../../game/locales';
import './Surrender.css';

const texts = getLocaleTexts();

enum State {
    Closed = 0,
    Closing,
    Opened,
    Opening
}
interface SurrenderProps {
    onConfirmed: SurrenderConfirmedCallback
};

export type SurrenderConfirmedCallback = () => void;

export const Surrender: React.FC<SurrenderProps> = ({ onConfirmed }) => {
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

    const classes = ['emoji-selector'];
    if (state === State.Opening) classes.push('opening');
    if (state === State.Closing) classes.push('closing');
    if (state === State.Closed) classes.push('closed');
    if (state === State.Opened) classes.push('opened');

    return (
        <div className={classes.join(' ')}>
            <button onClick={() => toggle()} ><i className='icon icon-flag'></i></button>
            <div className='emoji-overlay' onClick={() => toggle()}></div>
            <div className='emoji-bar'>
                <div className='title'>{texts.Surrender}</div>
                <div className='emoji-list'>
                    <button className='button-yes' onClick={() => onConfirmed()}>
                        <i className='icon icon-check'></i>
                    </button>
                    <button className='button-no' onClick={() => close()}>
                        <i className='icon icon-close'></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
