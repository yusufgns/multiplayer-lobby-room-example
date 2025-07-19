import type { Profile } from "./profile";

export interface Lobby {
    id: string;
    name: string;
    maxPlayers: number;
    players: Profile[];
    isActive: boolean;
    createdAt: Date;
    roomId: string;
}