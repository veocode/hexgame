import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import { Logo } from '../App/Logo/Logo';
import { PlayerCard } from '../LoginScreen/PlayerCard/PlayerCard';
import './LobbyScreen.css';

const texts = getLocaleTexts();

interface LobbyScreenProps {
    game: Game,
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ game }) => {
    const lobbyData = game.getLobbyData();

    const tops: JSX.Element[] = [];

    if (lobbyData) {
        const periods = ['today', 'total'];

        periods.forEach(period => {
            const playerRows: JSX.Element[] = [];
            if (period in lobbyData.topPlayers) {
                lobbyData.topPlayers[period].forEach((topPlayer, index) => {
                    playerRows.push(
                        <div className='row' key={index}>
                            <div className='place'>#{topPlayer.place}</div>
                            <div className='name nickname'>{topPlayer.name} - <b>{topPlayer.points}</b></div>
                        </div>
                    )
                })

                tops.push(
                    <section key={period} className={`top-${period}`}>
                        <div className='top'>
                            <h3>{texts[`TopPlayers_${period}`]}</h3>
                            <div className='stat-table score-table'>
                                {playerRows}
                            </div>
                        </div>
                    </section>
                )
            }
        })
    }

    return (
        <div className='lobby-screen screen scrollable'>
            <div className='header'>
                <Logo lang={game.getPlayer().authInfo.lang} scale={0.5} margin={5} />
            </div>
            <div className='body'>
                <div className='player-panel-col'>
                    <div className='player-panel'>
                        <PlayerCard info={game.getPlayer().authInfo} />
                        <div className='stat-table' style={{ width: '300px' }}>
                            <div className='row'>
                                <div className='name'>{texts.Points}:</div>
                                <div className='value'>{lobbyData?.score.total}</div>
                            </div>
                        </div>
                        <button className='button-primary' onClick={() => game.searchAndStart()}>{texts.Play}</button>
                        {game.getPlayer().isAdmin()
                            ? <button onClick={() => game.setManagement()}>Live Stats</button>
                            : <button onClick={() => game.setTutorial()}>{texts.HowTo}</button>
                        }
                    </div>
                </div>
                <div className='tops-panel scrollable'>
                    {tops}
                </div>
            </div>
        </div>
    );
};
