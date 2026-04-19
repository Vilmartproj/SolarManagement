const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'maintenance'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `maint-${req.params.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.split('/')[1]);
    cb(null, !!ok);
  },
});

router.use(authenticate);

router.get('/', maintenanceController.getAllRequests);
router.get('/:id', maintenanceController.getRequestById);
router.post('/', maintenanceController.createRequest);
router.put('/:id', maintenanceController.updateRequest);
router.post('/:id/photos', upload.array('photos', 2), maintenanceController.uploadPhotos);
router.delete('/:id', authorizeAdmin, maintenanceController.deleteRequest);

module.exports = router;
