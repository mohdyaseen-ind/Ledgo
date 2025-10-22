// backend/server.ts

import express from 'express';
import cors from 'cors';
import voucherRoutes from './routes/voucherRoutes';
import accountRoutes from './routes/accountRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vouchers', voucherRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ERP Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});