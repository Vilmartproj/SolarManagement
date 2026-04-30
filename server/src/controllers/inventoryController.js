const inventoryService = require('../services/inventoryService');

exports.getAllItems = async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    const items = await inventoryService.getAllItems(category, search, low_stock);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await inventoryService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const itemId = await inventoryService.createItem(req.body);
    res.status(201).json({ message: 'Item added', itemId });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const rowCount = await inventoryService.updateItem(req.params.id, req.body);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const rowCount = await inventoryService.updateStock(req.params.id, quantity, operation);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const rowCount = await inventoryService.deleteItem(req.params.id);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
