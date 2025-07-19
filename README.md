# Multiplayer Lobby Room Example

A real-time multiplayer lobby and room system built with Next.js, Fastify, tRPC, and WebSocket.

## Features

- Create and join lobbies
- Real-time player updates via WebSocket
- Game room management
- Session management
- Modern UI with Tailwind CSS

## Project Structure

```
multiplayer-lobby-room-example/
├── backend/          (Fastify + tRPC)
├── frontend/         (Next.js)
└── README.md
```

## Environment Variables

### Frontend (frontend/.env.local)

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### Backend (backend/.env)

Create a `.env` file in the `backend` directory:

```env
PORT=3001
HOST=0.0.0.0
DATABASE_URL="file:./dev.db"
```

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Create a new lobby with a name and max players
3. Share the lobby URL with other players
4. Players can join the lobby and see real-time updates
5. Start the game when ready

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Fastify, tRPC, Prisma, SQLite
- **Real-time**: WebSocket
- **Database**: SQLite (development)
