import { Router } from 'express';
import { DonorsController } from './donors.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';
import { UserRole } from '@bloodconnect/shared';
import {
  UpdateDonorProfileSchema,
  UpdateDonorAvailabilitySchema,
  UpdateDonorPreferencesSchema,
} from '@bloodconnect/shared';

const router = Router();

router.use(authenticate, requireRoles(UserRole.DONOR));

router.get('/me', DonorsController.getProfile);
router.put('/me', validate(UpdateDonorProfileSchema), DonorsController.updateProfile);
router.patch('/me/availability', validate(UpdateDonorAvailabilitySchema), DonorsController.updateAvailability);
router.put('/me/preferences', validate(UpdateDonorPreferencesSchema), DonorsController.updatePreferences);
router.get('/me/requests', DonorsController.getRequests);
router.get('/me/responses', DonorsController.getResponses);

export default router;
