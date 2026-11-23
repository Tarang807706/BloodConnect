import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from './common/middleware/requestId.middleware';
import { responseEnvelopeMiddleware } from './common/middleware/responseEnvelope';
import { globalRateLimiter } from './common/middleware/rateLimiter.middleware';
import { errorHandler } from './common/errors/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import organizationsRoutes from './modules/organizations/organizations.routes';
import donorsRoutes from './modules/donors/donors.routes';
import requestsRoutes from './modules/requests/requests.routes';
import casesRoutes from './modules/cases/cases.routes';
import ngoRoutes from './modules/ngo/ngo.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';
import healthRoutes from './modules/health/health.routes';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // allow SSE and modern dev
  }));

  // CORS
  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  // JSON Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Middleware stack
  app.use(requestIdMiddleware);
  app.use(responseEnvelopeMiddleware);
  app.use(globalRateLimiter);

  // Health checks
  app.use('/', healthRoutes);
  app.use('/api/v1', healthRoutes);

  // API v1 Versioned Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/organizations', organizationsRoutes);
  app.use('/api/v1/donors', donorsRoutes);
  app.use('/api/v1/requests', requestsRoutes);
  app.use('/api/v1/cases', casesRoutes);
  app.use('/api/v1/ngo', ngoRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
