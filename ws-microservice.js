// ws_microservice.js (Microservice - Port 3001)
// Responsibilities: WebSocket server, reading HttpOnly cookie during handshake, and external auth check.

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const PORT = 3001;
const AUTH_SERVICE_URL = 'http://localhost:3000';

app.use(cookieParser());
app.use(express.static('public')); // In a real app, this might just be API endpoints

// --- Authentication Logic during WebSocket Handshake ---
server.on('upgrade', async (request, socket, head) => {
    const cookies = request.headers.cookie;
    console.log('\n[WS] HTTP Upgrade Request received.');
    console.log(`[WS] Cookie Header received: ${cookies ? 'YES' : 'NO'}`);

    // 1. Extract the cookie value
    let authToken = null;
    if (cookies) {
        // Simple cookie parsing (using built-in utility or manual split for robustness)
        const parsedCookies = cookieParser.signedCookie(cookies, ''); // Simple parsing for unsigned
        const cookiePairs = cookies.split(';').map(s => s.trim());
        const authCookie = cookiePairs.find(pair => pair.startsWith('auth_token='));
        if (authCookie) {
            authToken = authCookie.substring('auth_token='.length);
        }
    }

    if (!authToken) {
        console.log('[WS] Authentication Denied: auth_token cookie missing.');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }
    
    // 2. Call Auth Service to validate the token
    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/validate-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: authToken })
        });

        if (response.status !== 200) {
            console.log('[WS] Authentication Denied: Token validation failed on Auth Service.');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        const authData = await response.json();
        
        // 3. If validation succeeds, attach user data to the request object
        // This is crucial for user-specific data access in the WS connection
        request.user = authData.user;
        console.log(`[WS] Authentication Success for User: ${request.user.username}`);

        // 4. Complete the WebSocket handshake
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });

    } catch (error) {
        console.error('[WS] Error calling Auth Service:', error.message);
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
    }
});


// --- WebSocket Connection Handling ---
wss.on('connection', (ws, request) => {
    const user = request.user;
    console.log(`[WS] New WebSocket connection established for user: ${user.username} (${user.userId})`);

    // Logics for user-specific data accessing can be implemented here
    ws.send(JSON.stringify({ 
        type: 'AUTH_SUCCESS', 
        message: `Welcome, ${user.username}. You are authenticated via HttpOnly cookie.`,
        userId: user.userId
    }));

    ws.on('message', (message) => {
        const msg = JSON.parse(message.toString());
        if (msg.type === 'DATA_REQUEST') {
            // Simulate user-specific data access logic
            const responseData = `Private data stream for ${user.username} (${user.userId}): ${new Date().toLocaleTimeString()}`;
            ws.send(JSON.stringify({ type: 'DATA_RESPONSE', data: responseData }));
            console.log(`[WS] Sent data response to ${user.username}.`);
        } else {
            ws.send(JSON.stringify({ type: 'ECHO', message: `Echo from server: ${msg.content}` }));
        }
    });

    ws.on('close', () => {
        console.log(`[WS] Connection closed for user: ${user.username}`);
    });
});


// Fallback for non-upgrade requests
app.get('/', (req, res) => {
    res.send('WS Microservice is running.');
});

server.listen(PORT, () => {
    console.log(`--- WS Microservice Running on http://localhost:${PORT} ---`);
    console.log('Client must load client.html to use this service.');
});