const axios = require('axios');
const fs = require('fs');

const data = []

async function scanHost(host, port) {
  const url = `http://${host}:${port}`;
  try {
    const response = await axios.get(url);
    return {
      host,
      port,
      status: response.status,
      headers: response.headers,
      cookies: response.headers['set-cookie'] || [],
      data: response.data
    };
  } catch (error) {
    return {
      host,
      port,
      error: error.message
    };
  }
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
