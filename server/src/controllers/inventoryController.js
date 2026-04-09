const pool = require('../config/db');

exports.getAllItems = async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (item_name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (low_stock === 'true') {
      query += ' AND quantity <= min_stock_level';
    }

    query += ' ORDER BY item_name ASC';
    const [items] = await pool.query(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const [items] = await pool.query('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
    if (items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(items[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const {
      item_name, category, sku, quantity, min_stock_level,
      unit_price, supplier, location, description,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO inventory (item_name, category, sku, quantity, min_stock_level,
        unit_price, supplier, location, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_name, category, sku, quantity || 0, min_stock_level || 10,
        unit_price, supplier, location, description]
    );

    res.status(201).json({ message: 'Item added', itemId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const {
      item_name, category, sku, quantity, min_stock_level,
      unit_price, supplier, location, description,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE inventory SET item_name=?, category=?, sku=?, quantity=?, min_stock_level=?,
        unit_price=?, supplier=?, location=?, description=? WHERE id=?`,
      [item_name, category, sku, quantity, min_stock_level,
        unit_price, supplier, location, description, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    const operator = operation === 'subtract' ? '-' : '+';

    const [result] = await pool.query(
      `UPDATE inventory SET quantity = quantity ${operator} ? WHERE id = ?`,
      [Math.abs(quantity), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
