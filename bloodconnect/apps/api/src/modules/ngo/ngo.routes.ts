import { Router } from 'express';
import { NgoController } from './ngo.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRoles, requireOrganization } from '../../common/middleware/rbac.middleware';
import { UserRole } from '@bloodconnect/shared';
import { CreateVolunteerSchema, ActivateNgoVolunteersSchema, VolunteerResponseSchema } from '@bloodconnect/shared';

const router = Router();

router.use(authenticate, requireOrganization, requireRoles(UserRole.NGO));

router.get('/dashboard', NgoController.getDashboard);
router.get('/cases', NgoController.getCases);
router.post('/cases/:id/activate', validate(ActivateNgoVolunteersSchema), NgoController.broadcast);
router.get('/volunteers', NgoController.listVolunteers);
router.post('/volunteers', validate(CreateVolunteerSchema), NgoController.createVolunteer);
router.post('/volunteer-responses', validate(VolunteerResponseSchema), NgoController.recordResponse);

export default router;
