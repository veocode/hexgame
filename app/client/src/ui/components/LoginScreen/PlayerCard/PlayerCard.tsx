import React from 'react';
import { PlayerAuthInfo } from '../../../../game/player';
import './PlayerCard.css';


interface PlayerCardProps {
    info: PlayerAuthInfo
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ info }) => {
    const avatarUrl = info.avatarUrl || '#';

    return (
        <div className='player-card'>
            <div className='avatar' style={avatarUrl && avatarUrl !== '#' ? { backgroundImage: `url(${avatarUrl})` } : {}}></div>
            <div className='name'>{info.nickname}</div>
        </div>
    )
};
