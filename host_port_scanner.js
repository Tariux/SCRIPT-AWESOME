const http = require('http');
const https = require('https');
const fs = require('fs');

// Get command-line arguments
const args = process.argv.slice(2);
const inputFile = args[0] || './scan/scan.json'; // Default input file
const outputFile = args[1] || `scan_results-${Date.now()}.json`; // Default output file

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

    // Set interval to save results every 10 seconds
    setInterval(async () => {
        try {
            let fileData = [];
            // Check if the output file exists before reading
            if (fs.existsSync(outputFile)) {
                const existingData = fs.readFileSync(outputFile, 'utf8');
                try {
                    fileData = JSON.parse(existingData);
                } catch (error) {
                    console.error(`Error parsing existing data: ${error.message}`);
                }
            }

            const finalData = [
                ...results,
                ...fileData
            ];

            // Write results to the output file safely
            fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
            console.log(`Scan results saved to ${outputFile}`);
            results = []; // Clear results after saving
        } catch (error) {
            console.error(`Error saving results: ${error.message}`);
        }
    }, 10000);

    // Read input data
    try {
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

        for (const entry of data) {
            for (const port of entry.ports) {
                const result = await scanHost(entry.host, port);
                if (result.status &&
                    result.status !== 404 &&
                    result.status !== 400 &&
                    result.status !== 401
                ) {
                    results.push(result);
                    console.log(`+ Scanned ${entry.host}:${port}`);
                } else {
                    console.log(`- Scan Failed ${entry.host}:${port}`);
                }
            }
        }
    } catch (error) {
        console.error(`Error reading input file: ${error.message}`);
    }
}

// Start the scanner
runScanner();
