import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Planet Express database...');

  // 1. Користувач для JWT Auth
  const hashedPassword = await bcrypt.hash('farnsworth123', 10);
  await prisma.user.upsert({
    where: { email: 'professor@planetexpress.com' },
    update: {},
    create: {
      email: 'professor@planetexpress.com',
      password: hashedPassword,
      role: 'Professor',
    },
  });

  // 2. Клієнти
  await prisma.client.createMany({
    data: [
      { name: 'MomCorp', is_evil: true, description: "A friendly, family-owned mega-corporation that definitely doesn't want to conquer the universe." },
      { name: 'Robot Devil', is_evil: true, description: "Rules Robot Hell. Frequently makes Faustian bargains involving musical instruments." },
      { name: 'Government of Mars', is_evil: false, description: "Bureaucratic and largely influenced by the Wong family." },
    ],
    skipDuplicates: true,
  });

  // 3. Планети
  await prisma.planet.createMany({
    data: [
      { name: 'Earth', danger_level: 'low', description: "Mostly harmless. The birthplace of humanity, now the center of DOOP." },
      { name: 'Omicron Persei 8', danger_level: 'fatal', description: "A violent planet ruled by Lrrr. Inhabitants frequently invade Earth over television broadcasts." },
      { name: 'Chapek 9', danger_level: 'high', description: "A world inhabited entirely by robot separatists who kill humans on sight." },
    ],
    skipDuplicates: true,
  });

  // 4. Екіпаж
  await prisma.crewMember.createMany({
    data: [
      { name: 'Turanga Leela', role: 'Captain' },
      { name: 'Philip J. Fry', role: 'Delivery Boy' },
      { name: 'Bender Bending Rodríguez', role: 'Bending Unit' },
      { name: 'Dr. John A. Zoidberg', role: 'Staff Doctor' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });