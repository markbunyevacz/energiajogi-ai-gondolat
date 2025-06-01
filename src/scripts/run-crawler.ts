import { MagyarKozlonyCrawler } from './crawler/MagyarKozlonyCrawler.js';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  baseUrl: 'https://njt.hu',
  rateLimit: {
    requestsPerMinute: 30,
    concurrentRequests: 5
  },
  proxyConfig: {
    enabled: process.env.USE_PROXY === 'true',
    proxyList: process.env.PROXY_LIST?.split(',') || [],
    rotationInterval: 5 * 60 * 1000 // 5 minutes
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 5000 // 5 seconds
  }
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }

  const crawler = new MagyarKozlonyCrawler(
    config,
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  
  try {
    console.log('Initializing crawler...');
    await crawler.initialize();
    
    console.log('Starting crawl...');
    await crawler.crawl();
    
    console.log('Crawl completed successfully');
  } catch (error: any) {
    console.error('Crawl failed:', error?.message || 'Unknown error');
    process.exit(1);
  } finally {
    await crawler.cleanup();
  }
}

main().catch(console.error); 