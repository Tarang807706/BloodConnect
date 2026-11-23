import { Router } from 'express';
import { CasesController } from './cases.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';
import { UserRole } from '@bloodconnect/shared';
import {
  DonorResponseSchema,
  EscalateCaseSchema,
  PauseCaseSchema,
  CancelCaseSchema,
  CloseCaseSchema,
  RecordDonationOutcomeSchema,
} from '@bloodconnect/shared';

const router = Router();

router.use(authenticate);

// Activate case from verified request (Only assigned Blood Centre)
router.post(
  '/requests/:requestId/activate',
  requireRoles(UserRole.BLOOD_CENTRE),
  CasesController.activate
);

// List cases (Role filtered)
router.get('/', CasesController.list);

// Get case detail (Role filtered)
router.get('/:id', CasesController.getDetail);

// Donor response ("I Can Help" / "Cannot Help")
router.post(
  '/:id/respond',
  requireRoles(UserRole.DONOR),
  validate(DonorResponseSchema),
  CasesController.respond
);

// Case State Controls (Blood Centre staff only)
router.post(
  '/:id/escalate',
  requireRoles(UserRole.BLOOD_CENTRE),
  validate(EscalateCaseSchema),
  CasesController.escalate
);

router.post(
  '/:id/pause',
  requireRoles(UserRole.BLOOD_CENTRE),
  validate(PauseCaseSchema),
  CasesController.pause
);

router.post(
  '/:id/resume',
  requireRoles(UserRole.BLOOD_CENTRE),
  CasesController.resume
);

router.post(
  '/:id/cancel',
  requireRoles(UserRole.BLOOD_CENTRE, UserRole.ADMIN),
  validate(CancelCaseSchema),
  CasesController.cancel
);

router.post(
  '/:id/close',
  requireRoles(UserRole.BLOOD_CENTRE, UserRole.ADMIN),
  validate(CloseCaseSchema),
  CasesController.close
);

// Donation Outcomes
router.post(
  '/:id/outcomes',
  requireRoles(UserRole.BLOOD_CENTRE),
  validate(RecordDonationOutcomeSchema),
  CasesController.recordOutcome
);

router.get(
  '/:id/outcomes',
  requireRoles(UserRole.BLOOD_CENTRE, UserRole.ADMIN),
  CasesController.getOutcomes
);

export default router;
