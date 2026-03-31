import mongoose from 'mongoose';
import { DATABASE_URI } from './env.js';

export const connectDB = async () => {
  if (!DATABASE_URI) {
    throw new Error('MongoDB URI is not defined in the configuration');
  }

  try {
    const conn = await mongoose.connect(DATABASE_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error1:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (!DATABASE_URI) {
    throw new Error('MongoDB URI is not defined in the configuration');
  }

  try {
    await mongoose.disconnect();

    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Database disconnection error2:', error);
    process.exit(1);
  }
};
