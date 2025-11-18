// auth_service.js (Main Service - Port 3000)
// Responsibilities: User login, token issuance, HttpOnly cookie setting, and token validation.

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_super_secret_key'; // Shared secret for token signing/validation

app.use(express.json());
app.use(cookieParser());

// --- CORS Configuration ---
// Crucial for allowing the WS microservice to call this service (CORS is primarily for API calls, not WS handshake)
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'], // Allow both services
    credentials: true, // Allow cookies/authorization headers
};
app.use(cors(corsOptions));

// Simple in-memory user store for demonstration
const users = {
    'user1': 'password123',
    'admin': 'securepass',
};

// --- Routes ---

// 1. Landing Page (The client will use client.html instead, but keeping this for completeness)
app.get('/', (req, res) => {
    res.send('Main Auth Service is running.');
});

// 2. Login Endpoint: Issues JWT and sets HttpOnly cookie
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (users[username] === password) {
        // Create JWT token containing user info
        const token = jwt.sign({ username: username, userId: 'u_' + username }, JWT_SECRET, { expiresIn: '1h' });

        // Set the HttpOnly cookie
        // The key is to set a domain that both services can access. 
        // For localhost, the browser sends cookies across different ports on the same host.
        res.cookie('auth_token', token, {
            httpOnly: true, // Crucial: prevents client-side JS access
            secure: false,  // Set to true in production over HTTPS
            maxAge: 3600000, // 1 hour
            sameSite: 'Lax', // Generally required for cross-site/subdomain operations
            path: '/',
            // In a real environment with subdomains (e.g., api.example.com, ws.example.com), 
            // you would set: domain: '.example.com'
        });

        console.log(`[AUTH] User ${username} logged in. Token set in HttpOnly cookie.`);
        return res.json({ message: 'Login successful. Cookie set.' });
    }

    res.status(401).json({ message: 'Invalid credentials.' });
});

// 3. Token Validation Endpoint (Called by the WS Microservice)
app.post('/validate-token', (req, res) => {
    const token = req.body.token;

    if (!token) {
        return res.status(401).json({ isAuthenticated: false, reason: 'No token provided' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        console.log(`[AUTH] Token validated for user: ${payload.username}`);
        return res.json({ isAuthenticated: true, user: payload });
    } catch (error) {
        console.log(`[AUTH] Token validation failed: ${error.message}`);
        return res.status(401).json({ isAuthenticated: false, reason: 'Invalid or expired token' });
    }
});

app.listen(PORT, () => {
    console.log(`\n--- Auth Service Running on http://localhost:${PORT} ---`);
});