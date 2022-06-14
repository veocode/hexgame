import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import './LoginScreen.css';

const texts = getLocaleTexts();

interface LoginScreenProps {
    game: Game,
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ game }) => {
    const nicknameInput = useRef<HTMLInputElement>(null);
    const nickname = localStorage.getItem('hexgame:nickname') || 'unnamed';

    const onPlayClick = () => {
        const nickname = nicknameInput.current?.value || 'unnamed';
        localStorage.setItem('hexgame:nickname', nickname);
        game.searchAndStart(nickname);
    };

    const onSandboxClick = () => {
        game.startSandbox();
    }

    // const onLangSelect = (lang: string) => {
    //     localStorage.setItem('hexgame:lang', lang);
    //     window.location.reload();
    // }

    return (
        <div className='login-screen'>
            <div className='login-bg'></div>
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
