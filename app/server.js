require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // Restrict to your frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ─── Health Check (no auth) ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/superadmin',   require('./routes/superadmin'));
app.use('/api/members',      require('./routes/members'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/doctors',      require('./routes/doctorSchedule'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api',              require('./routes/inventory'));   // /api/medicines, /api/inventory, /api/suppliers
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api',              require('./routes/clinical'));    // /api/visits, /api/prescriptions, /api/billing, /api/emergency
app.use('/api/portfolio',    require('./routes/portfolio'));


// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});


// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dispensary API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
