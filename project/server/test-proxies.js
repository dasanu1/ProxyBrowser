import http from 'http';
import https from 'https';
import { URL } from 'url';

// Function to test proxy speed
async function testProxySpeed(proxyUrl) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout
    
    try {
      const proxy = new URL(proxyUrl);
      const options = {
        hostname: proxy.hostname,
        port: proxy.port,
        path: 'http://www.google.com',
        method: 'GET',
        timeout: timeout
      };
      
      const req = http.get(options, (res) => {
        const responseTime = Date.now() - startTime;
        res.destroy(); // Don't need to read the response body
        resolve({ proxyUrl, responseTime, status: res.statusCode });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ proxyUrl, responseTime: timeout, status: 'TIMEOUT' });
      });
      
      req.on('error', (error) => {
        req.destroy();
        resolve({ proxyUrl, responseTime: timeout, status: 'ERROR', error: error.message });
      });
    } catch (error) {
      resolve({ proxyUrl, responseTime: timeout, status: 'INVALID_URL', error: error.message });
    }
  });
}

// Test a few proxies
const proxiesToTest = [
  'http://188.114.96.85:80',
  'http://104.24.190.146:80',
  'http://104.17.213.249:80',
  'http://104.17.149.144:80',
  'http://104.27.88.150:80'
];

async function testAllProxies() {
  console.log('Testing proxy speeds...');
  
  const results = [];
  for (const proxy of proxiesToTest) {
    try {
      const result = await testProxySpeed(proxy);
      results.push(result);
      console.log(`Proxy: ${proxy}, Response Time: ${result.responseTime}ms, Status: ${result.status}`);
    } catch (error) {
      console.log(`Proxy: ${proxy}, Error: ${error.message}`);
    }
  }
  
  // Sort by response time
  results.sort((a, b) => a.responseTime - b.responseTime);
  
  console.log('\nFastest proxies:');
  results.forEach(result => {
    console.log(`${result.proxyUrl} - ${result.responseTime}ms`);
  });
}

testAllProxies();