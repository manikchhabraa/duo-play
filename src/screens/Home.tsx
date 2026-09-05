import { useEffect, useState } from "react";
import type { GameId } from "../catalog";
import GameGrid from "../components/GameGrid";
import { isIOS, isStandalone } from "../util";

type Props = {
  nickname: string;
  onNickname: (v: string) => void;
  onCreate: (gameId?: string) => void;
  onJoin: (code: string) => void;
  presetCode?: string;
};

export default function Home({ nickname, onNickname, onCreate, onJoin, presetCode }: Props) {
  const [code, setCode] = useState(presetCode || "");
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const standalone = isStandalone();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <div className="screen home">
      <header className="hero">
        <p className="kicker">Two phones · live rooms</p>
        <h1>DUO PLAY</h1>
        <p className="tag">Pick a game, send a code, stay online. iOS or Android — both just use the browser.</p>
      </header>

      <label className="field">
        Your name
        <input
          value={nickname}
          maxLength={16}
          placeholder="Player"
          autoComplete="nickname"
          onChange={(e) => onNickname(e.target.value)}
        />
      </label>

      <div className="row-btns">
        <button type="button" className="btn" onClick={() => onCreate()}>
          Create room
        </button>
      </div>

      <form
        className="join"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onJoin(code);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ROOM CODE"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
        />
        <button type="submit" className="btn ghost" disabled={code.trim().length < 4}>
          Join
        </button>
      </form>

      <h2 className="section-title">Or start in a game</h2>
      <GameGrid onPick={(id: GameId) => onCreate(id)} />

      {!standalone && (
        <div className="install">
          {install ? (
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                await install.prompt();
                setInstall(null);
              }}
            >
              Install app
            </button>
          ) : isIOS() ? (
            <p>On iPhone: Share → <strong>Add to Home Screen</strong>. Plays full-screen like an app.</p>
          ) : (
            <p>Add this site to your home screen for the full-screen app.</p>
          )}
        </div>
      )}
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
