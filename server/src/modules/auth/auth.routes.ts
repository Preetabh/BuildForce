import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, registerAdminSchema } from './auth.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/setup-status', AuthController.getSetupStatus);
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/register-admin', validateBody(registerAdminSchema), AuthController.registerAdmin);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getCurrentUser);
router.patch('/profile', authenticate, AuthController.updateProfile);

export default router;
