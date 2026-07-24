import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';
import { DeliverySchema } from '../validation';

const router = Router();

router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deliveries = await prisma.delivery.findMany({
    include: {
      planet: true,
      client: true,
      assignments: { include: { crew_member: true } },
      logs: true,
    },
  });
  res.json(deliveries);
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deliveryId = Number(req.params.id);
  if (isNaN(deliveryId)) {
    res.status(400).json({ error: 'validation_error', message: 'Invalid delivery ID' });
    return;
  }
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      planet: true,
      client: true,
      assignments: { include: { crew_member: true } },
      logs: { orderBy: { timestamp: 'asc' } },
    },
  });
  if (!delivery) {
    res.status(404).json({ error: 'not_found', message: `Delivery with ID ${deliveryId} not found` });
    return;
  }
  res.json(delivery);
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validation = DeliverySchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: 'validation_error', message: 'Invalid request data', detail: validation.error.issues });
    return;
  }
  const { cargo_name, reward_cash, planet_id, client_id } = validation.data;
  
  const planetExists = await prisma.planet.findUnique({ where: { id: planet_id } });
  if (!planetExists) { res.status(404).json({ error: 'not_found', message: `Planet with ID ${planet_id} not found` }); return; }
  const clientExists = await prisma.client.findUnique({ where: { id: client_id } });
  if (!clientExists) { res.status(404).json({ error: 'not_found', message: `Client with ID ${client_id} not found` }); return; }
  
  // Idempotency check: if a delivery with the same cargo_name, planet_id, client_id already exists, return it
  const existingDelivery = await prisma.delivery.findFirst({
    where: { cargo_name, planet_id, client_id }
  });
  if (existingDelivery) {
    res.status(200).json(existingDelivery);
    return;
  }

  const newDelivery = await prisma.delivery.create({
    data: { cargo_name, reward_cash, planet_id, client_id, status: 'pending' },
  });
  res.status(201).json(newDelivery);
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deliveryId = Number(req.params.id);
  const { status } = req.body;
  if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'validation_error', message: 'Invalid status' });
    return;
  }
  const updated = await prisma.delivery.update({ where: { id: deliveryId }, data: { status } });
  res.json(updated);
});

export default router;
