import { useState } from "react";
import { buzz } from "../util";

type Card = {
  id: string;
  color: string;
  kind: string;
  value?: number;
};

type Props = {
  game: {
    turn: number;
    winner: number | null;
    currentColor: string | null;
    top: Card | null;
    deckCount: number;
    you: Card[];
    foeCount: number;
    playable: string[];
    pending: { kind: string; yours: boolean; cardId: string | null } | null;
    uno: boolean;
    foeUno: boolean;
    last: { text: string; by: number | null } | null;
    prompt: string;
    colors: string[];
  };
  you: number;
  onAction: (action: Record<string, unknown>) => void;
};

export default function Uno({ game, you, onAction }: Props) {
  const [wildId, setWildId] = useState<string | null>(null);
  const yourTurn = game.turn === you && game.winner === null;
  const picking =
    (game.pending?.kind === "color" && game.pending.yours) || Boolean(wildId);
  const answering = game.pending?.kind === "wd4" && game.pending.yours;
  const drawn = game.pending?.kind === "drawn" && game.pending.yours;

  function play(card: Card, color?: string) {
    if (card.kind === "wild" || card.kind === "wild4") {
      if (!color) {
        setWildId(card.id);
        return;
      }
      setWildId(null);
      buzz(16);
      if (drawn && card.id === game.pending?.cardId) {
        onAction({ type: "playDrawn", color });
      } else {
        onAction({ type: "play", cardId: card.id, color });
      }
      return;
    }
    buzz();
    if (drawn && card.id === game.pending?.cardId) onAction({ type: "playDrawn" });
    else onAction({ type: "play", cardId: card.id });
  }

  function pickColor(color: string) {
    buzz(14);
    if (game.pending?.kind === "color" && game.pending.yours) {
      onAction({ type: "chooseColor", color });
      return;
    }
    if (wildId) {
      const card = game.you.find((c) => c.id === wildId);
      if (card) play(card, color);
    }
  }

  return (
    <div className="uno">
      <div className="uno-foe">
        <span>{game.foeUno ? "UNO · " : ""}{game.foeCount} cards</span>
        <div className="uno-backs">
          {Array.from({ length: Math.min(game.foeCount, 8) }, (_, i) => (
            <i key={i} className="uno-back" style={{ zIndex: i }} />
          ))}
        </div>
      </div>

      <p className="uno-log">{game.last?.text}</p>

      <div className="uno-table">
        <button
          type="button"
          className="uno-pile"
          disabled={!yourTurn || Boolean(game.pending) || game.winner !== null}
          onClick={() => {
            buzz();
            onAction({ type: "draw" });
          }}
        >
          <span className="uno-back face" />
          <em>Draw {game.deckCount}</em>
        </button>
        <div className="uno-discard">
          {game.top && <UnoCard card={game.top} />}
          {game.currentColor && (
            <b className={`uno-color ${game.currentColor}`}>{game.currentColor}</b>
          )}
        </div>
      </div>

      {game.uno && <p className="uno-call">UNO</p>}

      {answering && (
        <div className="row-btns">
          <button
            type="button"
            className="btn"
            onClick={() => {
              buzz(18);
              onAction({ type: "challenge" });
            }}
          >
            Challenge
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              buzz();
              onAction({ type: "accept" });
            }}
          >
            Draw 4
          </button>
        </div>
      )}

      {drawn && (
        <div className="row-btns">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              buzz();
              setWildId(null);
              onAction({ type: "keepDrawn" });
            }}
          >
            Keep it
          </button>
        </div>
      )}

      {picking && (
        <div className="uno-colors">
          {game.colors.map((color) => (
            <button
              key={color}
              type="button"
              className={`uno-swatch ${color}`}
              onClick={() => pickColor(color)}
            >
              {color}
            </button>
          ))}
        </div>
      )}

      <div className="uno-hand">
        {game.you.map((card) => {
          const can = game.playable.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={`uno-card-btn${can ? " go" : ""}`}
              disabled={!can}
              onClick={() => play(card)}
            >
              <UnoCard card={card} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UnoCard({ card }: { card: Card }) {
  const face =
    card.kind === "num"
      ? String(card.value)
      : card.kind === "skip"
        ? "⊘"
        : card.kind === "reverse"
          ? "⇄"
          : card.kind === "draw2"
            ? "+2"
            : card.kind === "wild4"
              ? "+4"
              : "W";
  return (
    <span className={`uno-card ${card.color}`}>
      <small>{face}</small>
      <strong>{face}</strong>
      <small className="flip">{face}</small>
    </span>
  );
}
