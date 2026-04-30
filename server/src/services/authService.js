const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.findUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows;
};

exports.findUserByEmailExceptId = async (email, userId) => {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
  return rows;
};

exports.registerUser = async (userData) => {
  const { name, email, password, role, phone } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name, email, hashedPassword, role || 'employee', phone]
  );
  return rows[0].id;
};

exports.createUser = async (userData) => {
  const { name, email, password, role, phone, street, village, taluka, district, state } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role, phone, street, village, taluka, district, state)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [name, email, hashedPassword, role || 'employee', phone || null,
      street || null, village || null, taluka || null, district || null, state || null]
  );
  return rows[0].id;
};

exports.loginUser = async (email, password) => {
  const users = await exports.findUserByEmail(email);
  if (users.length === 0) return null;

  const user = users[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

exports.getUserProfile = async (userId) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, phone, street, village, taluka, district, state, created_at FROM users WHERE id = $1',
    [userId]
  );
  return rows[0];
};

exports.getAllUsers = async () => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, phone, street, village, taluka, district, state, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

exports.updateUser = async (userId, userData) => {
  const { name, email, role, phone, street, village, taluka, district, state, password } = userData;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE users SET name=$1, email=$2, role=$3, phone=$4, street=$5, village=$6,
        taluka=$7, district=$8, state=$9, password=$10 WHERE id=$11`,
      [name, email, role, phone || null, street || null, village || null,
        taluka || null, district || null, state || null, hashedPassword, userId]
    );
  } else {
    await pool.query(
      `UPDATE users SET name=$1, email=$2, role=$3, phone=$4, street=$5, village=$6,
        taluka=$7, district=$8, state=$9 WHERE id=$10`,
      [name, email, role, phone || null, street || null, village || null,
        taluka || null, district || null, state || null, userId]
    );
  }
};

exports.deleteUser = async (userId) => {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return rowCount;
};
