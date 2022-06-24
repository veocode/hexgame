import React from 'react';
import { Game } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import './TutorialScreen.css';

const texts = getLocaleTexts();

interface TutorialScreenProps {
    game: Game,
};

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ game }) => {
    return (
        <div className='tutorial-screen'>
            <div className='tutorial-panel scrollable'>
                <h1>{texts.HowTo}</h1>
                <div className='tutorial'>
                    <div className='page'>
                        <section>
                            <h3>{texts.HowToGameGoal}</h3>
                            <p>{texts.HowToGameGoalText}</p>
                        </section>
                        <section>
                            <h3>{texts.HowToMovement}</h3>
                            <p>{texts.HowToMovementText}</p>
                            <div className='video-block'>
                                <video autoPlay={true} loop={true}>
                                    <source src="/videos/tutorial-move.mp4" type="video/mp4" />
                                </video>
                            </div>
                            <p>{texts.HowToMovementCloneText}</p>
                        </section>
                    </div>
                    <div className='page'>
                        <section>
                            <h3>{texts.HowToCapture}</h3>
                            <p>{texts.HowToCaptureText}</p>
                            <div className='video-block'>
                                <video autoPlay={true} loop={true}>
                                    <source src="/videos/tutorial-capture.mp4" type="video/mp4" />
                                </video>
                            </div>
                        </section>
                        <section>
                            <h3>{texts.HowToWin}</h3>
                            <p>{texts.HowToWinText}</p>
                        </section>
                        <section>
                            <button className='button-back' onClick={() => game.setLoggedOut()}>{texts.Quit}</button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
