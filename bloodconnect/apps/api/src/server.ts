import { createApp } from './app';
import { config } from './config/index';
import { logger } from './common/logger/pino';
import { OrchestratorService } from './modules/orchestrator/orchestrator.service';
import { dbStore } from './data/dbStore';
import { seedDatabase } from './data/seed';

async function bootstrap() {
  try {
    // 1. Initialize Orchestrator Scheduler
    OrchestratorService.initScheduler();
    logger.info('Emergency Response Orchestrator scheduler initialized');

    // 2. Check if DB needs initial seeding
    const usersCount = (await dbStore.users.findMany()).length;
    if (usersCount === 0) {
      logger.info('Database is empty. Executing initial system seed with sample organizations and donors...');
      await seedDatabase();
      logger.info('Initial system seed completed successfully.');
    }

    // 3. Start HTTP server
    const app = createApp();
    const server = app.listen(config.PORT, () => {
      logger.info(`BloodConnect API server running on port ${config.PORT} [${config.NODE_ENV}]`);
      logger.info(`API Base URL: ${config.API_URL}/api/v1`);
      logger.info(`Health check: ${config.API_URL}/health`);
    });

    const gracefulShutdown = () => {
      logger.info('Received shutdown signal. Closing HTTP server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (err: any) {
    logger.fatal({ err: err.message, stack: err.stack }, 'Failed to start BloodConnect API server');
    process.exit(1);
  }
}

bootstrap();
