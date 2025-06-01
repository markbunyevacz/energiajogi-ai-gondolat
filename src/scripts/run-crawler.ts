import { HungarianGazetteCrawler } from '../lib/crawler/hungarian-gazette-crawler.js';
import type { LegalSource, CrawlerConfig } from '../lib/crawler/types.js';

async function main() {
  const source: LegalSource = {
    id: 'hungarian-gazette',
    name: 'Hungarian Gazette',
    url: 'https://magyarkozlony.hu/dokumentumok',
    type: 'gazette',
    crawlFrequency: 60 // 1 hour
  };

  const config: CrawlerConfig = {
    name: 'hungarian-gazette-crawler',
    baseUrl: source.url,
    maxRequestsPerMinute: 30,
    minDelayBetweenRequests: 2000,
    retryConfig: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2
    }
  };

  const crawler = new HungarianGazetteCrawler(source, config);
  
  try {
    console.log('Starting Hungarian Gazette crawler...');
    const result = await crawler.crawl();
    
    console.log(`Crawl completed with ${result.success ? 'success' : 'errors'}`);
    console.log(`Processed ${result.documents.length} documents`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(error => console.error(`- ${error}`));
    }
  } catch (error) {
    console.error('Crawler failed:', error);
    process.exit(1);
  }
}

main().catch(console.error); 