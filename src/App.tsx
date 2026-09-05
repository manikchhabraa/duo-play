import { useState } from "react";
import Home from "./screens/Home";
import Room from "./screens/Room";
import { useSession } from "./useSession";

export default function App() {
  const session = useSession();
  const [preset] = useState(() =>
    (new URLSearchParams(window.location.search).get("room") || "").toUpperCase()
  );

  return (
    <div className="app">
      {session.sync ? (
        <Room
          sync={session.sync}
          online={session.online}
          onSelect={session.selectGame}
          onAction={session.sendAction}
          onRematch={session.rematch}
          onLobby={session.toLobby}
          onLeave={session.leave}
        />
      ) : (
        <Home
          nickname={session.nickname}
          onNickname={session.setNickname}
          onCreate={session.createRoom}
          onJoin={session.joinRoom}
          presetCode={preset}
        />
      )}
      {session.toast && <div className="toast">{session.toast}</div>}
    </div>
  );
}
