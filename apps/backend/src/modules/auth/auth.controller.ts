import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }
    const result = await authService.registerUser({ email });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
