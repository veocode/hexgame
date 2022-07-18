import React from 'react';
import { getBriefLocalesList, getUserLang } from '../../../../game/locales';
import './LocaleSelector.css';


export const LocaleSelector: React.FC<{}> = () => {
    const onLangSelect = (lang: string) => {
        localStorage.setItem('hexgame:lang', lang);
        window.location.reload();
    }

    const userLang = getUserLang();
    const localeButtons: JSX.Element[] = [];
    getBriefLocalesList().forEach((locale, index) => {
        localeButtons.push(
            <button
                key={index}
                className={'round-button locale-button' + (userLang === locale.lang ? ' active' : '')}
                title={locale.name}
                onClick={() => onLangSelect(locale.lang)}
            >{locale.displayName}</button>
        )
    })

    return (
        <div className='locale-selector buttons-row'>
            {localeButtons}
        </div>
    );
};
