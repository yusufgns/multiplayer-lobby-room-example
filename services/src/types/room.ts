import type { Profile } from "./profile";

export interface Room {
    id: string;
    lobbyId: string;
    players: Profile[];
    gameState: any;
    isActive: boolean;
    createdAt: Date;
}