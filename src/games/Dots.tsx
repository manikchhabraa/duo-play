import { buzz } from "../util";

type Props = {
  game: {
    n: number;
    hEdges: Array<Array<number | null>>;
    vEdges: Array<Array<number | null>>;
    boxes: Array<Array<number | null>>;
    scores: number[];
    turn: number;
    winner: number | "draw" | null;
  };
  you: number;
  onClaim: (kind: "h" | "v", r: number, c: number) => void;
};

export default function Dots({ game, you, onClaim }: Props) {
  const n = game.n;
  const size = n * 2 + 1;
  const yourTurn = game.winner === null && game.turn === you;

  return (
    <div>
      <div className="scores">
        <span className={you === 0 ? "you" : ""}>P1 {game.scores[0]}</span>
        <span className={you === 1 ? "you" : ""}>P2 {game.scores[1]}</span>
      </div>
      <div className="dots" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {Array.from({ length: size * size }, (_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          if (r % 2 === 0 && c % 2 === 0) {
            return <span key={i} className="dot" />;
          }
          if (r % 2 === 0 && c % 2 === 1) {
            const er = r / 2;
            const ec = (c - 1) / 2;
            const owner = game.hEdges[er][ec];
            return (
              <button
                key={i}
                type="button"
                className={`edge h p${owner ?? "e"}`}
                disabled={!yourTurn || owner !== null}
                onClick={() => {
                  buzz();
                  onClaim("h", er, ec);
                }}
              />
            );
          }
          if (r % 2 === 1 && c % 2 === 0) {
            const er = (r - 1) / 2;
            const ec = c / 2;
            const owner = game.vEdges[er][ec];
            return (
              <button
                key={i}
                type="button"
                className={`edge v p${owner ?? "e"}`}
                disabled={!yourTurn || owner !== null}
                onClick={() => {
                  buzz();
                  onClaim("v", er, ec);
                }}
              />
            );
          }
          const br = (r - 1) / 2;
          const bc = (c - 1) / 2;
          const owner = game.boxes[br][bc];
          return <span key={i} className={`box p${owner ?? "e"}`} />;
        })}
      </div>
    </div>
  );
}
