import React, { useState } from 'react';
import { getLocaleTexts } from '../../../../game/locales';
import { Match, MatchResult } from '../../../../game/match';
import './ResultBox.css';

const texts = getLocaleTexts();

interface ResultBoxProps {
    match: Match,
};

export const ResultBox: React.FC<ResultBoxProps> = ({ match }) => {
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

    match.whenOver(setMatchResult);

    let resultBox: JSX.Element | null = null;

    if (matchResult) {
        const points = matchResult.pointsEarned;
        const signedPoints = points > 0 ? `+${points}` : `${points}`;
        const signClass = points > 0 ? 'positive' : 'negative';

        resultBox = (
            <div className='result-wrap'>
                <div className='result-box'>
                    <div className='message'>
                        {matchResult.message}
                    </div>
                    {points !== 0 && !match.isSpectating() && !matchResult.isLinkedGame ?
                        <div className='result-points'>
                            <div className='row'>
                                <div className='label'>{texts.PointsEarned}:</div>
                                <div className={`points ${signClass}`}>{signedPoints}</div>
                            </div>
                            <div className='row'>
                                <div className='label'>{texts.PointsToday}:</div>
                                <div className='points'>{matchResult.pointsToday}</div>
                            </div>
                            <div className='row'>
                                <div className='label'>{texts.PointsTotal}:</div>
                                <div className='points'>{matchResult.pointsTotal}</div>
                            </div>
                        </div>
                        : ''}
                    <div className='button'>
                        {match.isSpectating()
                            ? <button onClick={() => match.getGame().stopSpectating()}>{texts.Close}</button>
                            :
                            <div>
                                {
                                    match.hasBot()
                                        ?
                                        <div>
                                            <button onClick={() => match.getGame().startWithBot()}>{texts.PlayAgain}</button>
                                            <button onClick={() => match.getGame().setLobby()}>{texts.Quit}</button>
                                        </div>
                                        :
                                        <div>
                                            <button onClick={() => match.getGame().setLobby()}>{texts.Close}</button>
                                        </div>
                                }
                            </div>

                        }
                    </div>
                </div>
            </div>
        );
    }

    return resultBox ? resultBox : <div></div>;
};
