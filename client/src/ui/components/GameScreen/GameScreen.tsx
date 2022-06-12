import React, { useState } from 'react';
import { Game, GameStateMessage } from '../../../game/game';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from './HexField/HexField';
import { StatePanel } from './StatePanel/StatePanel';
import './GameScreen.css';

interface GameScreenProps {
    game: Game,
};

export const GameScreen: React.FC<GameScreenProps> = ({ game }) => {
    const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());
    const [stateMessage, setStateMessage] = useState<GameStateMessage>({ text: '', className: '' });

    game.whenMapUpdated((updatedCells: HexMapCell[]) => {
        setCells(updatedCells);
    });

    game.whenStateMessageUpdated((stateMessage: GameStateMessage) => {
        setStateMessage({ ...stateMessage });
    });

    return (
        <div className='game-screen'>
            <StatePanel
                stateMessage={stateMessage}
            />,
            <HexField
                width={game.getMap().getWidth()}
                height={game.getMap().getHeight()}
                cells={cells}
                onCellClick={id => game.onCellClick(id)}
                playerColors={game.getPlayerColors()}
            />
        </div>
    );
};
