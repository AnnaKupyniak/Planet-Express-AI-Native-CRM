import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const trashed = req.query.trashed === 'true';
  const planets = await prisma.planet.findMany({
    where: { is_deleted: trashed }
  });
  res.json(planets);
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const planetId = Number(req.params.id);
  const planet = await prisma.planet.findUnique({ where: { id: planetId } });
  if (!planet) {
    res.status(404).json({ error: 'not_found', message: 'Planet not found' });
    return;
  }
  res.json(planet);
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, danger_level, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'validation_error', message: 'Name is required' });
    return;
  }
  const existingPlanet = await prisma.planet.findFirst({ where: { name } });
  if (existingPlanet) {
    res.status(200).json(existingPlanet);
    return;
  }
  const newPlanet = await prisma.planet.create({
    data: { 
      name, 
      danger_level: danger_level || 'low',
      description
    }
  });
  res.status(201).json(newPlanet);
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const planetId = Number(req.params.id);
  await prisma.planet.update({
    where: { id: planetId },
    data: { is_deleted: true }
  });
  res.status(204).send();
});

router.patch('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const planetId = Number(req.params.id);
  const planet = await prisma.planet.update({
    where: { id: planetId },
    data: { is_deleted: false }
  });
  res.json(planet);
});

export default router;
