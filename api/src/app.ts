import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import authRouter from './routes/auth';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

import planetsRouter from './routes/planets';
import crewRouter from './routes/crew';
import deliveriesRouter from './routes/deliveries';
import clientsRouter from './routes/clients';
import assignmentsRouter from './routes/assignments';
import chatRouter from './routes/chat';
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './graphql/schema';
import { createDataLoaders } from './graphql/dataloaders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Налаштування адаптера Prisma 7 для PostgreSQL
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Експортуємо клієнт Prisma для використання в роутерах
export const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// 1. Публічні ендпоінти (Без JWT)
app.use('/api/auth', authRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', system: 'Planet Express CRM' });
});

// 2. Захищені ендпоінти (Вимагають Bearer JWT token)
const authMiddleware = authenticateToken as RequestHandler;

app.use('/api/planets', authMiddleware, planetsRouter);
app.use('/api/crew', authMiddleware, crewRouter);
app.use('/api/deliveries', authMiddleware, deliveriesRouter);
app.use('/api/clients', authMiddleware, clientsRouter);
app.use('/api/assignments', authMiddleware, assignmentsRouter);
app.use('/api/chat', authMiddleware, chatRouter);

// Щодо GraphQL: він також захищений JWT, як і REST. Якщо запит не авторизований,
// authMiddleware поверне 401 помилку ще до виклику createHandler.
app.use('/api/graphql', authMiddleware, createHandler({
  schema,
  context: (req: any) => ({
    loaders: createDataLoaders(),
    user: req.raw.user
  })
}));
app.use('/graphql', authMiddleware, createHandler({
  schema,
  context: (req: any) => ({
    loaders: createDataLoaders(),
    user: req.raw.user
  })
}));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Planet Express API running on http://localhost:${PORT}`);
});

export default app;