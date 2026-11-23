import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authRateLimiter } from '../../common/middleware/rateLimiter.middleware';
import { LoginSchema, RegisterDonorSchema, RefreshTokenSchema } from '@bloodconnect/shared';

const router = Router();

router.post('/register/donor', authRateLimiter, validate(RegisterDonorSchema), AuthController.registerDonor);
router.post('/login', authRateLimiter, validate(LoginSchema), AuthController.login);
router.post('/refresh', validate(RefreshTokenSchema), AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
