const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', projectController.getDashboardStats);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', authorizeAdmin, projectController.deleteProject);

module.exports = router;
