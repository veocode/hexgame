import React from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import './LinkScreen.css';

const texts = getLocaleTexts();

interface LinkScreenProps {
    game: Game,
    url: string
};

export const LinkScreen: React.FC<LinkScreenProps> = ({ game, url }) => {
    return (
        <div className='link-screen screen'>
            <div className='message'>
                <div className='waiting'>{texts.LinkWait}</div>
                <div className='link'>
                    <div className='title'>{texts.LinkSend}:</div>
                    <div className='url'>
                        <code>
                            <a href={url} onClick={e => e.preventDefault()}>{url}</a>
                        </code>
                    </div>
                    <div className='hint'>{texts.LinkHint}</div>
                    <button onClick={() => game.cancelLinkedGame()}>{texts.LinkCancel}</button>
                </div>
            </div>
        </div>
    );
};
