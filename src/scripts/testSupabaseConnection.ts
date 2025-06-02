import { supabase } from '../integrations/supabase/client.js';
import * as dns from 'dns';
import * as https from 'https';
import * as fs from 'fs';

async function testConnection() {
  const logFile = 'supabase-test.log';
  const domains = [
    'abjuvmwpjapknuxqrefg.supabase.com',
    'abjuvmwpjapknuxqrefg.supabase.co'
  ];
  
  try {
    fs.writeFileSync(logFile, 'Testing Supabase connection...\n');
    
    for (const domain of domains) {
      fs.appendFileSync(logFile, `\nTesting domain: ${domain}\n`);
      
      // Test DNS resolution
      fs.appendFileSync(logFile, 'Testing DNS resolution...\n');
      try {
        const addresses = await dns.promises.resolve4(domain);
        fs.appendFileSync(logFile, `DNS resolution successful. IP addresses: ${addresses.join(', ')}\n`);
      } catch (error) {
        fs.appendFileSync(logFile, `DNS resolution failed: ${error}\n`);
      }

      // Test HTTPS connection
      fs.appendFileSync(logFile, 'Testing HTTPS connection...\n');
      try {
        await new Promise((resolve, reject) => {
          const req = https.get(`https://${domain}`, (res) => {
            fs.appendFileSync(logFile, `HTTPS connection successful. Status: ${res.statusCode}\n`);
            resolve(res);
          });
          req.on('error', (error) => {
            fs.appendFileSync(logFile, `HTTPS connection failed: ${error}\n`);
            reject(error);
          });
        });
      } catch (error) {
        fs.appendFileSync(logFile, `HTTPS test failed: ${error}\n`);
      }
    }

    // Test Supabase client
    fs.appendFileSync(logFile, '\nTesting Supabase client...\n');
    try {
      const { data, error } = await supabase.from('legal_documents').select('count');
      
      if (error) {
        fs.appendFileSync(logFile, `Supabase error: ${JSON.stringify(error, null, 2)}\n`);
        return;
      }

      fs.appendFileSync(logFile, `Supabase test successful. Response: ${JSON.stringify(data, null, 2)}\n`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? `${error.name}: ${error.message}\n${error.stack}`
        : `Unknown error: ${error}`;
      
      fs.appendFileSync(logFile, `Supabase client error: ${errorMessage}\n`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}\n${error.stack}`
      : `Unknown error: ${error}`;
    
    fs.appendFileSync(logFile, `Fatal error: ${errorMessage}\n`);
  }
}

testConnection(); 