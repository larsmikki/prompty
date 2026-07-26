import { initDb } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';
import { config } from './config.js';

async function main() {
  await initDb();
  runMigrations();
  console.log('Database initialized');

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Prompty server running on http://localhost:${config.port}`);
  });

  // Graceful shutdown: stop accepting new connections, finish in-flight
  // requests, then exit. Docker/Kubernetes give us 10s before SIGKILL.
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
      process.exit(0);
    });
    // Hard exit if close() hangs (e.g. long-lived connection). Stay under
    // the 10s SIGKILL deadline.
    setTimeout(() => {
      console.error('Forcing exit after timeout');
      process.exit(1);
    }, 8000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
