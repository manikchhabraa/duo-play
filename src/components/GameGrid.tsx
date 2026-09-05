import { GAMES, type GameId } from "../catalog";

type Props = {
  selected?: string | null;
  onPick: (id: GameId) => void;
};

export default function GameGrid({ selected, onPick }: Props) {
  return (
    <div className="game-grid">
      {GAMES.map((game) => (
        <button
          key={game.id}
          type="button"
          className={`game-card${selected === game.id ? " is-on" : ""}`}
          onClick={() => onPick(game.id)}
        >
          <span className="game-mark">{game.mark}</span>
          <span className="game-name">{game.name}</span>
          <span className="game-blurb">{game.blurb}</span>
        </button>
      ))}
    </div>
  );
}
