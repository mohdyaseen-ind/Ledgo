import express from 'express';
import cors from 'cors';
import voucherRoutes from './routes/voucherRoutes';
import accountRoutes from './routes/accountRoutes';
import reportRoutes from './routes/reportRoutes';
import dotenv from 'dotenv'

dotenv.config()

const app = express();
const PORT =  process.env.PORT || 3001;

app.use(cors({
  origin: [
    "http://localhost:3001",
    "https://ledgo-erp.vercel.app", 
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(express.json());

app.use('/api/vouchers', voucherRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'ERP Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});