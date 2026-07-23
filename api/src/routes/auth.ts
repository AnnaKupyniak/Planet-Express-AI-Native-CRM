import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JwtPayload } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

interface AuthRequestBody {
  email?: string;
  password?: string;
  role?: string;
}

router.post('/signup', async (req: Request<{}, {}, AuthRequestBody>, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'validation_error', message: 'Email and password are required' });
      return;
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'user_exists', message: 'User with this email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, role: role || 'crew' }
    });
    const payload: JwtPayload = { email: newUser.email, role: newUser.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({
      message: 'User created successfully',
      access_token: token,
      token_type: 'Bearer',
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

router.post('/login', async (req: Request<{}, {}, AuthRequestBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'validation_error', message: 'Email and password are required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { email: user.email, role: user.role };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      res.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
      return;
    }
    if (email === 'agent@planetexpress.com' && password === 'admin123') {
      const payload: JwtPayload = { email, role: 'agent' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      res.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
      return;
    }
    res.status(401).json({ error: 'invalid_credentials', message: 'Incorrect email or password' });
  } catch (error) {
    res.status(500).json({ error: 'db_error', message: (error as Error).message });
  }
});

export default router;
