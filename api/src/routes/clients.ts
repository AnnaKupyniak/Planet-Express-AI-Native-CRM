import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../app';
import { ClientSchema } from '../validation';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = ClientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'validation_error', message: 'Invalid request data', detail: validation.error.issues });
      return;
    }
    const { name, is_evil, description } = req.body;
    const newClient = await prisma.client.create({ data: { name, is_evil, description } });
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.id);
    await prisma.client.update({
      where: { id: clientId },
      data: { is_deleted: true }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.patch('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.id);
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { is_deleted: false }
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

export default router;
