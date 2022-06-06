import React, { useEffect, useState } from 'react';
import './App.css';
import { HexField } from '../HexField/HexField';
import { Game } from '../../../game/game';


interface AppProps {
  game: Game,
};

export const App: React.FC<AppProps> = ({ game }) => {
  const [cells, setCells] = useState<number[]>(game.getCells());
  const [updateId, setUpdateId] = useState<number>(0);

  game.whenCellsUpdated((updatedCells: number[]) => {
    setUpdateId(updateId + 1);
    setCells(cells);
  });

  return (
    <div className="game-app">
      <h1 className="title">hexgrid</h1>
      <HexField updateId={updateId} width={9} height={9} cells={cells} onCellClick={id => game.onCellClick(id)} />
    </div>
  );
};
