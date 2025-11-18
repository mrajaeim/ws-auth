const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files from the current folder (.)
app.use(express.static(path.join(__dirname)));

// Fallback: serve index.html for root
app.get('/', (req, res) => {
    res.type('html');
    res.set('Content-Type', 'text/html')
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Client server running at: http://localhost:${PORT}`);
});
