import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../../data/dbStore';
import { sseHub } from './sseHub';
import { authenticate } from '../../common/middleware/auth.middleware';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { JwtUserPayload } from '@bloodconnect/shared';

const router = Router();

// SSE Stream Endpoint (supports token via query param for browser EventSource API)
router.get('/stream', (req: Request, res: Response) => {
  let userId: string | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtUserPayload;
      userId = payload.userId;
    } catch {}
  }

  // Also check query param ?token=
  if (!userId && req.query.token) {
    try {
      const payload = jwt.verify(String(req.query.token), config.JWT_ACCESS_SECRET) as JwtUserPayload;
      userId = payload.userId;
    } catch {}
  }

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized SSE connection' });
    return;
  }

  sseHub.registerClient(userId, res);
});

// All other notification routes require standard authentication
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await dbStore.notifications.findByUserId(req.user!.userId);
    res.envelope(list);
  } catch (err) {
    next(err);
  }
});

router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await dbStore.notifications.countUnread(req.user!.userId);
    res.envelope({ unreadCount: count });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await dbStore.notifications.markAsRead(req.params.id, req.user!.userId);
    res.envelope({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await dbStore.notifications.markAllAsRead(req.user!.userId);
    res.envelope({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
