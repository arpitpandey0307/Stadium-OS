require('dotenv').config();
const express = require('express');
const cors = require('cors');
const store = require('./src/simulation/store');
const simulation = require('./src/simulation/engine');
const agents = require('./src/agents');
const coordinator = require('./src/coordinator');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'StadiumOS backend running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const state = store.getState();
  res.json(state);
});

app.get('/api/zones', (req, res) => {
  const zones = store.getZones();
  res.json(zones);
});

app.get('/api/system', (req, res) => {
  const info = store.getSystemInfo();
  res.json(info);
});

// Agent reports
app.get('/api/agents', (req, res) => {
  const zones = store.getZones();
  const systemInfo = store.getSystemInfo();
  const reports = agents.runAll(zones, systemInfo);
  res.json(reports);
});

// Coordinator — combined agent analysis + decisions
app.get('/api/decisions', (req, res) => {
  const result = coordinator.coordinate();
  res.json(result);
});

// Simulation controls
app.post('/api/simulation/start', (req, res) => {
  simulation.start();
  res.json({ message: 'Simulation started' });
});

app.post('/api/simulation/stop', (req, res) => {
  simulation.stop();
  res.json({ message: 'Simulation stopped' });
});

app.post('/api/simulation/reset', (req, res) => {
  simulation.reset();
  res.json({ message: 'Simulation reset' });
});

// ──────────────────────────────────────────────
// Production: serve Next.js frontend
// ──────────────────────────────────────────────
const path = require('path');
const fs = require('fs');

const FRONTEND_DIR = path.join(__dirname, 'frontend-standalone');
const NEXT_SERVER = path.join(FRONTEND_DIR, 'server.js');

if (process.env.NODE_ENV === 'production' && fs.existsSync(NEXT_SERVER)) {
  // Start Next.js standalone server on a different port
  const { spawn } = require('child_process');
  const NEXT_PORT = 3000;

  const nextProcess = spawn('node', [NEXT_SERVER], {
    env: { ...process.env, PORT: String(NEXT_PORT), HOSTNAME: '0.0.0.0' },
    stdio: 'inherit',
  });

  nextProcess.on('error', (err) => {
    console.error('   ❌ Failed to start Next.js:', err.message);
  });

  // Proxy all non-API routes to Next.js
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    const http = require('http');
    const proxyReq = http.request(
      { hostname: '127.0.0.1', port: NEXT_PORT, path: req.url, method: req.method, headers: req.headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', () => {
      res.status(502).json({ error: 'Frontend not ready yet' });
    });
    req.pipe(proxyReq);
  });

  console.log('   📦 Next.js frontend will start on internal port', NEXT_PORT);
}

// ──────────────────────────────────────────────
// Boot
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏟️  StadiumOS Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

  // Attempt Firestore connection
  store.initFirestore();

  // Auto-start simulation
  simulation.start();
});

module.exports = app;
