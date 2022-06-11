import React, { useState } from 'react';
import './App.css';
import { HexField } from '../GameScreen/HexField/HexField';
import { Game, GameState, GameStateMessage } from '../../../game/game';
import { HexMapCell } from '../../../shared/hexmapcell';
import { MessageScreen } from '../MessageScreen/MessageScreen';
import { LoginScreen } from '../LoginScreen/LoginScreen';
import { GameScreen } from '../GameScreen/GameScreen';

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
    childComponents = <LoginScreen game={game} />
  }

  if (state === GameState.SearchingGame) {
    childComponents = <MessageScreen text='Идёт поиск соперника...' />;
  }

  if (state === GameState.Started) {
    childComponents = <GameScreen game={game} />;
  }

  return (
    <div className='game-app'>
      {childComponents}
    </div>
  );
};
