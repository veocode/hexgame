import React from 'react';
import './Game.css';
import HexField from '../HexField/HexField';

function Game() {
  return (
    <div className="game-app">
      <h1 className="title">hexgame</h1>
      <HexField width={9} height={9} />
    </div>
  );
}

export default Game;
