import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helpers
const generateAccessToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

const generateRefreshTokenString = () => crypto.randomBytes(64).toString('hex');

// Helper to create default accounts
const createDefaultAccounts = async (userId: string) => {
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
export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already taken' });
    }
    const passwordHash = await bcrypt.hash(password, 10);

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
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Error creating account', error });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Refresh Access Token
export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token missing' });

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
    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: 'Error refreshing token', error });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    } catch (error) {
      console.error("Logout error (token deletion):", error);
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out' });
};

// Get Current User
export const getMe = async (req: any, res: Response) => {
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
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: 'Error fetching user details', error });
  }
};

// Update Current User Profile
export const updateMe = async (req: any, res: Response) => {
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
  } catch (error) {
    console.error("UpdateMe error:", error);
    res.status(500).json({ message: 'Error updating profile', error });
  }
};
