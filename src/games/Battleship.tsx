import { useState } from "react";
import { buzz } from "../util";

type Cell = null | "ship" | "hit" | "miss" | "sunk";

type Props = {
  game: {
    phase: "placing" | "battle" | "over";
    turn: number;
    winner: number | null;
    youReady: boolean;
    foeReady: boolean;
    radar: Cell[][];
    fleet: Cell[][];
    ships: { id: string; name: string; len: number; sunk: boolean }[];
    foeSunk: { id: string; name: string; len: number }[];
    lastShot: { r: number; c: number; result: string; by: number; sunk: boolean } | null;
    size: number;
  };
  you: number;
  onAction: (action: Record<string, unknown>) => void;
};

export default function Battleship({ game, you, onAction }: Props) {
  const [tab, setTab] = useState<"radar" | "fleet">("radar");
  const yourTurn = game.phase === "battle" && game.turn === you && game.winner === null;
  const grid = tab === "radar" ? game.radar : game.fleet;
  const canFire = tab === "radar" && yourTurn;

  return (
    <div className="ship">
      {game.phase === "placing" && (
        <div className="ship-place">
          <p className="hint">
            {game.youReady
              ? "Locked in. Waiting for their fleet."
              : "Shuffle until you like the layout, then ready up."}
          </p>
          <div className="grid8">
            {game.fleet.flatMap((row, r) =>
              row.map((cell, c) => (
                <span key={`${r}-${c}`} className={`g8 ${cell || "empty"}`} />
              ))
            )}
          </div>
          <div className="row-btns">
            <button
              type="button"
              className="btn ghost"
              disabled={game.youReady}
              onClick={() => {
                buzz();
                onAction({ type: "shuffle" });
              }}
            >
              Shuffle
            </button>
            <button
              type="button"
              className="btn"
              disabled={game.youReady}
              onClick={() => {
                buzz(20);
                onAction({ type: "ready" });
              }}
            >
              {game.youReady ? "Ready" : "Ready up"}
            </button>
          </div>
        </div>
      )}

      {game.phase !== "placing" && (
        <>
          <div className="tabs">
            <button type="button" className={tab === "radar" ? "on" : ""} onClick={() => setTab("radar")}>
              Radar
            </button>
            <button type="button" className={tab === "fleet" ? "on" : ""} onClick={() => setTab("fleet")}>
              Your fleet
            </button>
          </div>
          <div className="grid8">
            {grid.flatMap((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`g8 ${cell || "empty"}`}
                  disabled={!canFire || Boolean(cell)}
                  onClick={() => {
                    buzz();
                    onAction({ type: "fire", r, c });
                  }}
                />
              ))
            )}
          </div>
          {game.lastShot && (
            <p className="hint">
              {game.lastShot.by === you ? "You" : "They"} {game.lastShot.result}
              {game.lastShot.sunk ? " · ship sunk" : ""}
            </p>
          )}
          <div className="ship-legend">
            {game.ships.map((s) => (
              <span key={s.id} className={s.sunk ? "dead" : ""}>
                {s.name} {s.len}
              </span>
            ))}
            {game.foeSunk.map((s) => (
              <span key={`foe-${s.id}`} className="dead">
                Their {s.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
