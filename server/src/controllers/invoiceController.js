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
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as count FROM invoices WHERE DATE(created_at) = CURDATE()"
    );
    const seq = String(countResult[0].count + 1).padStart(4, '0');
    const invoiceNumber = `INV-${dateStr}-${seq}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO invoices (invoice_number, project_id, customer_name, customer_email,
          customer_address, subtotal, tax_rate, tax_amount, total_amount, due_date, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceNumber, project_id, customer_name, customer_email,
          customer_address, subtotal, taxRate, taxAmount, totalAmount,
          due_date, notes, req.user.id]
      );

      const invoiceId = result.insertId;

      for (const item of items) {
        await connection.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }

      await connection.commit();
      res.status(201).json({ message: 'Invoice created', invoiceId, invoiceNumber });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
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

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (i.invoice_number LIKE ? OR i.customer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY i.created_at DESC';
    const [invoices] = await pool.query(query, params);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const [invoices] = await pool.query(
      `SELECT i.*, p.project_name FROM invoices i
       LEFT JOIN projects p ON i.project_id = p.id WHERE i.id = ?`,
      [req.params.id]
    );
    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const [items] = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
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
    const updates = ['status = ?'];
    const params = [status];

    if (status === 'paid' && paid_date) {
      updates.push('paid_date = ?');
      params.push(paid_date);
    }

    params.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
