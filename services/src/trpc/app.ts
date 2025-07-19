import { router } from './index';
import { profileRouter } from './profile';
import { lobbyRouter } from './lobby';
import { roomRouter } from './room';

export const appRouter = router({
  profile: profileRouter,
  lobby: lobbyRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter;