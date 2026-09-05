import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 400,
      reconnectionAttempts: Infinity,
    });
  }
  return socket;
}
