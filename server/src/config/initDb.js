const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const connection = await pool.getConnection();
  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = initializeDatabase;
