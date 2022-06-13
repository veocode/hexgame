import React, { useState } from 'react';
import { Game, SandboxTools } from '../../../game/game';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from '../GameScreen/HexField/HexField';
import './SandboxScreen.css';

interface GameScreenProps {
    game: Game,
};

export const SandboxScreen: React.FC<GameScreenProps> = ({ game }) => {
    const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());
    const [activeTool, setActiveTool] = useState<SandboxTools>(game.getSandboxTool());

    game.whenMapUpdated(setCells);

    const tools: { id: number, title: string }[] = [
        { id: SandboxTools.EmptyNone, title: 'Ячейка' },
        { id: SandboxTools.Player1, title: 'Игрок 1' },
        { id: SandboxTools.Player2, title: 'Игрок 2' },
    ];

    let toolButtons: JSX.Element[] = [];
    Object.values(tools).forEach(tool => {
        toolButtons.push(
            <button
                className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => { game.setSandboxTool(tool.id); setActiveTool(tool.id) }}
            >{tool.title}</button>
        )
    })

    return (
        <div className='sandbox-screen'>
            <div className='game-field'>
                <HexField
                    width={game.getMap().getWidth()}
                    height={game.getMap().getHeight()}
                    cells={cells}
                    onCellClick={id => game.onCellClick(id)}
                    playerColors={game.getPlayerColors()}
                />
                <div className='toolbar'>
                    {toolButtons}

                    <button className='tool-button special' onClick={() => console.log(game.getMap().serialize())}>
                        Экспорт F12
                    </button>
                    <button className='tool-button special' onClick={() => game.setLoggedOut()}>
                        Выход
                    </button>
                </div>
            </div>
        </div>
    );
};
