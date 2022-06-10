import React, { useState } from 'react';
import './App.css';
import { HexField } from '../HexField/HexField';
import { Game } from '../../../game/game';
import { HexMapCell } from '../../../game/hexmapcell';


interface AppProps {
  game: Game,
};

export const App: React.FC<AppProps> = ({ game }) => {
  const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());

  game.whenMapUpdated((updatedCells: HexMapCell[]) => {
    setCells(updatedCells);
  });

  return (
    <div className="game-app">
      <HexField
        width={game.getMap().getWidth()}
        height={game.getMap().getHeight()}
        cells={cells}
        onCellClick={id => game.onCellClick(id)}
      />
    </div>
  );
};
