import { Server } from 'http';
import app from './app/app';
import config from './app/config';
import { connectRedis } from './app/config/redis.config';
import { seedSuperAdmin } from './app/config/seedSuperAdmin';

async function main() {
  const server: Server = app.listen(config.PORT, () => {
    console.log(`🚀 Server is running on port ${config.PORT}`);
    seedSuperAdmin();
    connectRedis();
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info('🛑 Server closed gracefully!');
      });
    }
    process.exit(1);
  };

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    exitHandler();
  });

  process.on('unhandledRejection', (error) => {
    console.error('⚠️ Unhandled Rejection:', error);
    exitHandler();
  });
}

main();
