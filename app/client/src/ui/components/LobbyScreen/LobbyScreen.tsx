import React, { useState } from 'react';
import { Game, GameServerStats } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import { Logo } from '../App/Logo/Logo';
import { PlayerCard } from '../LoginScreen/PlayerCard/PlayerCard';
import './LobbyScreen.css';

const texts = getLocaleTexts();

interface LobbyScreenProps {
    game: Game,
};

enum LobbyTabs {
    MatchesAndPlayers,
    TopPlayers
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ game }) => {
    const [tab, setTab] = useState<LobbyTabs>(LobbyTabs.MatchesAndPlayers);
    const [topPeriodTab, setTopPeriodTab] = useState<string>('today');
    const [stats, setStats] = useState<GameServerStats | null>(null);

    game.whenStatsUpdated((stats: GameServerStats) => setStats(stats));

    const lobbyData = game.getLobbyData();

    const players: JSX.Element[] = [];
    const matches: JSX.Element[] = [];

    const tops: JSX.Element[] = [];
    const topPeriods = ['today', 'total'];

    if (lobbyData && tab === LobbyTabs.TopPlayers) {
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
                    <div className={`top scrollable${topPeriodTab === period ? ' active' : ''}`}>
                        <div className='stat-table score-table'>
                            {playerRows}
                        </div>
                    </div>
                )
            }
        })
    }

    if (stats?.matches.length && tab === LobbyTabs.MatchesAndPlayers) {
        stats.matches.forEach((matchDescription, index) => {
            matches.push(
                <div key={index} className='row'>
                    {matchDescription.hasBot
                        ?
                        <div className='text'>
                            <span className='player'>👤 {matchDescription.player1.nickname}</span>
                            <span className='vs'>vs</span>
                            <span className='player'>🤖 {matchDescription.player2.nickname}</span>
                        </div>
                        :
                        <div className='text'>
                            <span className='player'>👤 {matchDescription.player1.nickname}</span>
                            <span className='vs'>vs</span>
                            <span className='player'>👤 {matchDescription.player2.nickname}</span>
                        </div>
                    }
                    <div className='actions'>
                        <button
                            className='btn-spectate'
                            title={'Spectate'}
                            onClick={() => game.startSpectating(matchDescription.id)}
                        >👁</button>
                        {matchDescription.hasBot &&
                            <button
                                className='btn-play button-primary'
                                title={'Offer to Play'}
                                onClick={() => game.sendInviteToPlayer(matchDescription.player1.id, matchDescription.player1.nickname)}
                            >💬</button>}
                    </div>
                </div>
            )
        })
    }

    if (stats?.idlePlayers.length && tab === LobbyTabs.MatchesAndPlayers) {
        stats.idlePlayers.forEach((playerDescription, index) => {
            if (playerDescription.nickname === game.getPlayer().authInfo.nickname) return;
            matches.push(
                <div key={stats?.matches.length + index} className='row'>
                    <div className='text'>
                        <span className='player'>👤 {playerDescription.nickname}</span>
                    </div>
                    <div className='actions'>
                        <button
                            className='btn-play button-primary'
                            title={'Offer to Play'}
                            onClick={() => game.sendInviteToPlayer(playerDescription.id, playerDescription.nickname)}
                        >💬</button>
                    </div>
                </div>
            )
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
                                <div className='name'>{texts.Points}: <b>{lobbyData?.score.total || '0'}</b></div>
                            </div>
                            <div className='row'>
                                <div className='name'>{texts.PointsToday}: <b>{lobbyData?.score.today || '0'}</b></div>
                            </div>
                        </div>
                        <button className='button-primary' onClick={() => game.startWithBot()}>{texts.PlayWithBot}</button>
                        <button className='button-secondary' onClick={() => game.startLinkedGame()}>{texts.LinkPlay}</button>
                        {tab === LobbyTabs.MatchesAndPlayers
                            ? <button className='button' onClick={() => setTab(LobbyTabs.TopPlayers)}>{texts.TopPlayers}</button>
                            : <button className='button' onClick={() => setTab(LobbyTabs.MatchesAndPlayers)}>{texts.PlayWithHuman}</button>
                        }
                    </div>
                </div>
                {tab === LobbyTabs.MatchesAndPlayers
                    ?
                    <div className='tops-panel'>
                        <div className="top-widget">
                            <div className='header'>
                                <div className='title'>{texts.MatchesAndPlayers}</div>
                            </div>
                            <div className='tops scrollable'>
                                {matches.length > 0
                                    ?
                                    <div className='matches-list'>{matches}</div>
                                    :
                                    <div className='empty'>
                                        {texts.NoOnline}
                                    </div>
                                }

                            </div>
                        </div>
                    </div>
                    :
                    <div className='tops-panel'>
                        <div className="top-widget">
                            <div className='header'>
                                <div className='title'>{texts.TopPlayers}</div>
                                <ul className='periods'>
                                    {topPeriods.map((period: string): JSX.Element =>
                                        <li
                                            className={`period${topPeriodTab === period ? ' active' : ''}`}
                                            onClick={() => setTopPeriodTab(period)}
                                        >{texts[`TopPlayers_${period}`]}</li>
                                    )}
                                </ul>
                            </div>
                            <div className='tops scrollable'>
                                {tops}
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};
