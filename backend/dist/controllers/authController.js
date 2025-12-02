"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMe = exports.getMe = exports.logout = exports.refresh = exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// Helpers
const generateAccessToken = (userId) => jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
const generateRefreshTokenString = () => crypto_1.default.randomBytes(64).toString('hex');
// Helper to create default accounts
const createDefaultAccounts = async (userId) => {
    const defaults = [
        { name: 'Cash in Hand', type: 'ASSET', openingBalance: 0 },
        { name: 'Bank Account', type: 'ASSET', openingBalance: 0 },
        { name: 'Sales Account', type: 'INCOME' },
        { name: 'Purchase Account', type: 'EXPENSE' },
        { name: 'Output GST', type: 'LIABILITY' },
        { name: 'Input GST', type: 'ASSET' },
        { name: 'Capital Account', type: 'LIABILITY' },
        { name: 'General Expense', type: 'EXPENSE' },
        // Sample Customers
        { name: 'Reliance Industries Ltd', type: 'ASSET', isParty: true, gstNumber: '27AAACR5055K1Z5' },
        { name: 'Tata Consultancy Services', type: 'ASSET', isParty: true, gstNumber: '27AAACT2727Q1ZV' },
        { name: 'Infosys Limited', type: 'ASSET', isParty: true, gstNumber: '29AAACI1681G1ZA' },
        { name: 'Wipro Limited', type: 'ASSET', isParty: true, gstNumber: '29AAACW3775F000' },
        { name: 'HCL Technologies', type: 'ASSET', isParty: true, gstNumber: '06AAACH2702H1Z0' },
        // Sample Suppliers
        { name: 'ABC Suppliers', type: 'LIABILITY', isParty: true, gstNumber: '27AABCA1234B1Z1' },
        { name: 'XYZ Traders', type: 'LIABILITY', isParty: true, gstNumber: '27AABCX5678C1Z2' },
        { name: 'PQR Enterprises', type: 'LIABILITY', isParty: true, gstNumber: '29AABCP9012D1Z3' },
    ];
    await prisma.account.createMany({
        data: defaults.map(acc => ({
            ...acc,
            userId,
        })),
    });
};
// Signup
const signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already taken' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create user and default accounts in transaction
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: role || 'USER'
                }
            });
            // Create default accounts
            const defaults = [
                { name: 'Cash in Hand', type: 'ASSET', openingBalance: 0 },
                { name: 'Bank Account', type: 'ASSET', openingBalance: 0 },
                { name: 'Sales Account', type: 'INCOME' },
                { name: 'Purchase Account', type: 'EXPENSE' },
                { name: 'Output GST', type: 'LIABILITY' },
                { name: 'Input GST', type: 'ASSET' },
                { name: 'Capital Account', type: 'LIABILITY' },
                { name: 'General Expense', type: 'EXPENSE' },
            ];
            await tx.account.createMany({
                data: defaults.map(acc => ({
                    ...acc,
                    userId: user.id,
                })),
            });
            return user;
        });
        const accessToken = generateAccessToken(newUser.id);
        const refreshToken = generateRefreshTokenString();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: newUser.id, expiresAt },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(201).json({
            accessToken,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            message: 'Signup successful'
        });
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: 'Error creating account', error });
    }
};
exports.signup = signup;
// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt_1.default.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshTokenString();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Error logging in', error });
    }
};
exports.login = login;
// Refresh Access Token
const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.status(401).json({ message: 'Refresh token missing' });
    try {
        const tokenRecord = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date() || !tokenRecord.user) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }
        // Optional: Rotate refresh token
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
        const newRefreshToken = generateRefreshTokenString();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: newRefreshToken, userId: tokenRecord.user.id, expiresAt },
        });
        const accessToken = generateAccessToken(tokenRecord.user.id);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({ accessToken });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: 'Error refreshing token', error });
    }
};
exports.refresh = refresh;
// Logout
const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        catch (error) {
            console.error("Logout error (token deletion):", error);
        }
    }
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.json({ message: 'Logged out' });
};
exports.logout = logout;
// Get Current User
const getMe = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User ID not found in token' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                address: true,
                bio: true,
                avatarUrl: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ message: 'Error fetching user details', error });
    }
};
exports.getMe = getMe;
// Update Current User Profile
const updateMe = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User ID not found in token' });
        }
        const { name, phone, address, bio, avatarUrl } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                phone,
                address,
                bio,
                avatarUrl,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                address: true,
                bio: true,
                avatarUrl: true,
            },
        });
        res.json({ user: updatedUser, message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error("UpdateMe error:", error);
        res.status(500).json({ message: 'Error updating profile', error });
    }
};
exports.updateMe = updateMe;
