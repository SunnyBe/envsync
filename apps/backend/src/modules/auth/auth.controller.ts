import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { registerSchema } from './auth.validation';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const result = await authService.registerUser(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
