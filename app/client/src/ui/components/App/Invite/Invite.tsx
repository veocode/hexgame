import React, { useState } from 'react';
import { Game, GameInviteState } from '../../../../game/game';
import { getLocaleTexts } from '../../../../game/locales';
import './Invite.css';

const texts = getLocaleTexts();

interface InviteProps {
    game: Game
};

interface InviteStateWithMessage {
    state: GameInviteState,
    message?: string
}

const format = (format: string, value: string) => {
    return format.replaceAll('%s', value);
}

export const Invite: React.FC<InviteProps> = ({ game }) => {
    const [invite, setInvite] = useState<InviteStateWithMessage>({ state: GameInviteState.None });
    const inviteDetails = game.getInvite();

    game.whenInviteStateUpdated((state: GameInviteState, message?: string) => {
        setInvite({
            state,
            message
        });
    })

    if (invite.state === GameInviteState.None) {
        return (<div style={{ display: 'none' }}></div>);
    }

    let isBlink = false;
    let messageText = '';
    let buttonActions: { [title: string]: () => void } = {};

    if (invite.state === GameInviteState.Pending) {
        isBlink = true;
        messageText = format(texts.Inviting, `👤 ${inviteDetails.nickname}`);
        buttonActions[texts.Cancel] = () => game.cancelInvite();
    }

    if (invite.state === GameInviteState.Incoming) {
        isBlink = true;
        messageText = format(texts.Invitation, `👤 ${inviteDetails.nickname}`);
        buttonActions[texts.Accept] = () => game.acceptInvite();
        buttonActions[texts.Decline] = () => game.declineInvite();
    }

    if (invite.state === GameInviteState.Accepted) {
        isBlink = true;
        messageText = texts.Starting;
    }

    if (invite.state === GameInviteState.Declined) {
        messageText = format(texts.InvitationDeclined, `👤 ${inviteDetails.nickname}`);
        buttonActions[texts.Close] = () => game.cancelInvite();
    }

    if (invite.state === GameInviteState.Expired) {
        messageText = texts.InvitationExpired;
        buttonActions[texts.Close] = () => game.cancelInvite();
    }

    return (
        <div className='invite-wrap'>
            <div className={'invite-popup' + (isBlink ? ' blink' : '')}>
                <div className='message'>{messageText}</div>
                <div className='buttons'>
                    {Object.keys(buttonActions).map((title, index) =>
                        <button key={index} onClick={() => buttonActions[title]()}>{title}</button>
                    )}
                </div>
            </div>
        </div>
    );
};
