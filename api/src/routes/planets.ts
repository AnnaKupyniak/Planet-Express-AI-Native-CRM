import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trashed = req.query.trashed === 'true';
    const planets = await prisma.planet.findMany({
      where: { is_deleted: trashed }
    });
    res.json(planets);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const planetId = Number(req.params.id);
    const planet = await prisma.planet.findUnique({ where: { id: planetId } });
    if (!planet) {
      res.status(404).json({ error: 'not_found', message: 'Planet not found' });
      return;
    }
    res.json(planet);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, danger_level, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'validation_error', message: 'Name is required' });
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
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const planetId = Number(req.params.id);
    await prisma.planet.update({
      where: { id: planetId },
      data: { is_deleted: true }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.patch('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const planetId = Number(req.params.id);
    const planet = await prisma.planet.update({
      where: { id: planetId },
      data: { is_deleted: false }
    });
    res.json(planet);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

export default router;
