'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

interface Lobby {
  id: string;
  name: string;
  maxPlayers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  players: Profile[];
}

export default function LobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Profile | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const router = useRouter();
  const hasJoinedWebSocket = useRef(false);

  const { isConnected, lastMessage, sendMessage } = useWebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws');

  const getSessionId = () => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return null;
  };

  const createOrGetProfile = async (sessionId: string) => {
    try {
      const getResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile.getProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
        }),
      });
      
      const getResult = await getResponse.json();
      
      if (getResult && getResult.id) {
        return getResult;
      }
      
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile.createProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Player ${Math.floor(Math.random() * 1000)}`,
          sessionId: sessionId,
        }),
      });
      
      const createResult = await createResponse.json();
      return createResult;
    } catch (error) {
      console.error('Failed to create/get profile:', error);
      return null;
    }
  };

  const joinLobby = async (sessionId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lobby.joinLobby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lobbyId: id,
          sessionId: sessionId,
        }),
      });
      
      const result = await response.json();
      console.log('Join Lobby Response:', result);
      return result;
    } catch (error) {
      console.error('Failed to join lobby:', error);
      return null;
    }
  };

  const fetchLobby = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/trpc/lobby.getLobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lobbyId: id,
        }),
      });
      
      const result = await response.json();
      console.log('Lobby Response:', result);
      
      if (result && result.id) {
        setLobby(result);
      } else {
        setError('Lobby not found');
      }
    } catch (error) {
      console.error('Failed to fetch lobby:', error);
      setError('Failed to load lobby');
    }
  }, [id]);

  useEffect(() => {
    if (lastMessage) {
      console.log('Processing WebSocket message:', lastMessage);
      
      switch (lastMessage.type) {
        case 'lobby_updated':
          if (lastMessage.data && lastMessage.data.lobby) {
            setLobby(lastMessage.data.lobby);
          }
          break;
        case 'game_started':
          if (lastMessage.data.lobbyId === id) {
            router.push(`/room/${id}`);
          }
          break;
        case 'lobby_joined':
          console.log('Successfully joined lobby via WebSocket');
          fetchLobby();
          break;
        default:
          console.log('Unknown WebSocket message type:', lastMessage.type);
      }
    }
  }, [lastMessage, id, router, fetchLobby]);

  useEffect(() => {
    if (isConnected && id && currentPlayer && !hasJoinedWebSocket.current) {
      console.log('Joining WebSocket lobby room:', id);
      sendMessage({
        type: 'join_lobby',
        data: { 
          lobbyId: id,
          sessionId: currentPlayer.sessionId 
        }
      });
      hasJoinedWebSocket.current = true;
    }
  }, [isConnected, id, currentPlayer, sendMessage]);

  useEffect(() => {
    if (isConnected && id && !hasJoinedWebSocket.current) {
      fetchLobby();
    }
  }, [isConnected, id, fetchLobby]);

  useEffect(() => {
    if (isConnected && id && currentPlayer && hasJoinedWebSocket.current) {
      fetchLobby();
    }
  }, [isConnected, id, currentPlayer, fetchLobby]);

  useEffect(() => {
    if (isConnected && id && currentPlayer && hasJoinedWebSocket.current) {
      setTimeout(() => fetchLobby(), 500);
    }
  }, [isConnected, id, currentPlayer, fetchLobby]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isConnected && id && currentPlayer && hasJoinedWebSocket.current) {
      intervalId = setInterval(() => {
        fetchLobby();
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, id, currentPlayer, fetchLobby]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isConnected && currentPlayer && !isLeaving) {
        const message = 'Are you sure you want to leave the lobby?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, currentPlayer, id, sendMessage, isLeaving]);

  useEffect(() => {
    const initializeLobby = async () => {
      try {
        setIsLeaving(false);
        
        const sessionId = getSessionId();
        if (!sessionId) return;

        const profile = await createOrGetProfile(sessionId);
        if (profile) {
          setCurrentPlayer(profile);
          
          await joinLobby(sessionId);
        }

        await fetchLobby();
      } catch (error) {
        console.error('Failed to initialize lobby:', error);
        setError('Failed to load lobby');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      initializeLobby();
    }
  }, [id, fetchLobby]);

  const handleStartGame = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lobby.startGame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lobbyId: id,
        }),
      });
      
      const result = await response.json();
      console.log('Start Game Response:', result);
      
      if (result && result.isActive) {
        router.push(`/room/${id}`);
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleLeaveLobby = async () => {
    if (!id || !currentPlayer || isLeaving) return;
    
    setIsLeaving(true);
    
    try {
      if (isConnected) {
        sendMessage({
          type: 'leave_lobby',
          data: { 
            lobbyId: id,
            sessionId: currentPlayer.sessionId 
          }
        });
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lobby.leaveLobby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lobbyId: id,
          sessionId: currentPlayer.sessionId,
        }),
      });
      
      const result = await response.json();
      console.log('Leave Lobby Response:', result);
      
      router.push('/');
    } catch (error) {
      console.error('Failed to leave lobby:', error);
      setIsLeaving(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading lobby...</div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-white text-xl mb-4">{error || 'Lobby not found'}</div>
          <button
            onClick={handleBackToHome}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">{lobby.name}</h1>
              <p className="text-white/70 mt-2">
                Players: {lobby.players?.length || 0}/{lobby.maxPlayers}
              </p>
              {currentPlayer && (
                <p className="text-white/50 text-sm mt-1">
                  You: {currentPlayer.name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white/50 text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStartGame}
                disabled={!lobby.players || lobby.players.length < 2}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Start Game
              </button>
              <button
                onClick={handleLeaveLobby}
                disabled={isLeaving}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLeaving ? 'Leaving...' : 'Leave Lobby'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lobby.players?.map((player) => (
              <div
                key={player.id}
                className={`bg-white/5 rounded-lg p-4 border ${
                  currentPlayer && player.id === currentPlayer.id 
                    ? 'border-green-400 bg-green-500/10' 
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-white font-medium">
                    {player.name}
                    {currentPlayer && player.id === currentPlayer.id && ' (You)'}
                  </span>
                </div>
              </div>
            )) || []}
          </div>
          
          {Array.from({ length: lobby.maxPlayers - (lobby.players?.length || 0) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white/5 rounded-lg p-4 border border-white/10 border-dashed mt-4"
            >
              <div className="text-white/50 text-center">Waiting for player...</div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <div className="text-white/50 text-sm">
            Lobby ID: {lobby.id}
          </div>
          {currentPlayer && (
            <div className="text-white/50 text-sm mt-1">
              Your Session ID: {currentPlayer.sessionId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
