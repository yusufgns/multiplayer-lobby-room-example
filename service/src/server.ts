import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRouter } from './trpc/app';
import { WebSocketManager } from './websocket/manager';
import { prisma } from './trpc/index';

const server = Fastify({
  logger: true
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// CORS setup
server.register(cors, {
  origin: ['http://localhost:3000'],
  credentials: true
});

// tRPC setup
server.register(async function (fastify) {
  fastify.post('/trpc/:procedure', async (request, reply) => {
    const { procedure } = request.params as { procedure: string };
    const body = request.body as any;
    
    try {
      const caller = appRouter.createCaller({ prisma });
      const result = await (caller as any)[procedure](body);
      return result;
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
});

// WebSocket setup
const httpServer = server.server;
if (httpServer) {
  new WebSocketManager(httpServer);
}

// Health check
server.get('/health', async () => {
  return { status: 'ok' };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
