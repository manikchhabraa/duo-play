import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Sync } from "../useSession";
import { gameById, type GameId } from "../catalog";
import GameGrid from "../components/GameGrid";
import TicTacToe from "../games/TicTacToe";
import ConnectFour from "../games/ConnectFour";
import Battleship from "../games/Battleship";
import Checkers from "../games/Checkers";
import Dots from "../games/Dots";
import Rps from "../games/Rps";
import Uno from "../games/Uno";
import { joinUrl } from "../util";

type Props = {
  sync: Sync;
  online: boolean;
  onSelect: (id: string) => void;
  onAction: (action: Record<string, unknown>) => void;
  onRematch: () => void;
  onLobby: () => void;
  onLeave: () => void;
};

export default function Room({
  sync,
  online,
  onSelect,
  onAction,
  onRematch,
  onLobby,
  onLeave,
}: Props) {
  const [qr, setQr] = useState<string>("");
  const foe = sync.players.find((p) => p.id !== sync.you.id) || null;
  const waiting = sync.status === "waiting";
  const link = joinUrl(sync.roomCode);
  const gameMeta = gameById(sync.gameId);
  const bothLive = sync.players.length === 2 && sync.players.every((p) => p.connected);
  const yourTurn =
    Boolean(sync.game) &&
    sync.status === "playing" &&
    (sync.game as { turn?: number }).turn === sync.you.index;

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(link, {
      margin: 1,
      width: 220,
      color: { dark: "#07080d", light: "#f4f5f7" },
    }).then((url: string) => {
      if (alive) setQr(url);
    });
    return () => {
      alive = false;
    };
  }, [link]);

  async function share() {
    const payload = { title: "Duo Play", text: `Join my room ${sync.roomCode}`, url: link };
    try {
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText(link);
    } catch {
      await navigator.clipboard.writeText(`${sync.roomCode} ${link}`);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(sync.roomCode).catch(() => undefined);
  }

  return (
    <div className="screen room">
      <header className="top">
        <button type="button" className="text-btn" onClick={onLeave}>
          Leave
        </button>
        <button type="button" className="room-code" onClick={copyCode}>
          {sync.roomCode}
        </button>
        <span className={`live ${online ? "on" : ""}`}>{online ? "Live" : "Reconnecting"}</span>
      </header>

      <div className="seats">
        {sync.players.map((p) => (
          <div key={p.id} className={`seat p${p.index}${p.id === sync.you.id ? " me" : ""}`}>
            <b>{p.nickname.slice(0, 1).toUpperCase()}</b>
            <span>
              {p.nickname}
              {p.id === sync.you.id ? " · you" : ""}
            </span>
            <i className={p.connected ? "on" : ""} />
          </div>
        ))}
        {sync.players.length < 2 && (
          <div className="seat empty">
            <b>?</b>
            <span>Waiting</span>
          </div>
        )}
      </div>

      {foe && !foe.connected && (
        <div className="banner">Their phone dropped off. The match pauses until they reopen the room.</div>
      )}

      {waiting && (
        <div className="wait">
          <p className="hint">Send this code or the QR. They open it on their own phone — iPhone or Android is fine.</p>
          <img className="qr" src={qr} alt="Join QR" />
          <div className="row-btns">
            <button type="button" className="btn" onClick={share}>
              Share room
            </button>
            <button type="button" className="btn ghost" onClick={copyCode}>
              Copy code
            </button>
          </div>
          {sync.gameId && <p className="hint">Queued: {gameMeta?.name}. Starts when they join.</p>}
          <h2 className="section-title">Queue a game</h2>
          <GameGrid selected={sync.gameId} onPick={(id: GameId) => onSelect(id)} />
        </div>
      )}

      {sync.status === "lobby" && (
        <div>
          <h2 className="section-title">Both here. Pick a game.</h2>
          <GameGrid selected={sync.gameId} onPick={(id: GameId) => onSelect(id)} />
        </div>
      )}

      {(sync.status === "playing" || sync.status === "results") && sync.game && (
        <div className="play">
          <div className="play-head">
            <strong>{gameMeta?.name}</strong>
            <span>
              {sync.status === "results"
                ? resultLine(sync)
                : !bothLive
                  ? "Paused"
                  : (sync.game as { prompt?: string }).prompt ||
                    (yourTurn ? "Your move" : "Their move")}
            </span>
          </div>
          <GameView sync={sync} onAction={onAction} />
        </div>
      )}

      {sync.status === "results" && (
        <div className="result">
          <h2>{resultLine(sync)}</h2>
          <div className="row-btns">
            <button type="button" className="btn" onClick={onRematch} disabled={!bothLive}>
              Rematch
            </button>
            <button type="button" className="btn ghost" onClick={onLobby}>
              Other games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function resultLine(sync: Sync) {
  if (sync.result?.draw) return "Draw";
  if (sync.result?.winnerIndex === sync.you.index) return "You win";
  if (sync.result && sync.result.winnerIndex !== null) return "They win";
  return "Match over";
}

function GameView({
  sync,
  onAction,
}: {
  sync: Sync;
  onAction: (a: Record<string, unknown>) => void;
}) {
  const g = sync.game as never;
  const you = sync.you.index;
  switch (sync.gameId) {
    case "tictactoe":
      return <TicTacToe game={g} you={you} onMove={(cell) => onAction({ cell })} />;
    case "connect4":
      return <ConnectFour game={g} you={you} onDrop={(col) => onAction({ col })} />;
    case "battleship":
      return <Battleship game={g} you={you} onAction={onAction} />;
    case "checkers":
      return (
        <Checkers
          game={g}
          you={you}
          onMove={(from, to) => onAction({ from, to })}
        />
      );
    case "dots":
      return (
        <Dots
          game={g}
          you={you}
          onClaim={(kind, r, c) => onAction({ kind, r, c })}
        />
      );
    case "rps":
      return <Rps game={g} you={you} onPick={(choice) => onAction({ choice })} />;
    case "uno":
      return <Uno game={g} you={you} onAction={onAction} />;
    default:
      return null;
  }
}
