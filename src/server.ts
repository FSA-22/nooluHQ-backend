import { PORT, NODE_ENV } from './config/env';
import app from './app';
// import { connectToDB, disConnectFromDB } from './databases/index.js';
import { Server } from 'http';
import process from 'process';

// 1. CATCH SYNC ERRORS
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// 2. START THE SERVER
const server: Server = app.listen(PORT, async () => {
  // await connectToDB();
  console.log(`Server running on port ${PORT} | Env: ${NODE_ENV}`);
});

// 3. CATCH ASYNC ERRORS
process.on('unhandledRejection', (err: unknown) => {
  console.error('UNHANDLED REJECTION! Shutting down...');

  if (err instanceof Error) {
    console.error(err.name, err.message);
  } else {
    console.error(err);
  }

  server.close(() => {
    process.exit(1);
  });
});

/*
   Graceful Shutdown
*/
const shutdown = (signal: NodeJS.Signals) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed.');
    // await disConnectFromDB();
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forcefully shutting down...');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGINT', (signal: NodeJS.Signals) => shutdown(signal));
process.on('SIGTERM', (signal: NodeJS.Signals) => shutdown(signal));
