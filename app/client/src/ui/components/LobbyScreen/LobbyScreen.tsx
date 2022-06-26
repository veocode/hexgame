import React, { useRef } from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
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
        const periods = ['total'];

        periods.forEach(period => {
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
                    <section key={period}>
                        <h3>{texts[`TopPlayers_${period}`]}</h3>
                        <div className='stat-table score-table'>
                            {playerRows}
                        </div>
                    </section>
                )
            }
        })
    }

    return (
        <div className='lobby-screen'>
            <div className='lobby-panel'>
                {game.getPlayer().authInfo.lang === 'ru'
                    ?
                    <div className='logo logo-ru'>
                        <span>Г</span>
                        <span className='e'>
                            <span className='bg pulse'></span>
                            <span className='bg'></span>
                            <span className='letter'>E</span>
                        </span>
                        <span>К</span>
                        <span>С</span>
                    </div>
                    :
                    <div className='logo logo-en'>
                        <span>H</span>
                        <span className='e'>
                            <span className='bg pulse'></span>
                            <span className='bg'></span>
                            <span className='letter'>E</span>
                        </span>
                        <span>X</span>
                    </div>
                }
                <section className='welcome'>
                    <PlayerCard info={game.getPlayer().authInfo} />
                    <div className='stat-table' style={{ width: '300px' }}>
                        <div className='row'>
                            <div className='name'>{texts.Points}:</div>
                            <div className='value'>{lobbyData?.score.total}</div>
                        </div>
                    </div>
                    <button className='button button-play' onClick={() => game.searchAndStart()}>{texts.Play}</button>
                    <button onClick={() => game.setTutorial()}>{texts.HowTo}</button>
                </section>
                {tops}
            </div>
        </div>
    );
};
