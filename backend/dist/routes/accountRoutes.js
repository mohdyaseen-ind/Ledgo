"use strict";
// backend/routes/accountRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountController_1 = require("../controllers/accountController");
const router = (0, express_1.Router)();
// GET /api/accounts - Get all accounts
router.get('/', accountController_1.getAccounts);
// GET /api/accounts/:id - Get single account with ledger entries
router.get('/:id', accountController_1.getAccount);
// POST /api/accounts - Create new account
router.post('/', accountController_1.createAccount);
exports.default = router;
