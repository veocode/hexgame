import React, { useState } from 'react';
import { getLocaleTexts } from '../../../game/locales';
import { Sandbox, SandboxTool } from '../../../game/sandbox';
import { HexMap } from '../../../shared/hexmap';
import { HexMapCell } from '../../../shared/hexmapcell';
import { Logo } from '../App/Logo/Logo';
import { HexField } from '../GameScreen/HexField/HexField';
import './SandboxScreen.css';

const texts = getLocaleTexts();

interface SandboxScreenProps {
    sandbox: Sandbox,
};

export const SandboxScreen: React.FC<SandboxScreenProps> = ({ sandbox }) => {
    let [currentMapIndex, setCurrentMapIndex] = useState<number>(0);
    const [cells, setCells] = useState<HexMapCell[]>(sandbox.getMap().getCells());
    const [activeTool, setActiveTool] = useState<SandboxTool>(sandbox.getTool());
    const [mapsCount, setMapsCount] = useState<number>(0);
    const [isBotSelectorVisible, setBotSelectorVisible] = useState<boolean>(false);

    sandbox.whenMapUpdated(setCells);
    sandbox.whenMapsCountUpdated(setMapsCount);

    const tools: { id: number, title: string, className: string }[] = [
        { id: SandboxTool.EmptyNone, title: texts.SandboxToolEmptyNone, className: 'tool-cell' },
        { id: SandboxTool.Player1, title: texts.SandboxToolPlayer1, className: 'tool-player1' },
        { id: SandboxTool.Player2, title: texts.SandboxToolPlayer2, className: 'tool-player2' },
    ];

    let toolButtons: JSX.Element[] = [];
    Object.values(tools).forEach((tool, index) => {
        toolButtons.push(
            <button
                key={index}
                className={`tool-button ${activeTool === tool.id ? 'active' : ''} ${tool.className}`}
                onClick={() => { sandbox.setTool(tool.id); setActiveTool(tool.id) }}
                title={tool.title}
            ><i></i></button>
        )
    })

    const requestMap = (id: number) => {
        sandbox.requestMap(id);
    }

    const nextMap = () => {
        currentMapIndex++;
        if (currentMapIndex > mapsCount) currentMapIndex = 1;
        setCurrentMapIndex(currentMapIndex);
        requestMap(currentMapIndex - 1);
    }

    const prevMap = () => {
        currentMapIndex--;
        if (currentMapIndex <= 0) currentMapIndex = mapsCount;
        setCurrentMapIndex(currentMapIndex);
        requestMap(currentMapIndex - 1);
    }

    const playWithBot = () => {
        if (!sandbox.getMap().validate()) {
            sandbox.getGame().alert(texts.InvalidMap);
            return;
        }
        setBotSelectorVisible(true);
    }

    const startGame = (difficultyName: string) => {
        sandbox.getGame().startWithBot(difficultyName, sandbox.getMap().serialize());
    }

    return (
        <div className='sandbox-screen screen sidebar-screen'>
            <div className='header'>
                <Logo lang={sandbox.getGame().getPlayer().authInfo.lang} scale={0.5} margin={5} />
            </div>
            <div className='body'>
                <div className='sidebar-column'>
                    <div className='sidebar-panel scrollable'>
                        <div className='toolbar'>
                            <section>
                                <div className='content'>
                                    {toolButtons}
                                </div>
                            </section>
                            <section>
                                <div className='content'>
                                    <div className='spinner'>
                                        <button className='prev' onClick={() => prevMap()}>&laquo;</button>
                                        <span className='value'>{currentMapIndex || '--'}</span>
                                        <button className='next' onClick={() => nextMap()}>&raquo;</button>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <button className='tool-button button-primary' onClick={() => playWithBot()}>
                            {texts.PlayWithBot}
                        </button>
                        <button className='tool-button' onClick={() => sandbox.getGame().setLobby()}>
                            {texts.Quit}
                        </button>
                    </div>
                </div>
                <div className='main-panel'>
                    <div className='main-widget'>
                        <div className='header'>
                            <div className='title'>
                                🧩 {texts.PlaySandbox}
                            </div>
                        </div>
                        <div className='content'>
                            <HexField
                                width={sandbox.getMap().getWidth()}
                                height={sandbox.getMap().getHeight()}
                                cells={cells}
                                onCellClick={id => sandbox.onCellClick(id)}
                                playerColors={sandbox.getPlayerColors()}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {isBotSelectorVisible &&
                <div className='modal-wrap' onClick={() => setBotSelectorVisible(false)}>
                    <div className='modal-popup'>
                        <div className='message'>{texts.Difficulty}</div>
                        <div className='buttons'>
                            <button onClick={() => startGame('easy')}>{texts.Easy}</button>
                            <button onClick={() => startGame('normal')}>{texts.Normal}</button>
                            <button onClick={() => startGame('hard')}>{texts.Expert}</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};
