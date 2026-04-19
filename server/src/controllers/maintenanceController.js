const pool = require('../config/db');

exports.createRequest = async (req, res) => {
  try {
    const {
      project_id, issue_type, description, priority,
      assigned_to, electrician_name, electrician_phone, scheduled_date,
      amount, payment_status,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO maintenance_requests (project_id, requested_by, issue_type, description,
        priority, assigned_to, electrician_name, electrician_phone, scheduled_date, amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, req.user.id, issue_type, description,
        priority || 'medium', assigned_to, electrician_name, electrician_phone, scheduled_date,
        amount || null, payment_status || 'unpaid']
    );

    res.status(201).json({ message: 'Maintenance request created', requestId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;
    let query = `SELECT m.*, p.project_name, u.name as requested_by_name
                 FROM maintenance_requests m
                 LEFT JOIN projects p ON m.project_id = p.id
                 LEFT JOIN users u ON m.requested_by = u.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND m.priority = ?';
      params.push(priority);
    }
    if (assigned_to) {
      query += ' AND m.assigned_to = ?';
      params.push(assigned_to);
    }

    // Non-admin users only see their own requests
    if (req.user.role !== 'admin') {
      query += ' AND m.requested_by = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY m.created_at DESC';
    const [requests] = await pool.query(query, params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT m.*, p.project_name, u.name as requested_by_name
       FROM maintenance_requests m
       LEFT JOIN projects p ON m.project_id = p.id
       LEFT JOIN users u ON m.requested_by = u.id WHERE m.id = ?`,
      [req.params.id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(requests[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const {
      status, assigned_to, electrician_name, electrician_phone,
      scheduled_date, completed_date, resolution_notes, priority,
      amount, payment_status,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE maintenance_requests SET status=?, assigned_to=?, electrician_name=?,
        electrician_phone=?, scheduled_date=?, completed_date=?, resolution_notes=?, priority=?,
        amount=?, payment_status=?
       WHERE id=?`,
      [status, assigned_to, electrician_name, electrician_phone,
        scheduled_date, completed_date, resolution_notes, priority,
        amount || null, payment_status || 'unpaid', req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Request updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.uploadPhotos = async (req, res) => {
  try {
    const id = req.params.id;
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded' });
    }

    const photo_1 = files[0] ? `/uploads/maintenance/${files[0].filename}` : null;
    const photo_2 = files[1] ? `/uploads/maintenance/${files[1].filename}` : null;

    const updates = [];
    const params = [];
    if (photo_1) { updates.push('photo_1 = ?'); params.push(photo_1); }
    if (photo_2) { updates.push('photo_2 = ?'); params.push(photo_2); }
    params.push(id);

    const [result] = await pool.query(
      `UPDATE maintenance_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Photos uploaded', photo_1, photo_2 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM maintenance_requests WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
