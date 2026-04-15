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
app.get('/', (req, res) => {
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
if (process.env.NODE_ENV === 'production' && fs.existsSync(FRONTEND_DIR)) {
  // Serve Next.js static assets
  app.use('/_next', express.static(path.join(FRONTEND_DIR, '.next/static')));
  app.use(express.static(path.join(FRONTEND_DIR, 'public')));

  // All non-API routes → Next.js handler
  const nextHandler = require(path.join(FRONTEND_DIR, 'server.js'));
  console.log('   📦 Serving frontend from standalone build');
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
