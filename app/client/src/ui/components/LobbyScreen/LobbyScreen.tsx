import React, { useState } from 'react';
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
    const [currentPeriod, setCurrentPeriod] = useState<string>('today');

    const lobbyData = game.getLobbyData();

    const tops: JSX.Element[] = [];
    const topPeriods = ['today', 'total'];

    if (lobbyData) {
        topPeriods.forEach(period => {
            const playerRows: JSX.Element[] = [];
            if (period in lobbyData.topPlayers) {
                lobbyData.topPlayers[period].forEach((topPlayer, index) => {
                    playerRows.push(
                        <div className='row' key={index}>
                            <div className='place'>#{topPlayer.place}</div>
                            <div className='name nickname'>{topPlayer.name}</div>
                            <div className='value'>{topPlayer.points}</div>
                        </div>
                    )
                })

                tops.push(
                    <div className={`top scrollable${currentPeriod === period ? ' active' : ''}`}>
                        <div className='stat-table score-table'>
                            {playerRows}
                        </div>
                    </div>
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
                        <div className='stat-table player-points'>
                            <div className='row'>
                                <div className='name'>{texts.Points}: <b>{lobbyData?.score.total}</b></div>
                            </div>
                            <div className='row'>
                                <div className='name'>{texts.PointsToday}: <b>{lobbyData?.score.today}</b></div>
                            </div>
                        </div>
                        <button className='button-primary' onClick={() => game.searchAndStart()}>{texts.Play}</button>
                        <button className='button-secondary' onClick={() => game.startLinkedGame()}>{texts.LinkPlay}</button>
                        {game.getPlayer().isAdmin()
                            ? <button onClick={() => game.setManagement()}>Live Stats</button>
                            : <button onClick={() => game.setTutorial()}>{texts.HowTo}</button>
                        }
                    </div>
                </div>
                <div className='tops-panel'>
                    <div className="top-widget">
                        <div className='header'>
                            <div className='title'>{texts.TopPlayers}</div>
                            <ul className='periods'>
                                {topPeriods.map((period: string): JSX.Element =>
                                    <li
                                        className={`period${currentPeriod === period ? ' active' : ''}`}
                                        onClick={() => setCurrentPeriod(period)}
                                    >{texts[`TopPlayers_${period}`]}</li>
                                )}
                            </ul>
                        </div>
                        <div className='tops scrollable'>
                            {tops}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
