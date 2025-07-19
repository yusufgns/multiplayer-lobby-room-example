'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [lobbyName, setLobbyName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateLobby = async () => {
    if (!lobbyName.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lobby.createLobby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: lobbyName,
          maxPlayers,
        }),
      });
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result && result.id) {
        router.push(`/lobby/${result.id}`);
      } else {
        console.error('Invalid response format:', result);
      }
    } catch (error) {
      console.error('Failed to create lobby:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Multiplayer Lobby Room
        </h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Lobby Name
            </label>
            <input
              type="text"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter lobby name..."
            />
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Max Players
            </label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
              <option value={8}>8 Players</option>
            </select>
          </div>
          
          <button
            onClick={handleCreateLobby}
            disabled={!lobbyName.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Lobby'}
          </button>
        </div>
      </div>
    </div>
  );
}
