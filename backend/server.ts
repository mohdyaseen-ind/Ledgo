import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import voucherRoutes from './routes/voucherRoutes';
import accountRoutes from './routes/accountRoutes';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import { authenticateJWT } from './lib/authMiddleware';
import cookieParser from 'cookie-parser';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:3001",
    "https://ledgo-pi.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/vouchers', authenticateJWT, voucherRoutes);
app.use('/api/accounts', authenticateJWT, accountRoutes);
app.use('/api/reports', authenticateJWT, reportRoutes);
app.use('/users', (req, res) => {
  res.status(200).send("Hello World");
})

app.get('/', (req, res) => {
  res.json({ message: 'ERP Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
