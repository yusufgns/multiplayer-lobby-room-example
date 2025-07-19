import { prisma } from '../trpc/index';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

export const getRandomColor = (): string => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const isColorAvailable = async (color: string, lobbyId: string): Promise<boolean> => {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { players: true }
  });
  
  if (!lobby) return false;
  
  return !lobby.players.some((player: { color: string; }) => player.color === color);
};

export const getAvailableColors = async (lobbyId: string): Promise<string[]> => {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: { players: true }
  });
  
  if (!lobby) return COLORS;
  
  const usedColors = lobby.players.map((player: { color: string; }) => player.color);
  return COLORS.filter(color => !usedColors.includes(color));
};
