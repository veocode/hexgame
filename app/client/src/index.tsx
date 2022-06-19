import React from 'react';
import ReactDOM from 'react-dom/client';
import { Game } from './game/game';
import './index.css';
import { App } from './ui/components/App/App';

const game: Game = new Game(window.location.hostname);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App game={game} />
  </React.StrictMode>
);
