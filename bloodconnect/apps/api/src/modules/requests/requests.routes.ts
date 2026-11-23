import { Router } from 'express';
import { RequestsController } from './requests.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRoles, requireOrganization } from '../../common/middleware/rbac.middleware';
import { UserRole } from '@bloodconnect/shared';
import {
  CreateEmergencyRequestSchema,
  CancelRequestSchema,
  VerifyRequestSchema,
} from '@bloodconnect/shared';

const router = Router();

router.use(authenticate, requireOrganization);

router.post(
  '/',
  requireRoles(UserRole.HOSPITAL),
  validate(CreateEmergencyRequestSchema),
  RequestsController.create
);

router.get('/', RequestsController.list);

router.get(
  '/centre/pending',
  requireRoles(UserRole.BLOOD_CENTRE),
  RequestsController.getPendingForCentre
);

router.get('/:id', RequestsController.getDetail);

router.post(
  '/:id/cancel',
  requireRoles(UserRole.HOSPITAL),
  validate(CancelRequestSchema),
  RequestsController.cancel
);

router.post(
  '/:id/verify',
  requireRoles(UserRole.BLOOD_CENTRE),
  validate(VerifyRequestSchema),
  RequestsController.verify
);

export default router;
