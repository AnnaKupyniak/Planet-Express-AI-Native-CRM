import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(500).json({ error: 'db_error', message: err.message });
    return;
  }

  res.status(500).json({ 
    error: 'internal_error', 
    message: err.message || 'An unexpected error occurred' 
  });
};
