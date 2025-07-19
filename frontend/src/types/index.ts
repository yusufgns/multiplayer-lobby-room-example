export interface Profile {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lobby {
  id: string;
  name: string;
  maxPlayers: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  players: Profile[];
  room?: Room;
}

export interface Room {
  id: string;
  lobbyId: string;
  gameState?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  players: Profile[];
  lobby: Lobby;
}
