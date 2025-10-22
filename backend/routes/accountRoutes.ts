// backend/routes/accountRoutes.ts

import { Router } from 'express';
import {
  getAccounts,
  getAccount,
  createAccount,
} from '../controllers/accountController';

const router = Router();

// GET /api/accounts - Get all accounts
router.get('/', getAccounts);

// GET /api/accounts/:id - Get single account with ledger entries
router.get('/:id', getAccount);

// POST /api/accounts - Create new account
router.post('/', createAccount);

export default router;