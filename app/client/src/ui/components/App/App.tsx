import React, { useState } from 'react';
import { Game, GameInviteState, GameState } from '../../../game/game';
import { MessageScreen } from '../MessageScreen/MessageScreen';
import { LoginScreen } from '../LoginScreen/LoginScreen';
import { GameScreen } from '../GameScreen/GameScreen';
import { SandboxScreen } from '../SandboxScreen/SandboxScreen';
import { getLocaleTexts, getUserLang } from '../../../game/locales';
import { TutorialScreen } from '../TutorialScreen/TutorialScreen';
import { ManagementScreen } from '../ManagementScreen/ManagementScreen';
import { VkBridge } from '../../../vk/bridge';
import { LobbyScreen } from '../LobbyScreen/LobbyScreen';
import './App.css';
import { LinkScreen } from '../LinkScreen/LinkScreen';
import { Invite } from './Invite/Invite';


const texts = getLocaleTexts();

const game: Game = new Game(window.location.hostname);
const vk = new VkBridge();

if (vk.isDetected()) {
  vk.getUserInfo().then(info => {
    game.createPlayer({
      sourceId: `vk-${info.id}`,
      lang: getUserLang(),
      nickname: info.firstName,
      name: info.firstName + ' ' + info.lastName,
      avatarUrl: info.avatarUrl,
      cityId: info.cityId,
      countryId: info.countryId,
    });
    game.connect();
  });
} else {
  game.connect();
}

export const App: React.FC<{}> = () => {
  const [state, setState] = useState<GameState>(game.getState());
  const [isAlert, setAlert] = useState<boolean>(game.isAlert());

  game.whenStateUpdated(setState);
  game.whenAlert(setAlert);

  let childComponents;

  if (state === GameState.Loading) {
    childComponents = <MessageScreen text='⏳' />;
  }

  if (state === GameState.Connecting) {
    childComponents = <MessageScreen text={texts.Connecting} />;
  }

  if (state === GameState.LoggedOut) {
    childComponents = <LoginScreen game={game} />;
  }

  if (state === GameState.Lobby) {
    childComponents = <LobbyScreen game={game} />;
  }

  if (state === GameState.SearchingGame) {
    childComponents = <MessageScreen text={texts.SearchingOpponent} />;
  }

  if (state === GameState.LinkReady) {
    childComponents = <LinkScreen game={game} url={game.linkedGameUrl} />;
  }

  if (state === GameState.Started || state === GameState.Over) {
    const match = game.getMatch();
    if (match) childComponents = <GameScreen match={match} />;
  }

  if (state === GameState.Tutorial) {
    childComponents = <TutorialScreen game={game} />;
  }

  if (state === GameState.Sandbox) {
    const sandbox = game.getSandbox();
    if (sandbox) childComponents = <SandboxScreen sandbox={sandbox} />;
  }

  if (state === GameState.Management) {
    childComponents = <ManagementScreen game={game} />;
  }

  return (
    <div className='game-app'>
      {childComponents}
      <Invite game={game} />
      {isAlert &&
        <div className='modal-wrap' onClick={() => game.cancelAlert()}>
          <div className='modal-popup'>
            <div className='message'>{game.getAlertMessage()}</div>
            <div className='buttons'>
              <button onClick={() => game.cancelAlert()}>{texts.Close}</button>
            </div>
          </div>
        </div>
      }
    </div>
  );
};
