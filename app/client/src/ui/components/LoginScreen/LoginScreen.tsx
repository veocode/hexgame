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
    const nickname = game.getPlayer().info.nickname;

    const onPlayClick = () => {
        const nickname = (nicknameInput.current?.value || 'unnamed').substring(0, 12);
        localStorage.setItem('hexgame:nickname', nickname);
        game.getPlayer().info.nickname = nickname;
        game.connectAndStart();
    };

    let userInput: JSX.Element = game.getPlayer().isGuest()
        ? <input type='text' maxLength={12} defaultValue={nickname} ref={nicknameInput} />
        : <PlayerCard info={game.getPlayer().info} />;

    return (
        <div className='login-screen'>
            <div className='login-bg'></div>
            <div className='login-bg bg-2'></div>
            <div className='login-bg bg-3'></div>
            <LocaleSelector />
            <div className='login-form'>
                <div className='inputs'>
                    <h1>play<b>hex</b></h1>
                    {userInput}
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
