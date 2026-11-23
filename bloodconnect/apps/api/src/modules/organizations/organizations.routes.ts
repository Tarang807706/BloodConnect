import { Router } from 'express';
import { OrganizationsController } from './organizations.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireOrganization } from '../../common/middleware/rbac.middleware';
import { RegisterOrganizationSchema } from '@bloodconnect/shared';

const router = Router();

router.post('/register', validate(RegisterOrganizationSchema), OrganizationsController.register);
router.get('/me', authenticate, requireOrganization, OrganizationsController.me);
router.get('/blood-centres', authenticate, OrganizationsController.listCentres);

export default router;
