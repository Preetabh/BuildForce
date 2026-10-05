import mongoose from 'mongoose';
import { env } from '../config/env';
import { Vendor } from '../models/Vendor';
import { Worker } from '../models/Worker';
import { logger } from '../config/logger';

const cleanVendors = async () => {
  try {
    logger.info(`Connecting to MongoDB...`);
    await mongoose.connect(env.MONGODB_URI);

    const vendorRes = await Vendor.deleteMany({});
    logger.info(`Cleared ${vendorRes.deletedCount} vendors.`);

    const workerRes = await Worker.deleteMany({});
    logger.info(`Cleared ${workerRes.deletedCount} workers.`);

    logger.info('Clean slate completed. No hardcoded vendors or workers in DB!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to clean vendors/workers:', error);
    process.exit(1);
  }
};

cleanVendors();
