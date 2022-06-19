import React, { useState } from 'react';
import { getLocaleTexts } from '../../../game/locales';
import { Sandbox, SandboxTool } from '../../../game/sandbox';
import { HexMapCell } from '../../../shared/hexmapcell';
import { HexField } from '../GameScreen/HexField/HexField';
import './SandboxScreen.css';

const texts = getLocaleTexts();

interface SandboxScreenProps {
    sandbox: Sandbox,
};

export const SandboxScreen: React.FC<SandboxScreenProps> = ({ sandbox }) => {
    const [cells, setCells] = useState<HexMapCell[]>(sandbox.getMap().getCells());
    const [activeTool, setActiveTool] = useState<SandboxTool>(sandbox.getTool());

    sandbox.whenMapUpdated(setCells);

    const tools: { id: number, title: string }[] = [
        { id: SandboxTool.EmptyNone, title: texts.SandboxToolEmptyNone },
        { id: SandboxTool.Player1, title: texts.SandboxToolPlayer1 },
        { id: SandboxTool.Player2, title: texts.SandboxToolPlayer2 },
    ];

    let toolButtons: JSX.Element[] = [];
    Object.values(tools).forEach((tool, index) => {
        toolButtons.push(
            <button
                key={index}
                className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => { sandbox.setTool(tool.id); setActiveTool(tool.id) }}
            >{tool.title}</button>
        )
    })

    return (
        <div className='sandbox-screen'>
            <div className='game-field'>
                <HexField
                    width={sandbox.getMap().getWidth()}
                    height={sandbox.getMap().getHeight()}
                    cells={cells}
                    onCellClick={id => sandbox.onCellClick(id)}
                    playerColors={sandbox.getPlayerColors()}
                />
                <div className='toolbar'>
                    {toolButtons}

                    <button className='tool-button special' onClick={() => console.log(sandbox.getMap().serialize())}>
                        {texts.SandboxExport}
                    </button>
                    <button className='tool-button special' onClick={() => sandbox.getGame().setLoggedOut()}>
                        {texts.Quit}
                    </button>
                </div>
            </div>
        </div>
    );
};
