import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Створюємо ОДИН пул підключень для всього застосунку
const pool = new pg.Pool({ connectionString, max: 10 });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });