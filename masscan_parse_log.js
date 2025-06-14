const fs = require('fs');
const path = require('path');

// Function to parse a single log line
function parseLogLine(line) {
    const parts = line.split('\t');
    const timestamp = parts[0].split(': ')[1];
    const host = parts[1].split(': ')[1].split(' ')[0];
    const ports = parts[2].split(': ')[1].split('/').filter(Boolean).map(port => {
        const portNumber = parseInt(port, 10);
        return portNumber ? portNumber : null;
    });

    const filteredPorts = ports.filter(port => port !== null);

    return {
        host: host,
        ports: filteredPorts,
        meta: {
            timestamp: timestamp
        }
    };
}

// Function to read and parse log files
function parseLogFiles(filePaths) {
    const parsedData = [];
    filePaths.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== ''); // Split content into lines and filter out empty lines
        lines.forEach(line => {
            const parsedLine = parseLogLine(line);
            parsedData.push(parsedLine); 
        });
    });
    return parsedData;
}

// Main function to execute the script
function main() {
    const args = process.argv.slice(2);
    const logDirectory = args[0] || './scan'; // Default directory
    const outputFilePath = args[1] || `parsed_logs_${Date.now()}.json`; // Default output file
    const fileType = args[2] || 'txt'; // Default directory

    console.log('Reading logs from:', path.join(process.cwd(), logDirectory));
    
    // Read all .log files from the specified directory
    const logFiles = fs.readdirSync(path.join(process.cwd(), logDirectory)).filter(file => file.endsWith(`.${fileType}`));
    const filePaths = logFiles.map(file => path.join(process.cwd(), logDirectory, file));

    // Parse the log files
    const parsedData = parseLogFiles(filePaths);

    // Write the parsed data to a JSON file
    fs.writeFileSync(path.join(process.cwd(), outputFilePath), JSON.stringify(parsedData, null, 2), 'utf-8');
    console.log(`Parsed data written to ${path.join(process.cwd(), outputFilePath)}`);
}

// Run the main function
main();
