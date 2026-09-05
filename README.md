# Duo Play

Mobile-only two-player games PWA. Each person stays on their own phone (iOS or Android), in their own browser, connected over the internet in the same room.

Create a room → send a 6-character code, link, or QR → both play live. The Node server is the source of truth, so neither client can cheat a move.

## Functional requirements

- Two people play on **separate phones/browsers**, not pass-and-play.
- **Create / join room** with a short code, share link (`/?room=ABC123`), or QR.
- **Seven games**: Uno, Tic-Tac-Toe, Connect Four, Battleship, Checkers, Dots & Boxes, RPS Duel (first to 3).
- Stay **online** for the match: Socket.io presence, pause if the other phone drops, resume on reconnect.
- **Installable PWA** (Add to Home Screen on iOS; install prompt on Android). Portrait, full-screen, notch-safe.
- **Easy host**: one Node process serves the built PWA **and** the realtime server.

## Non-functional requirements

| Need | Target | Why |
| --- | --- | --- |
| First paint on phone | Small Vite bundle, system + two fonts | Game rooms feel instant |
| Move latency | < 100ms over a normal mobile network after connect | Turns should feel live |
| Availability | Single region is enough; sticky not required | Rooms live in process memory |
| Consistency | Authoritative server | Both phones must see the same board |
| Security | Validate every action, 2 seats/room, sanitized names | Public internet |
| Hosting cost | 256MB VM / Render free or Fly shared | Casual personal deploy |
| Offline | Shell caches via service worker; **play still needs internet** | Multiplayer cannot be local-only |

Trade-off: rooms are **in-memory**. Restarting the host drops active matches. That keeps deploy to one dyno with zero database. Add Redis only if you need multi-instance scale.

## Why this stack

| Piece | Choice | Why this, not the alternative |
| --- | --- | --- |
| UI | React + Vite | Fast phone UI, tiny build, simple PWA plugin |
| Realtime | Socket.io | Auto-reconnect on flaky mobile radios; fallbacks if WebSocket is blocked |
| Authority | Node game engines | Clients send intents (`fire`, `drop`); server applies rules |
| P2P / WebRTC | **Not used** | Mobile NATs and iOS backgrounding make peer links brittle; a tiny relay is more reliable |
| API shape | Socket events, not REST for play | Turns are not request/response CRUD |
| Hosting | Express static + same HTTP server for Socket.io | One `PORT`, one Docker image, one Render/Fly/Railway service |
| Rendering | CSR PWA | No SEO; install-to-home-screen matters more than SSR |

## High-level architecture

```
 Phone A (Safari/Chrome PWA)          Phone B (Safari/Chrome PWA)
        │                                      │
        │  HTTPS + WebSocket                   │
        └──────────────┬───────────────────────┘
                       ▼
              CDN optional (static only)
                       ▼
              [ Express :PORT ]
                 │           │
                 │           └── Socket.io rooms
                 │                    │
                 ▼                    ▼
           dist/ (PWA)         game engines
                               (authoritative state)
```

**Data flow (one turn)**

1. Player taps a legal cell. Client emits `action`.
2. Server checks seat, presence, turn, and rules.
3. Engine returns new state (and a per-player **view** — Battleship hides the enemy fleet).
4. Each socket gets `sync` with *their* view.
5. UI rerenders. If the other phone is gone, actions are rejected until they reconnect.

## Frontend architecture

**State**

- No Redux. Room snapshot is a single `sync` object from the server.
- `localStorage` keeps `{ nickname, roomCode, token }` so a refresh or “reopen PWA” reclaims the same seat.
- URL `?room=` is the join deep link (and QR payload).

**Screens**

```
App
 ├─ Home          name, create, join, game grid, install hint
 └─ Room
     ├─ Waiting   code + QR + share (1 player)
     ├─ Lobby     both here, pick a game
     ├─ Play      one of 6 game boards
     └─ Results   rematch / other games
```

**Performance**

- Route-less single shell (the whole app is the game pack).
- Service worker caches JS/CSS/icons; `/socket.io` and `/health` are excluded.
- Big tap targets, `dvh` + `safe-area-inset` for iOS standalone.
- Desktop shows a 390px phone frame so you can click-test; real play is meant on two mobiles.

**PWA**

- `display: standalone`, `orientation: portrait`
- Android: `beforeinstallprompt`
- iOS: Share → Add to Home Screen (Apple does not allow a custom install banner to trigger that)

## API (socket)

Client → server

| Event | Payload |
| --- | --- |
| `create_room` | `{ nickname, gameId? }` |
| `join_room` | `{ nickname, roomCode }` |
| `reconnect_room` | `{ token, roomCode, nickname }` |
| `select_game` | `{ gameId }` |
| `action` | game-specific (see engines) |
| `rematch` | — |
| `lobby` | — |
| `leave_room` | — |

Server → client

| Event | Payload |
| --- | --- |
| `joined` | `{ token, roomCode }` |
| `sync` | room snapshot for **this** player |
| `error_msg` | `{ message }` |
| `kicked` | session cleared |

HTTP: `GET /health` → `{ ok: true }` for hosts.

Game actions (validated server-side): Uno `{ type: play\|draw\|playDrawn\|keepDrawn\|chooseColor\|challenge\|accept }`, Tic-Tac-Toe `{ cell }`, Connect Four `{ col }`, Battleship `{ type: shuffle\|ready\|fire, r?, c? }`, Checkers `{ from, to }`, Dots `{ kind: h\|v, r, c }`, RPS `{ choice }`.

## Run locally

Needs Node 20+.

```bash
cd ~/Projects/duo-play
npm install
npm run dev
```

- Site: `http://localhost:5173`
- Realtime server: `http://localhost:3000` (Vite proxies `/socket.io`)

On two phones on the same Wi‑Fi (simplest test):

```bash
npm run preview
```

Then open `http://YOUR_LAN_IP:3000` on both devices. iOS will only treat it as a full PWA once it is on **HTTPS** (use a host below, or a tunnel).

## Host it (pick one)

The production command is always:

```bash
npm install
node scripts/make-icons.mjs   # optional if icons already exist
npm run build
NODE_ENV=production npm start
```

The process listens on `PORT` (default 3000) and serves `dist/` plus Socket.io.

### Render (least clicking)

1. Push this folder to GitHub.
2. New Web Service → this repo.
3. Build: `npm install && node scripts/make-icons.mjs && npm run build`
4. Start: `npm start`
5. Health check: `/health`

Or use the included `render.yaml`. Free instances sleep; the first join after sleep is slow. For always-on play, use a paid instance or Fly/Railway.

### Fly.io

```bash
fly launch --no-deploy   # uses fly.toml
fly deploy
```

### Railway

New service from the repo. It will pick up `Procfile` (`web: node server/index.js`). Set start command to `npm start` and add a build command `npm install && npm run build` if the board does not infer it.

### Docker (any VPS)

```bash
docker build -t duo-play .
docker run -p 3000:3000 -e PORT=3000 duo-play
```

Put HTTPS in front (Caddy, nginx, or the platform’s load balancer). WebSockets must be proxied (`Upgrade` + `Connection` headers). Path `/socket.io` has to reach this same process.

## Adding a game

1. `server/games/yourgame.js` exporting `create()`, `apply(state, playerIndex, action)`, `view(state, playerIndex)`.
2. Register in `server/games/catalog.js` and `server/rooms.js` `ENGINES`.
3. Add a board in `src/games/` and a case in `src/screens/Room.tsx`.
4. Mirror the card in `src/catalog.ts`.
