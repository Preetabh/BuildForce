import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civil_guruji_erp',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_civil_guruji_enterprise_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MAX_SOR_FILE_SIZE_MB: parseInt(process.env.MAX_SOR_FILE_SIZE_MB || '250', 10),
  PDF_BATCH_SIZE: parseInt(process.env.PDF_BATCH_SIZE || '25', 10),
  SOR_UPLOAD_DIR: process.env.SOR_UPLOAD_DIR || 'uploads/sor',
};
