import { IncomingMessage, Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { LobbyHandler } from "./lobby-handler";
import { RoomHandler } from "./room-handler";

export class WebSocketManager {
    private wss: WebSocketServer;
    
    constructor(server: HttpServer) {
        this.wss = new WebSocketServer({ server });
        this.init();
    }

    private init() {
        this.wss.on('connection', ws => {
            console.log('New WebSocket connection');
            
            ws.on('message', async message => {
                try {
                    const data = JSON.parse(message.toString());
                    console.log('WebSocket message received:', data);
                    
                    switch (data.type) {
                        case 'join_lobby':
                            await LobbyHandler.handleJoinLobby(ws, data);
                            break;
                        case 'leave_lobby':
                            await LobbyHandler.handleLeaveLobby(ws);
                            break;
                        case 'join_room':
                            await RoomHandler.handleJoinRoom(ws, data);
                            break;
                        case 'update_game_state':
                            await RoomHandler.handleUpdateGameState(ws, data);
                            break;
                        default:
                            ws.send(JSON.stringify({
                                type: 'error',
                                data: { message: 'Unknown message type' }
                            }));
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        data: { message: 'Invalid message format' }
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log('WebSocket connection closed - cleaning up client');
                this.cleanupClient(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.cleanupClient(ws);
            });
        });
    }

    private async cleanupClient(ws: WebSocket) {
        // Clean up from both lobby and room handlers
        await LobbyHandler.removeClient(ws);
        RoomHandler.removeClient(ws);
    }
}
