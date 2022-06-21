import React from 'react';
import { PlayerInfo } from '../../../../game/player';
import './PlayerCard.css';


interface PlayerCardProps {
    info: PlayerInfo
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ info }) => {
    const avatarUrl = info.avatarUrl || '#';

    return (
        <div className='player-card'>
            <div className='avatar' style={{ backgroundImage: `url(${avatarUrl})` }}></div>
            <div className='name'>{info.nickname}</div>
        </div>
    )
};
