const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, hashedPassword, role || 'employee', phone]
    );

    res.status(201).json({ message: 'User registered successfully', userId: rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      'SELECT id, name, email, role, phone, street, village, taluka, district, state, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      'SELECT id, name, email, role, phone, street, village, taluka, district, state, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, street, village, taluka, district, state } = req.body;

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, street, village, taluka, district, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [name, email, hashedPassword, role || 'employee', phone || null,
        street || null, village || null, taluka || null, district || null, state || null]
    );

    res.status(201).json({ message: 'User created successfully', userId: rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, phone, street, village, taluka, district, state, password } = req.body;
    const userId = req.params.id;

    if (email) {
      const { rows: existing } = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

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

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
