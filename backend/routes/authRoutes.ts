import { Router } from 'express';
import { login, signup, refresh, logout, getMe, updateMe, googleLogin } from '../controllers/authController';
import { authenticateJWT } from '../lib/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/signup', signup);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);
router.put('/me', authenticateJWT, updateMe);

export default router;
