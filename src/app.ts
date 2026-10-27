import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
import { openDb, type DB } from './db.js';
import { HttpError } from './http.js';
import { studentRoutes, studentsRepo } from './students.js';
import { paymentRoutes, paymentsRepo } from './payments.js';
import { debtorRoutes } from './debtors.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: DB;
  }
}

// npm scripts and tests run from the project root, for both tsx and compiled dist/.
const publicDir = join(process.cwd(), 'public');

export function buildApp({ dbPath = ':memory:', logger = false } = {}) {
  const app = Fastify({ logger });
  const db = openDb(dbPath);
  const students = studentsRepo(db);
  const payments = paymentsRepo(db);

  app.decorate('db', db);
  app.addHook('onClose', async () => db.close());

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.message, details: err.details });
    }
    // Fastify's own errors (e.g. malformed JSON body) carry a 4xx statusCode.
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.code(status).send({ error: (err as Error).message });
    app.log.error(err);
    return reply.code(500).send({ error: 'Internal server error' });
  });

  app.register(fastifyStatic, { root: publicDir });
  studentRoutes(app, students);
  paymentRoutes(app, payments, students);
  debtorRoutes(app, db);

  return app;
}
