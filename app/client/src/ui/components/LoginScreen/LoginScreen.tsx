import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import { LocaleSelector } from './LocaleSelector/LocaleSelector';
import { PlayerCard } from './PlayerCard/PlayerCard';
import './LoginScreen.css';
import { Logo } from '../App/Logo/Logo';

const texts = getLocaleTexts();

interface LoginScreenProps {
    game: Game,
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ game }) => {
    const nicknameInput = useRef<HTMLInputElement>(null);
    const nickname = game.getPlayer().authInfo.nickname;

    const onPlayClick = async () => {
        if (game.getPlayer().isGuest()) {
            const nickname = (nicknameInput.current?.value || 'unnamed').substring(0, 12);
            localStorage.setItem('hexgame:nickname', nickname);
            game.getPlayer().authInfo.nickname = nickname;
        }
        await game.login();
    };

    let userInput: JSX.Element = game.getPlayer().isGuest()
        ? <input type='text' maxLength={12} defaultValue={nickname} ref={nicknameInput} />
        : <PlayerCard info={game.getPlayer().authInfo} />;

    return (
        <div className='login-screen screen'>
            <LocaleSelector />
            <div className='login-form'>
                <div className='inputs'>
                    <Logo lang={game.getPlayer().authInfo.lang} scale={0.85} />
                    {userInput}
                    {game.queryParams.get('g')
                        ? <button onClick={() => onPlayClick()} className='button-secondary'>{texts.LinkPlay}!</button>
                        : <button onClick={() => onPlayClick()} className='button-primary'>{texts.LogIn}</button>
                    }
                    <button onClick={() => game.setTutorial()}>{texts.HowTo}</button>
                    <div className='io-banner'>
                        {game.getPlayer().authInfo.lang == 'en' ? '🌐 Play more ' : '🌐 '}
                        <a href='https://iogames.space' target='_blank'>
                            io games
                        </a>
                    </div>
                </div>
            </div>
            {game.getPlayer().isGuest() ?
                <div className='footer'>
                    send feedback to <a href="mailto:me@veocode.ru">me@veocode.ru</a>
                </div> : ''}
        </div>
    );
};
