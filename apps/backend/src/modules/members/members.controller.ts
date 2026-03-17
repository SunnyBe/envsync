import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as membersService from './members.service';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']),
});

export async function inviteHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const result = await membersService.inviteMember(
      req.params.projectId,
      parsed.data.email,
      parsed.data.role,
      req.user!.id,
      req.ip,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function acceptHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await membersService.acceptInvite(req.params.inviteToken, req.user!.id, req.user!.email);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function listHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await membersService.listMembers(req.params.projectId, req.user!.id);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}

export async function removeHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await membersService.removeMember(req.params.projectId, req.params.memberId, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
