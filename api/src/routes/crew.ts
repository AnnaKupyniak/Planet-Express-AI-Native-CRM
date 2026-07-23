import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fired = req.query.fired === 'true';
    const crewMembers = await prisma.crewMember.findMany({
      where: { is_fired: fired }
    });
    res.json(crewMembers);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const crewId = Number(req.params.id);
    const member = await prisma.crewMember.findUnique({ where: { id: crewId } });
    if (!member) {
      res.status(404).json({ error: 'not_found', message: 'Crew member not found' });
      return;
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      res.status(400).json({ error: 'validation_error', message: 'Name and role are required' });
      return;
    }
    const newMember = await prisma.crewMember.create({ data: { name, role } });
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const crewId = Number(req.params.id);
    const { reason } = req.body;
    await prisma.crewMember.update({ 
      where: { id: crewId },
      data: { is_fired: true, fire_reason: reason || 'Unknown' }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.patch('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const crewId = Number(req.params.id);
    const member = await prisma.crewMember.update({
      where: { id: crewId },
      data: { is_fired: false, fire_reason: null }
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

export default router;
