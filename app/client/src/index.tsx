import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/components/App/App';
import './ui/styles/global.css';
import './ui/styles/animations.css';
import './ui/styles/controls.css';
import './ui/styles/blocks.css';
import './ui/styles/layouts.css';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
