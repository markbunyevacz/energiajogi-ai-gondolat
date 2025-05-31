import { CrawlerManager } from '@/lib/crawler/crawler-manager';

async function main() {
  console.log('Starting legal source crawler...');
  
  const manager = CrawlerManager.getInstance();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down crawler...');
    manager.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down crawler...');
    manager.stop();
    process.exit(0);
  });

  try {
    await manager.start();
  } catch (error) {
    console.error('Fatal error in crawler:', error);
    process.exit(1);
  }
}

main(); 