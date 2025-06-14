const http = require('http');
const https = require('https');
const fs = require('fs');

const data = require('./scan/scan.json');

function scanHost(host, port) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 5000 // Set a timeout for the request
    };

    const protocol = port === 443 ? https : http;

    const req = protocol.request(options, (res) => {
      let data = '';

      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // On end of response
      res.on('end', () => {
        resolve({
          host,
          port,
          status: res.statusCode,
          headers: res.headers,
          cookies: res.headers['set-cookie'] || [],
          data: data
        });
      });
    });

    // Handle request errors
    req.on('error', (error) => {
      resolve({
        host,
        port,
        error: error.message
      });
    });

    // End the request
    req.end();
  });
}

async function runScanner() {
  const results = [];

  for (const entry of data) {
    for (const port of entry.ports) {
      const result = await scanHost(entry.host, port);
      results.push(result);
      console.log(`Scanned ${entry.host}:${port} - Result:`, result);
    }
  }

  // Save results to a file
  fs.writeFileSync('scan_results.json', JSON.stringify(results, null, 2));
  console.log('Scan results saved to scan_results.json');
}

runScanner();
