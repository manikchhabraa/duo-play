import { useCallback, useEffect, useMemo, useState } from "react";
import { getSocket } from "./socket";

const KEY = "duo-play-session";

export type Player = {
  id: string;
  nickname: string;
  connected: boolean;
  index: number;
};

export type Sync = {
  roomCode: string;
  status: "waiting" | "lobby" | "playing" | "results";
  gameId: string | null;
  players: Player[];
  you: { id: string; index: number; nickname: string };
  game: Record<string, unknown> | null;
  result: { winnerIndex: number | null; draw: boolean } | null;
};

type Saved = {
  nickname: string;
  roomCode: string | null;
  token: string | null;
};

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* ignore */
  }
  return { nickname: "", roomCode: null, token: null };
}

function persist(saved: Saved) {
  localStorage.setItem(KEY, JSON.stringify(saved));
}

export function useSession() {
  const [saved, setSaved] = useState<Saved>(() => loadSaved());
  const [sync, setSync] = useState<Sync | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const socket = useMemo(() => getSocket(), []);

  const write = useCallback((next: Saved) => {
    setSaved(next);
    persist(next);
  }, []);

  useEffect(() => {
    const onSync = (payload: Sync) => setSync(payload);
    const onJoined = ({ token, roomCode }: { token: string; roomCode: string }) => {
      write({ ...loadSaved(), token, roomCode });
    };
    const onErr = ({ message }: { message: string }) => setToast(message);
    const onKick = () => {
      setSync(null);
      write({ ...loadSaved(), roomCode: null, token: null });
    };
    const onConnect = () => {
      setOnline(true);
      const s = loadSaved();
      const urlRoom = new URLSearchParams(window.location.search).get("room")?.toUpperCase() || "";
      if (urlRoom && s.roomCode && urlRoom !== s.roomCode) return;
      if (s.token && s.roomCode) {
        socket.emit("reconnect_room", {
          token: s.token,
          roomCode: s.roomCode,
          nickname: s.nickname,
        });
      }
    };
    const onDisconnect = () => setOnline(false);

    socket.on("sync", onSync);
    socket.on("joined", onJoined);
    socket.on("error_msg", onErr);
    socket.on("kicked", onKick);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) onConnect();

    return () => {
      socket.off("sync", onSync);
      socket.off("joined", onJoined);
      socket.off("error_msg", onErr);
      socket.off("kicked", onKick);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, write]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const setNickname = useCallback(
    (nickname: string) => write({ ...saved, nickname: nickname.slice(0, 16) }),
    [saved, write]
  );

  const createRoom = useCallback(
    (gameId?: string) => {
      socket.emit("create_room", { nickname: saved.nickname || "Player", gameId });
    },
    [socket, saved.nickname]
  );

  const joinRoom = useCallback(
    (roomCode: string) => {
      socket.emit("join_room", {
        nickname: saved.nickname || "Player",
        roomCode: roomCode.trim().toUpperCase(),
      });
    },
    [socket, saved.nickname]
  );

  const selectGame = useCallback(
    (gameId: string) => socket.emit("select_game", { gameId }),
    [socket]
  );

  const sendAction = useCallback(
    (action: Record<string, unknown>) => socket.emit("action", action),
    [socket]
  );

  const rematch = useCallback(() => socket.emit("rematch"), [socket]);
  const toLobby = useCallback(() => socket.emit("lobby"), [socket]);
  const leave = useCallback(() => socket.emit("leave_room"), [socket]);

  return {
    nickname: saved.nickname,
    setNickname,
    sync,
    toast,
    online,
    createRoom,
    joinRoom,
    selectGame,
    sendAction,
    rematch,
    toLobby,
    leave,
  };
}
