const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', maintenanceController.getAllRequests);
router.get('/:id', maintenanceController.getRequestById);
router.post('/', maintenanceController.createRequest);
router.put('/:id', maintenanceController.updateRequest);
router.delete('/:id', authorizeAdmin, maintenanceController.deleteRequest);

module.exports = router;
