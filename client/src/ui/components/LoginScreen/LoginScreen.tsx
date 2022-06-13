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
            <div className='login-form'>
                <div className='inputs'>
                    <h1><b>hex</b>game</h1>
                    <input type='text' defaultValue={nickname} ref={nicknameInput} />
                    <button onClick={() => onPlayClick()}>Играть</button>
                </div>
            </div>
        </div>
    );
};
