import React, { useState } from 'react';
import './App.css';
import { HexField } from '../HexField/HexField';
import { Game, GameState, GameStateMessage } from '../../../game/game';
import { HexMapCell } from '../../../shared/hexmapcell';
import { StatePanel } from '../StatePanel/StatePanel';
import { MessageScreen } from '../MessageScreen/MessageScreen';

interface AppProps {
  game: Game,
};

export const App: React.FC<AppProps> = ({ game }) => {
  const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());
  const [stateMessage, setStateMessage] = useState<GameStateMessage>({ text: 'hexgrid', className: '' });
  const [state, setState] = useState<GameState>(game.getState());

  game.whenMapUpdated((updatedCells: HexMapCell[]) => {
    setCells(updatedCells);
  });

  game.whenStateUpdated((state: GameState) => {
    setState(state);
  })

  game.whenStateMessageUpdated((stateMessage: GameStateMessage) => {
    console.log('whenStateMessageUpdated', stateMessage);
    setStateMessage({ ...stateMessage });
  });

  let childComponents;

  if (state === GameState.LoggedOut) {
    childComponents = [
      <div className='main-menu'>
        <h1>hexgame</h1>,
        <div className='login-form'>
          <input type='text' value='player' />
          <button onClick={() => game.searchAndStart()}>Play</button>
        </div>
      </div>
    ]
  }

  if (state === GameState.SearchingGame) {
    childComponents = <MessageScreen text='Идёт поиск соперника...' />;
  }

  if (state === GameState.Started) {
    childComponents = [
      <StatePanel
        stateMessage={stateMessage}
      />,
      <HexField
        width={game.getMap().getWidth()}
        height={game.getMap().getHeight()}
        cells={cells}
        onCellClick={id => game.onCellClick(id)}
      />
    ]
  }

  return (
    <div className='game-app'>
      {childComponents}
    </div>
  );
};
