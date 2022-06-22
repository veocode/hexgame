import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import { LocaleSelector } from './LocaleSelector/LocaleSelector';
import { PlayerCard } from './PlayerCard/PlayerCard';
import './LoginScreen.css';

const texts = getLocaleTexts();

interface LoginScreenProps {
    game: Game,
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ game }) => {
    const nicknameInput = useRef<HTMLInputElement>(null);
    const nickname = game.getPlayer().authInfo.nickname;

    const onPlayClick = () => {
        if (game.getPlayer().isGuest()) {
            const nickname = (nicknameInput.current?.value || 'unnamed').substring(0, 12);
            localStorage.setItem('hexgame:nickname', nickname);
            game.getPlayer().authInfo.nickname = nickname;
        }
        game.connectAndStart();
    };

    let userInput: JSX.Element = game.getPlayer().isGuest()
        ? <input type='text' maxLength={12} defaultValue={nickname} ref={nicknameInput} />
        : <PlayerCard info={game.getPlayer().authInfo} />;

    return (
        <div className='login-screen'>
            <LocaleSelector />
            <div className='login-form'>
                <div className='inputs'>
                    {game.getPlayer().authInfo.lang === 'ru'
                        ?
                        <div className='logo logo-ru'>
                            <span>Г</span>
                            <span className='e'>
                                <span className='bg pulse'></span>
                                <span className='bg'></span>
                                <span className='letter'>E</span>
                            </span>
                            <span>К</span>
                            <span>С</span>
                        </div>
                        :
                        <div className='logo logo-en'>
                            <span>H</span>
                            <span className='e'>
                                <span className='bg pulse'></span>
                                <span className='bg'></span>
                                <span className='letter'>E</span>
                            </span>
                            <span>X</span>
                        </div>
                    }
                    {userInput}
                    <button onClick={() => onPlayClick()} className='button-play'>{texts.Play}</button>
                    <button onClick={() => game.setTutorial()}>{texts.HowTo}</button>
                </div>
            </div>
            <div className='footer'>
                {/* made with ❤️ by <a href="mailto:me@veocode.ru">veocode</a> */}
            </div>
        </div>
    );
};
