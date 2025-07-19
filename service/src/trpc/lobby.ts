import { z } from "zod";
import { prisma } from "./index";
import { publicProcedure, router } from "./index";
import { LobbyHandler } from "../websocket/lobby-handler";

export const lobbyRouter = router({
    createLobby: publicProcedure.input(z.object({
        name: z.string(),
        maxPlayers: z.number(),
    })).mutation(async ({ input }) => {
        const lobby = await prisma.lobby.create({
            data: input,
        });
        
        return lobby;
    }),
    getLobby: publicProcedure.input(z.object({
        lobbyId: z.string(),
    })).query(async ({ input }) => {
        const lobby = await prisma.lobby.findUnique({
            where: {
                id: input.lobbyId,
            },
            include: {
                players: true,
            },
        });
        return lobby;
    }),
    joinLobby: publicProcedure.input(z.object({
        lobbyId: z.string(),
        sessionId: z.string(),
    })).mutation(async ({ input }) => {
        const lobby = await prisma.lobby.update({
            where: {
                id: input.lobbyId,
            },
            data: {
                players: {
                    connect: {
                        sessionId: input.sessionId,
                    },
                },
            },
            include: {
                players: true,
            },
        });

        await LobbyHandler.broadcastLobbyUpdate(input.lobbyId);
        
        return lobby;
    }),
    leaveLobby: publicProcedure.input(z.object({
        lobbyId: z.string(),
        sessionId: z.string(),
    })).mutation(async ({ input }) => {
        const lobby = await prisma.lobby.update({
            where: {
                id: input.lobbyId,
            },
            data: {
                players: {
                    disconnect: {
                        sessionId: input.sessionId,
                    },
                },
            },
            include: {
                players: true,
            },
        });

        await LobbyHandler.broadcastLobbyUpdate(input.lobbyId);
        
        return lobby;
    }),
    startGame: publicProcedure.input(z.object({
        lobbyId: z.string(),
    })).mutation(async ({ input }) => {
        const lobby = await prisma.lobby.update({
            where: {
                id: input.lobbyId,
            },
            data: {
                isActive: true,
            },
            include: {
                players: true,
            },
        });

        await LobbyHandler.broadcastGameStarted(input.lobbyId);
        
        return lobby;
    }),
})
