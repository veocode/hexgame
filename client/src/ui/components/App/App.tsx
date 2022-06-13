import React, { useState } from 'react';
import { Game, GameState } from '../../../game/game';
import { MessageScreen } from '../MessageScreen/MessageScreen';
import { LoginScreen } from '../LoginScreen/LoginScreen';
import { GameScreen } from '../GameScreen/GameScreen';
import './App.css';

interface AppProps {
  game: Game,
};

export const App: React.FC<AppProps> = ({ game }) => {
  const [state, setState] = useState<GameState>(game.getState());

  game.whenStateUpdated((state: GameState) => {
    setState(state);
  });

  let childComponents;

  if (state === GameState.LoggedOut) {
    childComponents = <LoginScreen game={game} />;
  }

  if (state === GameState.SearchingGame) {
    childComponents = <MessageScreen text='🌐 Поиск противника...' />;
  }

  if (state === GameState.Started || state === GameState.Over) {
    childComponents = <GameScreen game={game} />;
  }

  return (
    <div className='game-app'>
      {childComponents}
    </div>
  );
};
