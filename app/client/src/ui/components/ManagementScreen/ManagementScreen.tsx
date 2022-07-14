import React from 'react';
import { Game } from '../../../game/game';
import './ManagementScreen.css';

interface ManagementScreenProps {
    game: Game,
};

export const ManagementScreen: React.FC<ManagementScreenProps> = ({ game }) => {
    return (
        <div className='management-screen'>
            <div className='management-panel'>
                <h1>Admin Area</h1>
                <section>
                    <button onClick={() => game.setLobby()}>Lobby</button>
                    <button onClick={() => game.startSandbox()}>Maps</button>
                    <button onClick={() => game.setLoggedOut()}>Logout</button>
                </section>
            </div>
        </div>
    );
};
