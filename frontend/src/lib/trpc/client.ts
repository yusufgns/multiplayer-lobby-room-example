import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../../backend/src/trpc/app';

export const trpc = createTRPCReact<AppRouter>();
