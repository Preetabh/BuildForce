import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error occurred:', err);
});
