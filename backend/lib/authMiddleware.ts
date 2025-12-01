import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Optionally extend Express's Request type for TypeScript
export interface AuthRequest extends Request {
  user?: any;
}

// Auth middleware: checks for Bearer token in Authorization header
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};
