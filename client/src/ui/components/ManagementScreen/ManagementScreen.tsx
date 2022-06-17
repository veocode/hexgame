import React, { useState } from 'react';
import { Game, GameServerStats } from '../../../game/game';
import './ManagementScreen.css';

interface ManagementScreenProps {
    game: Game,
};

export const ManagementScreen: React.FC<ManagementScreenProps> = ({ game }) => {

    const [stats, setStats] = useState<GameServerStats | null>(null);

    game.whenStatsUpdated((stats: GameServerStats) => {
        setStats(stats);
    });

    return (
        <div className='management-screen'>
            <div className='management-panel'>
                <h1>Live Stats</h1>
                <section>
                    <div className='stat-table'>
                        <div className='row'>
                            <div className='name'>Players Online:</div>
                            <div className='value'>{stats?.players ?? '0'}</div>
                        </div>
                        <div className='row'>
                            <div className='name'>Bots Online:</div>
                            <div className='value'>{stats?.bots ?? '0'}</div>
                        </div>
                        <div className='row'>
                            <div className='name'>Admins Online:</div>
                            <div className='value'>{stats?.admins ?? '0'}</div>
                        </div>
                        <div className='row'>
                            <div className='name'>Matches in progress:</div>
                            <div className='value'>{stats?.matches ?? '0'}</div>
                        </div>
                    </div>
                </section>
                <section>
                    <button onClick={() => game.searchAndStart()}>Play</button>
                    <button onClick={() => game.setLoggedOut()}>Quit</button>
                </section>
            </div>
        </div>
    );
};
