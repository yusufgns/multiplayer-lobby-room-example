import { WebSocket } from 'ws';
import { prisma } from '../trpc/index';

const roomClients = new Map<string, Set<WebSocket>>();

export class RoomHandler {
  static async handleJoinRoom(ws: WebSocket, data: any) {
    try {
      const { roomId, sessionId } = data.data || data;
      
      if (!roomId) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Room ID is required' }
        }));
        return;
      }

      const currentRoomId = (ws as any).roomId;
      if (currentRoomId === roomId) {
        console.log(`Client already in room ${roomId}`);
        return;
      }

      if (currentRoomId) {
        this.removeClientFromRoom(ws, currentRoomId);
      }

      if (!roomClients.has(roomId)) {
        roomClients.set(roomId, new Set());
      }
      roomClients.get(roomId)!.add(ws);
      
      (ws as any).roomId = roomId;
      (ws as any).sessionId = sessionId;
      
      console.log(`Client joined room ${roomId}`);
      
      ws.send(JSON.stringify({
        type: 'room_joined',
        data: { roomId }
      }));
      
      await this.broadcastRoomUpdate(roomId);
      
    } catch (error) {
      console.error('Error joining room:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to join room' }
      }));
    }
  }
  
  static async handleUpdateGameState(ws: WebSocket, data: any) {
    try {
      const { roomId, gameState } = data.data || data;
      const wsRoomId = (ws as any).roomId;
      
      if (!wsRoomId || wsRoomId !== roomId) return;
      
      const room = await prisma.room.update({
        where: { id: roomId },
        data: {
          gameState: JSON.stringify(gameState)
        },
        include: { players: true }
      });
      
      await this.broadcastGameStateUpdate(roomId, room);
      
    } catch (error) {
      console.error('Error updating game state:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to update game state' }
      }));
    }
  }

  static removeClientFromRoom(ws: WebSocket, roomId: string) {
    const clients = roomClients.get(roomId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        roomClients.delete(roomId);
      }
    }
    
    (ws as any).roomId = null;
    (ws as any).sessionId = null;
  }

  static async broadcastRoomUpdate(roomId: string) {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { players: true }
      });

      if (!room) return;

      const clients = roomClients.get(roomId);
      if (clients) {
        const message = JSON.stringify({
          type: 'room_updated',
          data: { room }
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting room update:', error);
    }
  }

  static async broadcastGameStateUpdate(roomId: string, room: any) {
    try {
      const clients = roomClients.get(roomId);
      if (clients) {
        const message = JSON.stringify({
          type: 'game_state_updated',
          data: { room }
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting game state update:', error);
    }
  }

  static removeClient(ws: WebSocket) {
    const roomId = (ws as any).roomId;
    if (roomId) {
      this.removeClientFromRoom(ws, roomId);
    }
  }
}
