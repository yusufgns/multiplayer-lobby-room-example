import { z } from "zod";
import { publicProcedure, router } from "./index";
import { prisma } from "./index";

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

const getRandomColor = async () => {
  const usedColors = await prisma.profile.findMany({
    select: { color: true }
  });
  
  const availableColors = COLORS.filter(color => 
    !usedColors.some((profile: { color: string }) => profile.color === color)
  );
  
  return availableColors.length > 0 
    ? availableColors[Math.floor(Math.random() * availableColors.length)]
    : COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const profileRouter = router({
  getProfile: publicProcedure.input(z.object({
    sessionId: z.string(),
  })).query(async ({ input }) => {
    const profile = await prisma.profile.findUnique({
      where: {
        sessionId: input.sessionId,
      },
    });
    return profile;
  }),
  createProfile: publicProcedure.input(z.object({
    name: z.string(),
    sessionId: z.string(),
    color: z.string().optional(),
  })).mutation(async ({ input }) => {
    const color = input.color || await getRandomColor();
    
    const profile = await prisma.profile.create({
      data: {
        name: input.name,
        sessionId: input.sessionId,
        color: color,
      },
    });
    return profile;
  }),
});