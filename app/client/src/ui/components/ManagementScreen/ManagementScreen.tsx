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

    const players: JSX.Element[] = [];
    const matches: JSX.Element[] = [];

    if (stats?.players.count) {
        stats.players.list.forEach((player, index) => {
            players.push(
                <span key={index} className='player-name'>{player.nickname} ({player.lang})</span>
            )
        })
    }

    if (stats?.matches.count) {
        stats.matches.list.forEach((matchDescription, index) => {
            matches.push(
                <div key={index} className='match'>
                    <span className='player player-1'>{matchDescription.player1}</span>
                    <span className='vs'>vs</span>
                    <span className='player player-2'>{matchDescription.player2}</span>
                    <button onClick={() => game.startSpectating(matchDescription.id)}>👁</button>
                </div>
            )
        })
    }

    return (
        <div className='management-screen'>
            <div className='management-panel'>
                <h1>Live Stats</h1>
                <section>
                    <button onClick={() => game.searchAndStart()}>Play</button>
                    <button onClick={() => game.startSandbox()}>Map Editor</button>
                    <button onClick={() => game.setLoggedOut()}>Log out</button>
                </section>
                <section>
                    <h3>Summary</h3>
                    <div className='stat-table'>
                        <div className='row'>
                            <div className='name'>Players Online:</div>
                            <div className='value'>{stats?.players.count ?? '0'}</div>
                        </div>
                        <div className='row'>
                            <div className='name'>Bots Online:</div>
                            <div className='value'>{stats?.bots ?? '0'}</div>
                        </div>
                        <div className='row'>
                            <div className='name'>Admins Online:</div>
                            <div className='value'>{stats?.admins.count ?? '0'}</div>
                        </div>
                        <div className='row'>
                            <div className='name'>Matches in progress:</div>
                            <div className='value'>{stats?.matches.count ?? '0'}</div>
                        </div>
                    </div>
                </section>
                {players.length ?
                    <section>
                        <h3>Players</h3>
                        <div className='players-list'>{players}</div>
                    </section> : ''}
                {matches.length ?
                    <section>
                        <h3>Matches</h3>
                        <div className='matches-list'>{matches}</div>
                    </section> : ''}
            </div>
        </div>
    );
};
