// backend/routes/reportRoutes.ts

import { Router } from 'express';
import {
  getTrialBalance,
  getProfitAndLoss,
  getGSTReport,
  getOutstandingReport,
  getLedger,
} from '../controllers/reportController';

const router = Router();

// GET /api/reports/trial-balance
router.get('/trial-balance', getTrialBalance);

// GET /api/reports/pl
router.get('/pl', getProfitAndLoss);

// GET /api/reports/gst
router.get('/gst', getGSTReport);

// GET /api/reports/outstanding
router.get('/outstanding', getOutstandingReport);

// GET /api/reports/ledger/:accountId
router.get('/ledger/:accountId', getLedger);

export default router;