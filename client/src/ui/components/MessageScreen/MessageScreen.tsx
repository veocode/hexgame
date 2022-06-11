import React from 'react';
import './MessageScreen.css';

interface MessageScreenProps {
    text: string
};

export const MessageScreen: React.FC<MessageScreenProps> = ({ text }) => {
    return (
        <div className='message-screen'>
            <div className='message'>
                {text}
            </div>
        </div>
    );
};
