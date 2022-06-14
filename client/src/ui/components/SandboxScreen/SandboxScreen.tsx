import React, { useState } from 'react';
import { Game, SandboxTools } from '../../../game/game';
import { getLocaleTexts } from '../../../game/locales';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from '../GameScreen/HexField/HexField';
import './SandboxScreen.css';

const texts = getLocaleTexts();

interface GameScreenProps {
    game: Game,
};

export const SandboxScreen: React.FC<GameScreenProps> = ({ game }) => {
    const [cells, setCells] = useState<HexMapCell[]>(game.getMap().getCells());
    const [activeTool, setActiveTool] = useState<SandboxTools>(game.getSandboxTool());

    game.whenMapUpdated(setCells);

    const tools: { id: number, title: string }[] = [
        { id: SandboxTools.EmptyNone, title: texts.SandboxToolEmptyNone },
        { id: SandboxTools.Player1, title: texts.SandboxToolPlayer1 },
        { id: SandboxTools.Player2, title: texts.SandboxToolPlayer2 },
    ];

    let toolButtons: JSX.Element[] = [];
    Object.values(tools).forEach((tool, index) => {
        toolButtons.push(
            <button
                key={index}
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
                        {texts.SandboxExport}
                    </button>
                    <button className='tool-button special' onClick={() => game.setLoggedOut()}>
                        {texts.Quit}
                    </button>
                </div>
            </div>
        </div>
    );
};
