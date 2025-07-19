'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface Profile {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  lobbyId: string;
  gameState: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  players: Profile[];
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const router = useRouter();

  const { isConnected, lastMessage, sendMessage } = useWebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws');

  const fetchRoom = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/room.getRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: id,
        }),
      });
      
      const result = await response.json();
      console.log('Room Response:', result);
      
      if (result && result.id) {
        setRoom(result);
      } else {
        setError('Room not found');
      }
    } catch (error) {
      console.error('Failed to fetch room:', error);
      setError('Failed to load room');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRoom();
    }
  }, [id]);

  useEffect(() => {
    if (lastMessage) {
      console.log('Processing WebSocket message:', lastMessage);
      
      switch (lastMessage.type) {
        case 'room_updated':
          if (lastMessage.data && lastMessage.data.room) {
            setRoom(lastMessage.data.room);
          }
          break;
        case 'game_state_updated':
          if (lastMessage.data && lastMessage.data.room) {
            setRoom(lastMessage.data.room);
          }
          break;
        default:
          console.log('Unknown WebSocket message type:', lastMessage.type);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const newSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);
  }, []);

  useEffect(() => {
    if (isConnected && sessionId && id) {
      sendMessage({
        type: 'join_room',
        data: { roomId: id }
      });
    }
  }, [isConnected, sessionId, id, sendMessage]);

  const handleUpdateGameState = (gameState: any) => {
    if (isConnected && id) {
      sendMessage({
        type: 'update_game_state',
        data: { roomId: id, gameState }
      });
    }
  };

  const handleBackToLobby = () => {
    router.push(`/lobby/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-white text-xl mb-4">{error || 'Room not found'}</div>
          <button
            onClick={handleBackToLobby}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Game Room</h1>
              <p className="text-white/70 mt-2">
                Players: {room.players?.length || 0} | Room ID: {room.id}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white/50 text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <button
              onClick={handleBackToLobby}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 h-96">
              <h2 className="text-2xl font-bold text-white mb-4">Game Area</h2>
              <div className="bg-black/20 rounded-lg h-64 flex items-center justify-center">
                <div className="text-white/50 text-center">
                  <p>Game canvas will be here</p>
                  <button
                    onClick={() => handleUpdateGameState({ action: 'test', timestamp: Date.now() })}
                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Test Game State
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Players Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Players</h2>
              <div className="space-y-4">
                {room.players?.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Game State */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mt-6">
              <h2 className="text-2xl font-bold text-white mb-4">Game State</h2>
              <div className="bg-black/20 rounded-lg p-4">
                <pre className="text-white/70 text-sm overflow-auto">
                  {room.gameState ? JSON.stringify(JSON.parse(room.gameState), null, 2) : 'No game state'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 text-center">
          <div className="text-white/50 text-sm">
            Room ID: {room.id}
          </div>
          <div className="text-white/50 text-sm mt-1">
            Session ID: {sessionId}
          </div>
        </div>
      </div>
    </div>
  );
}
