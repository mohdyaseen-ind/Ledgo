"use strict";
// backend/routes/reportRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const router = (0, express_1.Router)();
// GET /api/reports/trial-balance
router.get('/trial-balance', reportController_1.getTrialBalance);
// GET /api/reports/pl
router.get('/pl', reportController_1.getProfitAndLoss);
// GET /api/reports/gst
router.get('/gst', reportController_1.getGSTReport);
// GET /api/reports/outstanding
router.get('/outstanding', reportController_1.getOutstandingReport);
// GET /api/reports/ledger/:accountId
router.get('/ledger/:accountId', reportController_1.getLedger);
exports.default = router;
