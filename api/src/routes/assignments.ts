import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';
import { AssignmentSchema } from '../validation';

const router = Router();

router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: { delivery: true, crew_member: true },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = AssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'validation_error', message: 'Invalid request data', detail: validation.error.issues });
      return;
    }
    const { role_on_ship, crew_member_id, delivery_id } = validation.data;

    const delivery = await prisma.delivery.findUnique({ where: { id: delivery_id } });
    if (!delivery) {
      res.status(404).json({ error: 'not_found', message: `Delivery with ID ${delivery_id} not found` });
      return;
    }
    const crewMember = await prisma.crewMember.findUnique({ where: { id: crew_member_id } });
    if (!crewMember) {
      res.status(404).json({ error: 'not_found', message: `Crew member with ID ${crew_member_id} not found` });
      return;
    }

    const assignment = await prisma.assignment.upsert({
      where: { delivery_id_crew_member_id: { delivery_id, crew_member_id } },
      update: { role_on_ship },
      create: { role_on_ship, delivery_id, crew_member_id },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

export default router;
