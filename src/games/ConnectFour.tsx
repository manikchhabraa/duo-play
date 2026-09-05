import { buzz } from "../util";

type Props = {
  game: {
    board: Array<Array<number | null>>;
    turn: number;
    winner: number | "draw" | null;
    last: { row: number; col: number } | null;
  };
  you: number;
  onDrop: (col: number) => void;
};

export default function ConnectFour({ game, you, onDrop }: Props) {
  const yourTurn = game.winner === null && game.turn === you;
  return (
    <div className="c4-wrap">
      <div className="c4">
        {Array.from({ length: 7 }, (_, col) => (
          <button
            key={col}
            type="button"
            className="c4-col"
            disabled={!yourTurn || game.board[0][col] !== null}
            onClick={() => {
              buzz();
              onDrop(col);
            }}
          >
            {game.board.map((row, r) => {
              const v = row[col];
              const last = game.last?.row === r && game.last?.col === col;
              return (
                <span key={r} className={`c4-cell p${v ?? "e"}${last ? " is-last" : ""}`} />
              );
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
