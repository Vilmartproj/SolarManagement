const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', inventoryController.getAllItems);
router.get('/:id', inventoryController.getItemById);
router.post('/', authorizeAdmin, inventoryController.createItem);
router.put('/:id', authorizeAdmin, inventoryController.updateItem);
router.patch('/:id/stock', authorizeAdmin, inventoryController.updateStock);
router.delete('/:id', authorizeAdmin, inventoryController.deleteItem);

module.exports = router;
