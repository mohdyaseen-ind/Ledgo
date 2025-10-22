// backend/routes/voucherRoutes.ts

import { Router } from 'express';
import {
  createVoucher,
  getVouchers,
  getVoucher,
  deleteVoucher,
} from '../controllers/voucherController';

const router = Router();

// POST /api/vouchers - Create new voucher
router.post('/', createVoucher);

// GET /api/vouchers - Get all vouchers (with optional filters)
router.get('/', getVouchers);

// GET /api/vouchers/:id - Get single voucher
router.get('/:id', getVoucher);

// DELETE /api/vouchers/:id - Delete voucher
router.delete('/:id', deleteVoucher);

export default router;