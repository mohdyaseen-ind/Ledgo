"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const voucherRoutes_1 = __importDefault(require("./routes/voucherRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const authMiddleware_1 = require("./lib/authMiddleware");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3001",
        "https://ledgo-erp.vercel.app",
        "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(express_1.default.json());
// Public routes
app.use('/api/auth', authRoutes_1.default);
// Protected routes
app.use('/api/vouchers', authMiddleware_1.authenticateJWT, voucherRoutes_1.default);
app.use('/api/accounts', authMiddleware_1.authenticateJWT, accountRoutes_1.default);
app.use('/api/reports', authMiddleware_1.authenticateJWT, reportRoutes_1.default);
app.use('/users', (req, res) => {
    res.status(200).send("Hello World");
});
app.get('/', (req, res) => {
    res.json({ message: 'ERP Backend API is running' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
