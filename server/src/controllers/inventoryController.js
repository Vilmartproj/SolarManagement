const pool = require('../config/db');

exports.getAllItems = async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];
    let idx = 1;

    if (category) {
      query += ` AND category = $${idx++}`;
      params.push(category);
    }
    if (search) {
      query += ` AND (item_name ILIKE $${idx} OR sku ILIKE $${idx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }
    if (low_stock === 'true') {
      query += ' AND quantity <= min_stock_level';
    }

    query += ' ORDER BY item_name ASC';
    const { rows: items } = await pool.query(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const { rows: items } = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
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

    const { rows } = await pool.query(
      `INSERT INTO inventory (item_name, category, sku, quantity, min_stock_level,
        unit_price, supplier, location, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [item_name, category, sku, quantity || 0, min_stock_level || 10,
        unit_price, supplier, location, description]
    );

    res.status(201).json({ message: 'Item added', itemId: rows[0].id });
  } catch (err) {
    if (err.code === '23505') {
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

    const { rowCount } = await pool.query(
      `UPDATE inventory SET item_name=$1, category=$2, sku=$3, quantity=$4, min_stock_level=$5,
        unit_price=$6, supplier=$7, location=$8, description=$9 WHERE id=$10`,
      [item_name, category, sku, quantity, min_stock_level,
        unit_price, supplier, location, description, req.params.id]
    );

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
    const operator = operation === 'subtract' ? '-' : '+';

    const { rowCount } = await pool.query(
      `UPDATE inventory SET quantity = quantity ${operator} $1 WHERE id = $2`,
      [Math.abs(quantity), req.params.id]
    );

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
    const { rowCount } = await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
