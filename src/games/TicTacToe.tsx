import { buzz } from "../util";

type Props = {
  game: { board: Array<number | null>; turn: number; winner: number | "draw" | null };
  you: number;
  onMove: (cell: number) => void;
};

export default function TicTacToe({ game, you, onMove }: Props) {
  const yourTurn = game.winner === null && game.turn === you;
  return (
    <div>
      <div className="ttt">
        {game.board.map((cell, i) => (
          <button
            key={i}
            type="button"
            className={`ttt-cell p${cell ?? "e"}`}
            disabled={!yourTurn || cell !== null}
            onClick={() => {
              buzz();
              onMove(i);
            }}
          >
            {cell === 0 ? "X" : cell === 1 ? "O" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
