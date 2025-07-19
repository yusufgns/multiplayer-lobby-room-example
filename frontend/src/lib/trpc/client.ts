import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../service/src/trpc/app';

export const trpc = createTRPCReact<AppRouter>();
