import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';
import { CrewMemberSchema } from '../validation';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const fired = req.query.fired === 'true';
  const crewMembers = await prisma.crewMember.findMany({
    where: { is_fired: fired }
  });
  res.json(crewMembers);
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const crewId = Number(req.params.id);
  const member = await prisma.crewMember.findUnique({ where: { id: crewId } });
  if (!member) {
    res.status(404).json({ error: 'not_found', message: 'Crew member not found' });
    return;
  }
  res.json(member);
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validation = CrewMemberSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: 'validation_error', message: 'Invalid request data', detail: validation.error.issues });
    return;
  }
  const { name, role } = validation.data;
  const existingMember = await prisma.crewMember.findFirst({ where: { name } });
  if (existingMember) {
    res.status(200).json(existingMember);
    return;
  }
  const newMember = await prisma.crewMember.create({ data: { name, role } });
  res.status(201).json(newMember);
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const crewId = Number(req.params.id);
  const { reason } = req.body;
  await prisma.crewMember.update({ 
    where: { id: crewId },
    data: { is_fired: true, fire_reason: reason || 'Unknown' }
  });
  res.status(204).send();
});

router.patch('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const crewId = Number(req.params.id);
  const member = await prisma.crewMember.update({
    where: { id: crewId },
    data: { is_fired: false, fire_reason: null }
  });
  res.json(member);
});

export default router;
