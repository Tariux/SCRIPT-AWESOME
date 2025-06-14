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
      timeout: 10000 
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
  let results = [];


  setInterval(() => {
    fs.writeFileSync(`scan_results-${Date.now()}.json`, JSON.stringify(results, null, 2));
    console.log('Scan results saved to scan_results.json');
    results = [];
  }, 10000);


  for (const entry of data) {
    for (const port of entry.ports) {
      const result = await scanHost(entry.host, port);
      if (result.status ||
        result.status === 200 ||
        result.status === 201 ||
        result.status === 302
      ) {
        results.push(result);
        console.log(`+ Scanned ${entry.host}:${port}`);
      } else {
        console.log(`- Scan Failed ${entry.host}:${port}`);
      }
    }
  }

}

runScanner();
