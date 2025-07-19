import { z } from "zod";
import { publicProcedure, router } from "./index";
import { prisma } from "./index";
import { RoomHandler } from "../websocket/room-handler";

export const roomRouter = router({
    getRoom: publicProcedure.input(z.object({
        roomId: z.string(),
    })).query(async ({ input }) => {
        const room = await prisma.room.findUnique({
            where: {
                id: input.roomId,
            },
            include: {
                players: true,
            },
        });
        return room;
    }),
    getRoomByLobbyId: publicProcedure.input(z.object({
        lobbyId: z.string(),
    })).query(async ({ input }) => {
        const room = await prisma.room.findFirst({
            where: {
                lobbyId: input.lobbyId,
            },
            include: {
                players: true,
            },
        });
        return room;
    }),
    updateGameState: publicProcedure.input(z.object({
        roomId: z.string(),
        gameState: z.string(),
    })).mutation(async ({ input }) => {
        const room = await prisma.room.update({
            where: {
                id: input.roomId,
            },
            data: {
                gameState: input.gameState,
            },
            include: {
                players: true,
            },
        });

        await RoomHandler.broadcastGameStateUpdate(input.roomId, room);
        
        return room;
    }),
})
