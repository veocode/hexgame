import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import './LoginScreen.css';

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

    return (
        <div className='login-screen'>
            <h1>hexgame</h1>
            <div className='login-form'>
                <div className='inputs'>
                    <input type='text' defaultValue={nickname} ref={nicknameInput} />
                    <button onClick={() => onPlayClick()}>Play</button>
                </div>
            </div>
        </div>
    );
};
