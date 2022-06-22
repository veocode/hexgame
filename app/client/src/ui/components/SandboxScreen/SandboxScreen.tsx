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
    const [mapsCount, setMapsCount] = useState<number>(0);
    const [selectedMapId, setSelectedMapId] = useState<number>(-1);

    sandbox.whenMapUpdated(setCells);
    sandbox.whenMapsCountUpdated(setMapsCount);

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

    const requestMap = (id: number) => {
        sandbox.requestMap(id);
        setSelectedMapId(id);
    }

    let mapButtons: JSX.Element[] = [];
    if (mapsCount > 0) {
        for (let i = 0; i < mapsCount; i++) {
            mapButtons.push(
                <button
                    key={i}
                    className={`tool-button ${selectedMapId === i ? 'active' : ''}`}
                    onClick={() => { requestMap(i); }}
                >{i}</button>
            )
        }
    }

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
                <div className='toolbar maps'>
                    {mapButtons}
                </div>
            </div>
        </div>
    );
};
