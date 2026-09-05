import { buzz } from "../util";

const CHOICES = [
  { id: "rock", label: "Rock", glyph: "✊" },
  { id: "paper", label: "Paper", glyph: "✋" },
  { id: "scissors", label: "Scissors", glyph: "✌️" },
] as const;

type Props = {
  game: {
    scores: number[];
    round: number;
    phase: "pick" | "reveal";
    winner: number | null;
    need: number;
    youPicked: boolean;
    yourPick: string | null;
    foePicked: boolean;
    foePick: string | null;
    last: { picks: string[]; winner: number | "draw" } | null;
  };
  you: number;
  onPick: (choice: string) => void;
};

export default function Rps({ game, you, onPick }: Props) {
  return (
    <div className="rps">
      <div className="scores">
        <span className={you === 0 ? "you" : ""}>
          You {game.scores[you]}
        </span>
        <span>first to {game.need}</span>
        <span className={you === 1 ? "you" : ""}>
          Them {game.scores[1 - you]}
        </span>
      </div>
      <p className="hint">Round {game.round}</p>
      {game.phase === "reveal" && game.last && (
        <div className="rps-reveal">
          <div>
            <strong>{glyph(game.yourPick)}</strong>
            <span>You</span>
          </div>
          <em>
            {game.last.winner === "draw"
              ? "Tie"
              : game.last.winner === you
                ? "You take it"
                : "They take it"}
          </em>
          <div>
            <strong>{glyph(game.foePick)}</strong>
            <span>Them</span>
          </div>
        </div>
      )}
      {game.phase === "pick" && (
        <>
          {game.youPicked ? (
            <p className="hint">Locked in. {game.foePicked ? "Revealing…" : "Waiting for their pick."}</p>
          ) : (
            <p className="hint">Pick together. Revealed only when both lock in.</p>
          )}
          <div className="rps-btns">
            {CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`rps-btn${game.yourPick === c.id ? " on" : ""}`}
                disabled={game.youPicked}
                onClick={() => {
                  buzz(18);
                  onPick(c.id);
                }}
              >
                <span>{c.glyph}</span>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function glyph(id: string | null) {
  return CHOICES.find((c) => c.id === id)?.glyph || "•";
}
