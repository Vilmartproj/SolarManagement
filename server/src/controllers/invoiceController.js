const pool = require('../config/db');

exports.createInvoice = async (req, res) => {
  try {
    const {
      project_id, customer_name, customer_email, customer_address,
      items, tax_rate, due_date, notes,
    } = req.body;

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxRate = tax_rate || 18;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const { rows: countResult } = await pool.query(
      "SELECT COUNT(*) AS count FROM invoices WHERE created_at::date = CURRENT_DATE"
    );
    const seq = String(parseInt(countResult[0].count) + 1).padStart(4, '0');
    const invoiceNumber = `INV-${dateStr}-${seq}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [inserted] } = await client.query(
        `INSERT INTO invoices (invoice_number, project_id, customer_name, customer_email,
          customer_address, subtotal, tax_rate, tax_amount, total_amount, due_date, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [invoiceNumber, project_id, customer_name, customer_email,
          customer_address, subtotal, taxRate, taxAmount, totalAmount,
          due_date, notes, req.user.id]
      );

      const invoiceId = inserted.id;

      for (const item of items) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoiceId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Invoice created', invoiceId, invoiceNumber });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT i.*, p.project_name FROM invoices i
                 LEFT JOIN projects p ON i.project_id = p.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) {
      query += ` AND i.status = $${idx++}`;
      params.push(status);
    }
    if (search) {
      query += ` AND (i.invoice_number ILIKE $${idx} OR i.customer_name ILIKE $${idx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }

    query += ' ORDER BY i.created_at DESC';
    const { rows: invoices } = await pool.query(query, params);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { rows: invoices } = await pool.query(
      `SELECT i.*, p.project_name FROM invoices i
       LEFT JOIN projects p ON i.project_id = p.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { rows: items } = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [req.params.id]
    );

    res.json({ ...invoices[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paid_date } = req.body;
    const updates = ['status = $1'];
    const params = [status];
    let idx = 2;

    if (status === 'paid' && paid_date) {
      updates.push(`paid_date = $${idx++}`);
      params.push(paid_date);
    }

    params.push(req.params.id);
    const { rowCount } = await pool.query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
