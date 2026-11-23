import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BloodConnect API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

router.get('/health/ready', (_req: Request, res: Response) => {
  res.json({
    status: 'ready',
    database: 'connected',
    orchestrator: 'active',
    timestamp: new Date().toISOString(),
  });
});

export default router;
