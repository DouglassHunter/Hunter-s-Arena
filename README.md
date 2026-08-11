# NEXUS ARENA — Real-Time Online Multiplayer Gaming Platform

NEXUS ARENA is a modern, responsive, scalable online 1v1 gaming platform built with React, Node.js, Express, Socket.IO, and Tailwind CSS. The platform features real-time WebSocket multiplayer, server-authoritative move validation, an ELO rating system, global leaderboards, detailed player statistics, match history logging, and a social friends system.

---

## 1. Project Overview

NEXUS ARENA is designed from the ground up as an extensible gaming ecosystem rather than a monolithic single-game site. It initially launches with two competitive 1v1 titles:
- **Tic-Tac-Toe**: Classic 3x3 line duel with turn alternation, server validation, winning line highlights, and ELO calculations.
- **Rock-Paper-Scissors**: Competitive Best-of-5 duel featuring simultaneous choice locking, countdowns, reveal animations, and match completion scores.

---

## 2. Platform Architecture

```
                 ┌────────────────────────────────┐
                 │       React Client App         │
                 │ (Router, Contexts, Audio Synth)│
                 └──────────────┬─────────────────┘
                                │
                      REST API  │  Socket.IO WS
                     & Auth     │  (Port 3000)
                                ▼
                 ┌────────────────────────────────┐
                 │    Node.js Express Server      │
                 ├────────────────────────────────┤
                 │  - Socket.IO Real-time Engine  │
                 │  - Server Game Validators      │
                 │  - ELO Rating Calculator       │
                 │  - Store & Match Archives      │
                 └────────────────────────────────┘
```

The architecture strictly separates:
- **UI Components**: Pages, Modals, Audio Synthesizer, Navigation.
- **Game Logic**: Modular server-authoritative game rule modules (`server/games/*`).
- **Socket & Networking**: Real-time room management, matchmaking queue, move broadcasting, and disconnect grace timeouts (`server/socket.ts`).
- **Database Schema**: Extensible PostgreSQL / Supabase schema (`src/db/schema.sql`).

---

## 3. Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Motion / Framer Motion, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express.js, Socket.IO.
- **Data Persistence & Schema**: PostgreSQL / Supabase SQL schema (`src/db/schema.sql`) with in-memory active store and JSON state fallback.
- **Audio**: Web Audio API Synthesizer (Zero asset loading dependencies).

---

## 4. Environment Variables

Define the following environment variables in `.env` or system environment:

```env
# Server Port (Defaults to 3000)
PORT=3000

# Node Environment
NODE_ENV=development

# Gemini API Key (if AI Studio features are extended)
GEMINI_API_KEY=your_gemini_api_key_here

# Hosted App URL
APP_URL=http://localhost:3000
```

---

## 5. Database Setup (PostgreSQL / Supabase)

The complete SQL DDL schema is provided in `src/db/schema.sql`.

To seed your Supabase or PostgreSQL instance:
1. Copy the contents of `src/db/schema.sql`.
2. Run the SQL statements inside your Supabase SQL Editor or PostgreSQL client (`psql`).
3. The table structure covers `users`, `profiles`, `games`, `game_rooms`, `matches`, `match_players`, `player_statistics`, `ratings`, `leaderboard`, and `friends`.

---

## 6. Local Development Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The dev server starts on `http://localhost:3000` executing `server.ts` with Vite middleware.

3. **Lint Code**:
   ```bash
   npm run lint
   ```

---

## 7. Production Deployment Instructions

1. **Build the Application**:
   ```bash
   npm run build
   ```
   This compiles the Vite frontend into `dist/` and bundles `server.ts` into `dist/server.cjs` via `esbuild`.

2. **Start Production Server**:
   ```bash
   npm run start
   ```

---

## 8. Socket.IO Real-Time Architecture

The WebSocket event model enforces server authority:

- `room:create`: Generates unique 6-character room codes (`X7K92P`).
- `room:join`: Joins player to room by code.
- `matchmaking:find`: Places user into automated queue and creates a room when 2 players match.
- `game:move`: Receives client action, passes payload to server game engine module, validates, and emits `game:updated` or `game:finished`.
- `opponent:disconnected`: Grants a 30-second reconnection grace period before declaring match forfeit.

---

## 9. How to Add a New Game (e.g. Connect Four, Chess, Checkers)

Adding a new 1v1 game title requires zero changes to the core platform or database schema!

1. **Register Title in Database / Store**:
   Add entry in `GAMES_CATALOG` in `server/store.ts` or insert into the `games` SQL table:
   ```ts
   {
     id: 'game-3',
     name: 'Connect Four',
     slug: 'connect-four',
     description: 'Drop colored discs into a 7x6 grid to connect 4 in a row.',
     icon: 'Grid',
     minPlayers: 2,
     maxPlayers: 2,
     active: true,
     category: 'Strategy'
   }
   ```

2. **Create Server Rules Engine**:
   Create `server/games/connectFour.ts` with state creation and move validation functions:
   ```ts
   export function processConnectFourMove(state, playerId, colIndex) { ... }
   ```

3. **Plug Engine into Socket Handler**:
   In `server/socket.ts`, handle moves for `connect-four` in the `game:move` event listener.

4. **Add UI View Component**:
   Create `src/pages/ConnectFourPage.tsx` and add route `/game/connect-four` in `src/App.tsx`.
