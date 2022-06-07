import React, { useState } from 'react';
import './App.css';
import { HexField } from '../HexField/HexField';
import { Game } from '../../../game/game';


interface AppProps {
  game: Game,
};

export const App: React.FC<AppProps> = ({ game }) => {
  const [cells, setCells] = useState<number[]>(game.getMap().getCells());

  game.whenMapUpdated((updatedCells: number[]) => {
    setCells(updatedCells);
  });

  return (
    <div className="game-app">
      <h1 className="title">hexgrid</h1>
      <HexField
        width={game.getMap().getWidth()}
        height={game.getMap().getHeight()}
        cells={cells}
        onCellClick={id => game.onCellClick(id)}
      />
    </div>
  );
};
