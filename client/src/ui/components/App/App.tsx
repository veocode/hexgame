import React, { useState } from 'react';
import { Game, GameState } from '../../../game/game';
import { MessageScreen } from '../MessageScreen/MessageScreen';
import { LoginScreen } from '../LoginScreen/LoginScreen';
import { GameScreen } from '../GameScreen/GameScreen';
import { SandboxScreen } from '../SandboxScreen/SandboxScreen';
import { getLocaleTexts } from '../../../game/locales';
import './App.css';
import { TutorialScreen } from '../TutorialScreen/TutorialScreen';
import { ManagementScreen } from '../ManagementScreen/ManagementScreen';

interface AppProps {
  game: Game,
};

const texts = getLocaleTexts();

export const App: React.FC<AppProps> = ({ game }) => {
  const [state, setState] = useState<GameState>(game.getState());

  game.whenStateUpdated((state: GameState) => {
    setState(state);
  });

  let childComponents;

  if (state === GameState.LoggedOut) {
    childComponents = <LoginScreen game={game} />;
  }

  if (state === GameState.Connecting) {
    childComponents = <MessageScreen text={texts.Connecting} />;
  }

  if (state === GameState.SearchingGame) {
    childComponents = <MessageScreen text={texts.SearchingOpponent} />;
  }

  if (state === GameState.Started || state === GameState.Over) {
    const match = game.getMatch();
    if (match) childComponents = <GameScreen match={match} />;
  }

  if (state === GameState.Tutorial) {
    childComponents = <TutorialScreen game={game} />;
  }

  if (state === GameState.Sandbox) {
    const sandbox = game.getSandbox();
    if (sandbox) childComponents = <SandboxScreen sandbox={sandbox} />;
  }

  if (state === GameState.Management) {
    childComponents = <ManagementScreen game={game} />;
  }

  return (
    <div className='game-app'>
      {childComponents}
      {(state !== GameState.Tutorial) ?
        <button
          className='button-fullscreen'
          title='F11'
          onClick={() => game.toggleFullScreen()}
        >
          <div className='icon'></div>
        </button> : ''}
    </div>
  );
};
