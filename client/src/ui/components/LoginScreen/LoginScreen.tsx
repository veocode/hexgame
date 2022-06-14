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

    const onSandboxClick = () => {
        game.startSandbox();
    }

    return (
        <div className='login-screen'>
            <div className='login-bg'></div>
            <LocaleSelector />
            <div className='login-form'>
                <div className='inputs'>
                    <h1><b>hex</b>game</h1>
                    <input type='text' defaultValue={nickname} ref={nicknameInput} />
                    <button onClick={() => onPlayClick()}>{texts.Play}</button>
                    <button onClick={() => onSandboxClick()}>{texts.PlaySandbox}</button>
                </div>
            </div>
        </div>
    );
};
