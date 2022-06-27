import React from 'react';
import './Logo.css';


interface LogoProps {
    lang: string,
    scale?: number,
    margin?: number
};

export const Logo: React.FC<LogoProps> = ({ lang, scale, margin }) => {
    scale = scale || 1;
    margin = margin || 30;

    return (
        <div className='logo' style={{ transform: `scale(${scale})`, margin: `${margin}px` }}>
            {lang === 'ru'
                ?
                <div className='logo-wrap logo-ru'>
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
                <div className='logo-wrap logo-en'>
                    <span>H</span>
                    <span className='e'>
                        <span className='bg pulse'></span>
                        <span className='bg'></span>
                        <span className='letter'>E</span>
                    </span>
                    <span>X</span>
                </div>
            }
        </div>
    );
};
