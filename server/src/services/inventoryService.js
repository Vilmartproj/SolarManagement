const pool = require('../config/db');

exports.getAllItems = async (category, search, low_stock) => {
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
  const { rows } = await pool.query(query, params);
  return rows;
};

exports.getItemById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
  return rows[0];
};

exports.createItem = async (itemData) => {
  const {
    item_name, category, sku, quantity, min_stock_level,
    unit_price, supplier, location, description,
  } = itemData;

  const { rows } = await pool.query(
    `INSERT INTO inventory (item_name, category, sku, quantity, min_stock_level,
      unit_price, supplier, location, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [item_name, category, sku, quantity || 0, min_stock_level || 10,
      unit_price, supplier, location, description]
  );
  return rows[0].id;
};

exports.updateItem = async (id, itemData) => {
  const {
    item_name, category, sku, quantity, min_stock_level,
    unit_price, supplier, location, description,
  } = itemData;

  const { rowCount } = await pool.query(
    `UPDATE inventory SET item_name=$1, category=$2, sku=$3, quantity=$4, min_stock_level=$5,
      unit_price=$6, supplier=$7, location=$8, description=$9 WHERE id=$10`,
    [item_name, category, sku, quantity, min_stock_level,
      unit_price, supplier, location, description, id]
  );
  return rowCount;
};

exports.updateStock = async (id, quantity, operation) => {
  const operator = operation === 'subtract' ? '-' : '+';
  const { rowCount } = await pool.query(
    `UPDATE inventory SET quantity = quantity ${operator} $1 WHERE id = $2`,
    [Math.abs(quantity), id]
  );
  return rowCount;
};

exports.deleteItem = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
  return rowCount;
};
