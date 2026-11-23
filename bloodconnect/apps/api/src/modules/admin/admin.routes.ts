import { Router } from 'express';
import { AdminController } from './admin.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';
import { UserRole } from '@bloodconnect/shared';
import { VerifyOrganizationSchema, UpdateStageRuleSchema, UpdateSystemConfigSchema } from '@bloodconnect/shared';

const router = Router();

router.use(authenticate, requireRoles(UserRole.ADMIN));

router.get('/users', AdminController.listUsers);
router.patch('/users/:id/status', AdminController.toggleUserStatus);

router.get('/organizations', AdminController.listOrganizations);
router.patch('/organizations/:id/verify', validate(VerifyOrganizationSchema), AdminController.verifyOrganization);

router.get('/analytics/summary', AdminController.getAnalytics);

router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/audit-logs/export', AdminController.exportAuditLogs);

router.get('/stage-rules', AdminController.getStageRules);
router.put('/stage-rules', validate(UpdateStageRuleSchema), AdminController.updateStageRule);

router.get('/config', AdminController.getSystemConfigs);
router.put('/config', validate(UpdateSystemConfigSchema), AdminController.updateSystemConfig);

router.get('/group-mappings', AdminController.getGroupMappings);
router.post('/group-mappings', AdminController.setGroupMapping);

export default router;
