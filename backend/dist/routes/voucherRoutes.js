"use strict";
// backend/routes/voucherRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voucherController_1 = require("../controllers/voucherController");
const router = (0, express_1.Router)();
// POST /api/vouchers - Create new voucher
router.post('/', voucherController_1.createVoucher);
// GET /api/vouchers - Get all vouchers (with optional filters)
router.get('/', voucherController_1.getVouchers);
// GET /api/vouchers/:id - Get single voucher
router.get('/:id', voucherController_1.getVoucher);
// DELETE /api/vouchers/:id - Delete voucher
router.delete('/:id', voucherController_1.deleteVoucher);
// PUT /api/vouchers/:id - Update voucher
router.put('/:id', voucherController_1.updateVoucher);
exports.default = router;
