const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Ensure data.json exists
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { users: [], logs: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(fileContent);
    } catch (err) {
        return { users: [], logs: [] };
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper to parse request body
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                resolve({});
            }
        });
        req.on('error', (err) => {
            reject(err);
        });
    });
}

// Helper to send JSON responses
function sendJSON(res, status, data) {
    res.writeHead(status, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Static files mime types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function serveStaticFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // SPA fallback: if resource is not found, serve index.html
                fs.readFile(path.join(__dirname, 'index.html'), (err2, content2) => {
                    if (err2) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content2);
                    }
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// HTTP Server instance
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    console.log(`[REQUEST] ${req.method} ${pathname}`);

    // --- API ENDPOINTS ---

    // User Register
    if (pathname === '/api/register' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            const { name, email, password } = body;
            
            if (!name || !email || !password) {
                return sendJSON(res, 400, { message: 'Name, email, and password are required' });
            }
            
            const data = readData();
            const normalizedEmail = email.toLowerCase();
            const existing = data.users.find(u => u.email === normalizedEmail);
            
            if (existing) {
                return sendJSON(res, 400, { message: 'User already exists' });
            }
            
            const newUser = { name, email: normalizedEmail, password };
            data.users.push(newUser);
            writeData(data);
            
            return sendJSON(res, 200, { name, email: normalizedEmail });
        } catch (e) {
            return sendJSON(res, 500, { message: 'Server error during registration' });
        }
    }

    // User Login
    if (pathname === '/api/login' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            const { email, password } = body;
            
            if (!email || !password) {
                return sendJSON(res, 400, { message: 'Email and password are required' });
            }
            
            const data = readData();
            const normalizedEmail = email.toLowerCase();
            const user = data.users.find(u => u.email === normalizedEmail && u.password === password);
            
            if (!user) {
                return sendJSON(res, 400, { message: 'Invalid email or password' });
            }
            
            return sendJSON(res, 200, { name: user.name, email: normalizedEmail });
        } catch (e) {
            return sendJSON(res, 500, { message: 'Server error during login' });
        }
    }

    // Operations Logs - GET & POST
    if (pathname === '/api/history') {
        if (req.method === 'GET') {
            const email = query.email;
            const filter = query.filter;
            
            if (!email) {
                return sendJSON(res, 400, { message: 'Email is required' });
            }
            
            const data = readData();
            const normalizedEmail = email.toLowerCase();
            let userLogs = data.logs.filter(log => log.userEmail === normalizedEmail);
            
            if (filter && filter !== 'ALL') {
                userLogs = userLogs.filter(log => log.operationType === filter);
            }
            
            userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return sendJSON(res, 200, userLogs);
        }
        
        if (req.method === 'POST') {
            try {
                const log = await getRequestBody(req);
                if (!log.userEmail || !log.operationType) {
                    return sendJSON(res, 400, { message: 'User email and operation type are required' });
                }
                
                const data = readData();
                const newRecord = {
                    id: Date.now() + Math.random().toString(36).substr(2, 5),
                    userEmail: log.userEmail.toLowerCase(),
                    timestamp: new Date().toISOString(),
                    operationType: log.operationType,
                    firstQuantityValue: parseFloat(log.firstQuantityValue) || 0,
                    firstUnit: log.firstUnit,
                    secondQuantityValue: parseFloat(log.secondQuantityValue) || 0,
                    secondUnit: log.secondUnit || '',
                    resultQuantityValue: parseFloat(log.resultQuantityValue) || 0,
                    resultUnit: log.resultUnit
                };
                
                data.logs.push(newRecord);
                writeData(data);
                return sendJSON(res, 200, newRecord);
            } catch (e) {
                return sendJSON(res, 500, { message: 'Server error during log append' });
            }
        }

        if (req.method === 'DELETE') {
            const email = query.email;
            if (!email) {
                return sendJSON(res, 400, { message: 'Email is required' });
            }
            
            const data = readData();
            const normalizedEmail = email.toLowerCase();
            data.logs = data.logs.filter(log => log.userEmail !== normalizedEmail);
            writeData(data);
            return sendJSON(res, 200, { message: 'History cleared successfully' });
        }
    }

    // User Statistics - GET
    if (pathname === '/api/stats' && req.method === 'GET') {
        const email = query.email;
        if (!email) {
            return sendJSON(res, 400, { message: 'Email is required' });
        }
        
        const data = readData();
        const normalizedEmail = email.toLowerCase();
        const userLogs = data.logs.filter(log => log.userEmail === normalizedEmail);
        
        const converts = userLogs.filter(log => log.operationType === 'CONVERSION').length;
        const calculations = userLogs.filter(log => log.operationType !== 'CONVERSION').length;
        
        return sendJSON(res, 200, { converts, calculations });
    }

    // Import Logs - POST
    if (pathname === '/api/history/import' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            const { email, logs } = body;
            
            if (!email || !Array.isArray(logs)) {
                return sendJSON(res, 400, { message: 'Email and logs array are required' });
            }
            
            const data = readData();
            const normalizedEmail = email.toLowerCase();
            
            // Clear old logs for this user
            data.logs = data.logs.filter(log => log.userEmail !== normalizedEmail);
            
            // Sanitize and append new ones
            const sanitizedLogs = logs.map(log => {
                return {
                    id: log.id || Date.now() + Math.random().toString(36).substr(2, 5),
                    userEmail: normalizedEmail,
                    timestamp: log.timestamp || new Date().toISOString(),
                    operationType: log.operationType || 'CONVERSION',
                    firstQuantityValue: parseFloat(log.firstQuantityValue) || 0,
                    firstUnit: log.firstUnit || 'CENTIMETER',
                    secondQuantityValue: parseFloat(log.secondQuantityValue) || 0,
                    secondUnit: log.secondUnit || '',
                    resultQuantityValue: parseFloat(log.resultQuantityValue) || 0,
                    resultUnit: log.resultUnit || 'CENTIMETER'
                };
            });
            
            data.logs.push(...sanitizedLogs);
            writeData(data);
            return sendJSON(res, 200, { message: 'Logs imported successfully' });
        } catch (e) {
            return sendJSON(res, 500, { message: 'Server error during log import' });
        }
    }

    // --- STATIC FILES SERVING ---
    let targetPath = path.join(__dirname, pathname);
    if (pathname === '/') {
        targetPath = path.join(__dirname, 'index.html');
    }
    
    // Prevent directory traversal attacks
    if (!targetPath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    serveStaticFile(res, targetPath);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
