import { WebSocket } from 'ws';
import { prisma } from '../trpc/index';

const lobbyClients = new Map<string, Set<WebSocket>>();
const clientSessions = new Map<WebSocket, { lobbyId: string; sessionId: string }>();

export class LobbyHandler {
  static async handleJoinLobby(ws: WebSocket, data: any) {
    try {
      const { lobbyId, sessionId } = data.data || data;
      
      if (!lobbyId) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Lobby ID is required' }
        }));
        return;
      }

      const currentSession = clientSessions.get(ws);
      if (currentSession && currentSession.lobbyId === lobbyId) {
        console.log(`Client already in lobby ${lobbyId}`);
        return;
      }

      if (currentSession) {
        this.removeClientFromLobby(ws, currentSession.lobbyId);
      }

      if (!lobbyClients.has(lobbyId)) {
        lobbyClients.set(lobbyId, new Set());
      }
      lobbyClients.get(lobbyId)!.add(ws);
      
      (ws as any).lobbyId = lobbyId;
      (ws as any).sessionId = sessionId;
      clientSessions.set(ws, { lobbyId, sessionId });
      
      console.log(`Client joined lobby ${lobbyId}`);
      
      ws.send(JSON.stringify({
        type: 'lobby_joined',
        data: { lobbyId }
      }));
      
      await this.broadcastLobbyUpdate(lobbyId);
      
    } catch (error) {
      console.error('Error joining lobby:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to join lobby' }
      }));
    }
  }
  
  static async handleLeaveLobby(ws: WebSocket) {
    try {
      const currentSession = clientSessions.get(ws);
      const wsLobbyId = currentSession?.lobbyId;
      
      if (!wsLobbyId) {
        console.log('Client not in any lobby');
        return;
      }
      
      this.removeClientFromLobby(ws, wsLobbyId);
      
      console.log(`Client left lobby ${wsLobbyId}`);
      
      await this.broadcastLobbyUpdate(wsLobbyId);
      
    } catch (error) {
      console.error('Error leaving lobby:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to leave lobby' }
      }));
    }
  }

  static removeClientFromLobby(ws: WebSocket, lobbyId: string) {
    const clients = lobbyClients.get(lobbyId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        lobbyClients.delete(lobbyId);
      }
    }
    
    (ws as any).lobbyId = null;
    (ws as any).sessionId = null;
    clientSessions.delete(ws);
  }

  static async broadcastLobbyUpdate(lobbyId: string) {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { id: lobbyId },
        include: { players: true }
      });

      if (!lobby) return;

      const clients = lobbyClients.get(lobbyId);
      if (clients) {
        const message = JSON.stringify({
          type: 'lobby_updated',
          data: { lobby }
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting lobby update:', error);
    }
  }

  static async broadcastGameStarted(lobbyId: string) {
    try {
      const clients = lobbyClients.get(lobbyId);
      if (clients) {
        const message = JSON.stringify({
          type: 'game_started',
          data: { lobbyId }
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting game started:', error);
    }
  }

  static async removeClient(ws: WebSocket) {
    const currentSession = clientSessions.get(ws);
    
    if (currentSession) {
      const { lobbyId, sessionId } = currentSession;
      console.log(`Client disconnected from lobby ${lobbyId}, removing from lobby`);
      
      try {
        if (sessionId) {
          await prisma.lobby.update({
            where: { id: lobbyId },
            data: {
              players: {
                disconnect: { sessionId }
              }
            }
          });
        }
        
        this.removeClientFromLobby(ws, lobbyId);
        
        await this.broadcastLobbyUpdate(lobbyId);
        
      } catch (error) {
        console.error('Error removing disconnected client from lobby:', error);
      }
    }
  }
}
