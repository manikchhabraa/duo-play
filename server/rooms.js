import crypto from "node:crypto";
import * as tictactoe from "./games/tictactoe.js";
import * as connect4 from "./games/connect4.js";
import * as battleship from "./games/battleship.js";
import * as checkers from "./games/checkers.js";
import * as dots from "./games/dots.js";
import * as rps from "./games/rps.js";
import * as uno from "./games/uno.js";
import * as ludo from "./games/ludo.js";
import * as snakes from "./games/snakes.js";
import { GAME_IDS } from "./games/catalog.js";

const ENGINES = { tictactoe, connect4, battleship, checkers, dots, rps, uno, ludo, snakes };
const ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROOM_TTL_MS = 45 * 60 * 1000;
const EMPTY_TTL_MS = 12 * 60 * 1000;
const MAX_ROOMS = 400;

function code() {
  let out = "";
  for (let i = 0; i < 6; i += 1) out += ALPH[crypto.randomInt(ALPH.length)];
  return out;
}

function token() {
  return crypto.randomBytes(16).toString("hex");
}

function playerId() {
  return crypto.randomBytes(6).toString("hex");
}

function cleanName(raw) {
  const name = String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return name || "Player";
}

function publicPlayers(room) {
  return room.players.map((p, index) => ({
    id: p.id,
    nickname: p.nickname,
    connected: p.connected,
    index,
  }));
}

export function createRoomManager(io) {
  const rooms = new Map();
  const timers = new Map();

  function getRoom(roomCode) {
    return rooms.get(String(roomCode || "").toUpperCase()) || null;
  }

  function clearTimer(key) {
    const t = timers.get(key);
    if (t) clearTimeout(t);
    timers.delete(key);
  }

  function later(key, ms, fn) {
    clearTimer(key);
    timers.set(key, setTimeout(() => {
      timers.delete(key);
      fn();
    }, ms));
  }

  function destroy(room) {
    if (!room) return;
    clearTimer(`rps:${room.code}`);
    clearTimer(`ttl:${room.code}`);
    rooms.delete(room.code);
  }

  function touch(room) {
    later(`ttl:${room.code}`, ROOM_TTL_MS, () => destroy(room));
  }

  function bothConnected(room) {
    return room.players.length === 2 && room.players.every((p) => p.connected);
  }

  function snapshot(room, you) {
    const engine = room.gameId ? ENGINES[room.gameId] : null;
    const game =
      engine && room.state
        ? engine.view(room.state, you.index)
        : null;
    return {
      roomCode: room.code,
      status: room.status,
      gameId: room.gameId,
      players: publicPlayers(room),
      you: { id: you.id, index: you.index, nickname: you.nickname },
      game,
      result: room.result,
    };
  }

  function emitSync(room) {
    for (let i = 0; i < room.players.length; i += 1) {
      const p = room.players[i];
      if (!p.socketId || !p.connected) continue;
      io.to(p.socketId).emit("sync", snapshot(room, { ...p, index: i }));
    }
  }

  function startGame(room, gameId) {
    const engine = ENGINES[gameId];
    if (!engine) return "Unknown game.";
    if (room.players.length < 2) return "Need two players.";
    room.gameId = gameId;
    room.state = engine.create();
    room.status = "playing";
    room.result = null;
    clearTimer(`rps:${room.code}`);
    return null;
  }

  function maybeFinish(room) {
    if (!room.state || room.state.winner === null || room.state.winner === undefined) return;
    room.status = "results";
    const winner = room.state.winner;
    room.result = {
      winnerIndex: winner === "draw" ? null : winner,
      draw: winner === "draw",
    };
  }

  function attach(socket) {
    socket.on("create_room", ({ nickname, gameId } = {}) => {
      if (rooms.size >= MAX_ROOMS) {
        socket.emit("error_msg", { message: "Server is full. Try again in a bit." });
        return;
      }
      let roomCode = code();
      while (rooms.has(roomCode)) roomCode = code();
      const player = {
        id: playerId(),
        token: token(),
        nickname: cleanName(nickname),
        socketId: socket.id,
        connected: true,
      };
      const chosen = GAME_IDS.includes(gameId) ? gameId : null;
      const room = {
        code: roomCode,
        players: [player],
        status: "waiting",
        gameId: chosen,
        state: null,
        result: null,
        createdAt: Date.now(),
      };
      rooms.set(roomCode, room);
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.token = player.token;
      touch(room);
      socket.emit("joined", { token: player.token, roomCode });
      emitSync(room);
    });

    socket.on("join_room", ({ nickname, roomCode } = {}) => {
      const room = getRoom(roomCode);
      if (!room) {
        socket.emit("error_msg", { message: "No room with that code." });
        return;
      }
      if (room.players.length >= 2) {
        socket.emit("error_msg", { message: "That room already has two players." });
        return;
      }
      const player = {
        id: playerId(),
        token: token(),
        nickname: cleanName(nickname),
        socketId: socket.id,
        connected: true,
      };
      room.players.push(player);
      room.status = room.gameId ? "playing" : "lobby";
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.token = player.token;
      touch(room);
      if (room.gameId && !room.state) {
        const err = startGame(room, room.gameId);
        if (err) room.status = "lobby";
      }
      socket.emit("joined", { token: player.token, roomCode: room.code });
      emitSync(room);
    });

    socket.on("reconnect_room", ({ token: t, roomCode, nickname } = {}) => {
      const room = getRoom(roomCode);
      if (!room) {
        socket.emit("error_msg", { message: "That room expired. Start a new one." });
        socket.emit("kicked");
        return;
      }
      const idx = room.players.findIndex((p) => p.token === t);
      if (idx === -1) {
        socket.emit("error_msg", { message: "Could not restore this seat." });
        socket.emit("kicked");
        return;
      }
      const player = room.players[idx];
      player.socketId = socket.id;
      player.connected = true;
      if (nickname) player.nickname = cleanName(nickname);
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.token = player.token;
      touch(room);
      socket.emit("joined", { token: player.token, roomCode: room.code });
      emitSync(room);
    });

    socket.on("select_game", ({ gameId } = {}) => {
      const room = getRoom(socket.data.roomCode);
      if (!room) return;
      if (!bothConnected(room)) {
        if (GAME_IDS.includes(gameId)) {
          room.gameId = gameId;
          emitSync(room);
        }
        return;
      }
      const err = startGame(room, gameId);
      if (err) socket.emit("error_msg", { message: err });
      else emitSync(room);
    });

    socket.on("action", (action = {}) => {
      const room = getRoom(socket.data.roomCode);
      if (!room || !room.state || !room.gameId) return;
      const idx = room.players.findIndex((p) => p.token === socket.data.token);
      if (idx === -1) return;
      if (!bothConnected(room)) {
        socket.emit("error_msg", { message: "Waiting for the other phone to reconnect." });
        return;
      }
      const engine = ENGINES[room.gameId];
      const result = engine.apply(room.state, idx, action);
      if (result.error) {
        socket.emit("error_msg", { message: result.error });
        return;
      }
      room.state = result.state;
      maybeFinish(room);
      emitSync(room);
      if (result.reveal && room.gameId === "rps") {
        later(`rps:${room.code}`, 1600, () => {
          if (!room.state || room.status !== "playing") return;
          room.state = rps.nextRound(room.state);
          emitSync(room);
        });
      }
      touch(room);
    });

    socket.on("rematch", () => {
      const room = getRoom(socket.data.roomCode);
      if (!room || !room.gameId) return;
      if (!bothConnected(room)) return;
      const err = startGame(room, room.gameId);
      if (err) socket.emit("error_msg", { message: err });
      else emitSync(room);
    });

    socket.on("lobby", () => {
      const room = getRoom(socket.data.roomCode);
      if (!room) return;
      room.status = bothConnected(room) ? "lobby" : "waiting";
      room.state = null;
      room.result = null;
      room.gameId = null;
      clearTimer(`rps:${room.code}`);
      emitSync(room);
    });

    socket.on("leave_room", () => {
      const room = getRoom(socket.data.roomCode);
      if (!room) return;
      const idx = room.players.findIndex((p) => p.token === socket.data.token);
      if (idx !== -1) room.players.splice(idx, 1);
      socket.leave(room.code);
      socket.data.roomCode = null;
      socket.data.token = null;
      if (!room.players.length) destroy(room);
      else {
        room.status = "waiting";
        room.state = null;
        room.result = null;
        emitSync(room);
        later(`ttl:${room.code}`, EMPTY_TTL_MS, () => {
          if (room.players.length < 2) destroy(room);
        });
      }
      socket.emit("kicked");
    });

    socket.on("disconnect", () => {
      const room = getRoom(socket.data.roomCode);
      if (!room) return;
      const player = room.players.find((p) => p.token === socket.data.token);
      if (!player) return;
      player.connected = false;
      player.socketId = null;
      emitSync(room);
      later(`ttl:${room.code}`, EMPTY_TTL_MS, () => {
        const live = room.players.some((p) => p.connected);
        if (!live) destroy(room);
      });
    });
  }

  return { attach, rooms };
}
