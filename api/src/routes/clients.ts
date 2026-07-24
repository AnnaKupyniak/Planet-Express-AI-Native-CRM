import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';
import { ClientSchema } from '../validation';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const search = req.query.search as string;
  const trashed = req.query.trashed === 'true';
  const clients = await prisma.client.findMany({
    where: { 
      is_deleted: trashed,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {})
    },
    include: { deliveries: true },
  });
  res.json(clients);
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const clientId = Number(req.params.id);
  if (isNaN(clientId)) {
    res.status(400).json({ error: 'validation_error', message: 'Invalid client ID' });
    return;
  }
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { deliveries: true },
  });
  if (!client) {
    res.status(404).json({ error: 'not_found', message: 'Client not found' });
    return;
  }
  res.json(client);
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validation = ClientSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: 'validation_error', message: 'Invalid request data', detail: validation.error.issues });
    return;
  }
  const { name, is_evil, description } = req.body;
  const existingClient = await prisma.client.findFirst({ where: { name } });
  if (existingClient) {
    res.status(200).json(existingClient);
    return;
  }
  const newClient = await prisma.client.create({ data: { name, is_evil, description } });
  res.status(201).json(newClient);
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const clientId = Number(req.params.id);
  await prisma.client.update({
    where: { id: clientId },
    data: { is_deleted: true }
  });
  res.status(204).send();
});

router.patch('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const clientId = Number(req.params.id);
  const client = await prisma.client.update({
    where: { id: clientId },
    data: { is_deleted: false }
  });
  res.json(client);
});

export default router;
