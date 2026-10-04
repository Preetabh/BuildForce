import mongoose from 'mongoose';
import { env } from '../config/env';
import { SiteEngineer } from '../models/SiteEngineer';
import { User } from '../models/User';
import { logger } from '../config/logger';

const cleanDummyData = async () => {
  try {
    logger.info(`Connecting to MongoDB...`);
    await mongoose.connect(env.MONGODB_URI);

    // Remove all dummy pre-seeded site engineers
    const engResult = await SiteEngineer.deleteMany({});
    logger.info(`Deleted ${engResult.deletedCount} site engineers (clean slate).`);

    // Remove pre-seeded dummy users, but preserve genuine admin user
    const dummyEmails = [
      'tria@lucknowbuilders.com',
      'satyapal@lucknowbuilders.com',
      'sachin@lucknowbuilders.com',
      'dharmendra@lucknowbuilders.com',
      'tridev@lucknowbuilders.com',
      'suraj@gmail.com',
      'ankit@lucknowbuilders.com',
      'aman@lucknowbuilders.com',
      'anjali@lucknowbuilders.com',
    ];

    const userResult = await User.deleteMany({
      $or: [
        { email: { $in: dummyEmails } },
        { role: 'SITE_ENGINEER' },
      ],
    });
    logger.info(`Deleted ${userResult.deletedCount} dummy site engineer/team user accounts.`);

    logger.info('Database cleaned successfully! No pre-seeded hardcoded data remains.');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to clean dummy data:', error);
    process.exit(1);
  }
};

cleanDummyData();
