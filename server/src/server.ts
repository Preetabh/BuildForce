import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { SorService } from './modules/sor/sor.service';
import { Company } from './models/Company';
import { RateAnalysisService } from './modules/sor/rateAnalysis.service';

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDatabase();

    // 2. Recover or clean up any orphaned imports from previous server runs
    await SorService.cleanupOrResumeOrphanedImports();

    // 3. Ensure all companies have baseline CPWD DAR rate analyses in database
    try {
      const companies = await Company.find({}, '_id').lean();
      for (const c of companies) {
        await RateAnalysisService.seedDefaultCpwdDarAnalyses(c._id.toString());
      }
    } catch (err) {
      logger.warn('Non-fatal warning: Failed to check DAR rate analyses:', err);
    }

    // 3. Initialize Express app
    const app = createApp();

    // 4. Listen on PORT
    const server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🏗️BudgetPilot Construction ERP Backend Running`);
      logger.info(`📡 Port: http://localhost:${env.PORT}`);
      logger.info(`🔗 API Endpoint: http://localhost:${env.PORT}/api`);
      logger.info(`💾 Database: ${env.MONGODB_URI}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`=======================================================`);
    });

    // Graceful shutdown
    const handleShutdown = (signal: string) => {
      logger.info(`${signal} received: closing HTTP server...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal server bootstrap failure:', error);
    process.exit(1);
  }
};

startServer();
