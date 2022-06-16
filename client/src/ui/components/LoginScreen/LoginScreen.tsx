import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import { LocaleSelector } from './LocaleSelector/LocaleSelector';
import './LoginScreen.css';

const texts = getLocaleTexts();

interface LoginScreenProps {
    game: Game,
};

const getRandomNickname = () => {
    const randomId = (Math.floor(Math.random() * 90000) + 11111);
    return `guest-${randomId}`;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ game }) => {
    const nicknameInput = useRef<HTMLInputElement>(null);
    const nickname = localStorage.getItem('hexgame:nickname') || getRandomNickname();

    const onPlayClick = () => {
        const nickname = nicknameInput.current?.value || 'unnamed';
        localStorage.setItem('hexgame:nickname', nickname);
        game.searchAndStart(nickname);
    };

    return (
        <div className='login-screen'>
            <div className='login-bg'></div>
            <LocaleSelector />
            <div className='login-form'>
                <div className='inputs'>
                    <h1><b>hex</b>game</h1>
                    <input type='text' max={10} defaultValue={nickname} ref={nicknameInput} />
                    <button onClick={() => onPlayClick()} className='button-play'>{texts.Play}</button>
                    <button onClick={() => game.setTutorial()}>{texts.HowTo}</button>
                </div>
            </div>
            <div className='footer'>
                made with ❤️ by <a href="mailto:me@veocode.ru">veocode</a>
            </div>
        </div>
    );
};
