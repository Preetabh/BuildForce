import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from './project.validation';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Aggregations and Recycle Bin (must precede /:id)
router.get('/stats', ProjectController.getProjectStats);
router.get('/recycle-bin', ProjectController.getRecycleBin);

// Main collection routes
router.get('/', validateQuery(projectQuerySchema), ProjectController.getProjects);
router.post('/', validateBody(createProjectSchema), ProjectController.createProject);

// Single project item operations
router.get('/:id', ProjectController.getProjectById);
router.get('/:id/sub-projects', ProjectController.getSubProjects);
router.post('/:id/sub-projects', validateBody(createProjectSchema), ProjectController.createSubProject);
router.patch('/:id', validateBody(updateProjectSchema), ProjectController.updateProject);
router.delete('/:id', ProjectController.softDeleteProject);

// Specific project state mutations
router.patch('/:id/archive', ProjectController.toggleArchive);
router.patch('/:id/restore', ProjectController.restoreProject);
router.delete('/:id/permanent', ProjectController.permanentDeleteProject);

export default router;
