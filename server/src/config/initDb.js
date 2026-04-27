const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    // Run the whole file as one block — it contains PL/pgSQL DO $$ blocks
    // that cannot be naively split on semicolons.
    await client.query(schema);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = initializeDatabase;
