const pool = require('../config/db');

exports.createRequest = async (req, res) => {
  try {
    const {
      project_id, issue_type, description, priority,
      assigned_to, electrician_name, electrician_phone, scheduled_date,
      amount, payment_status,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO maintenance_requests (project_id, requested_by, issue_type, description,
        priority, assigned_to, electrician_name, electrician_phone, scheduled_date, amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [project_id || null, req.user.id, issue_type, description,
        priority || 'medium', assigned_to || null, electrician_name, electrician_phone,
        scheduled_date || null, amount || null, payment_status || 'unpaid']
    );

    res.status(201).json({ message: 'Maintenance request created', requestId: rows[0].id });
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
    let idx = 1;

    if (status) {
      query += ` AND m.status = $${idx++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND m.priority = $${idx++}`;
      params.push(priority);
    }
    if (assigned_to) {
      query += ` AND m.assigned_to = $${idx++}`;
      params.push(assigned_to);
    }

    // Technicians see requests assigned to them; other non-admins see their own requests
    if (req.user.role !== 'admin') {
      if (req.user.role === 'electrician' || req.user.role === 'dwcra') {
        query += ` AND m.electrician_name = $${idx++}`;
        params.push(req.user.name);
      } else {
        query += ` AND m.requested_by = $${idx++}`;
        params.push(req.user.id);
      }
    }

    query += ' ORDER BY m.created_at DESC';
    const { rows: requests } = await pool.query(query, params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const { rows: requests } = await pool.query(
      `SELECT m.*, p.project_name, u.name as requested_by_name
       FROM maintenance_requests m
       LEFT JOIN projects p ON m.project_id = p.id
       LEFT JOIN users u ON m.requested_by = u.id WHERE m.id = $1`,
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
    // Access control: admin can update anything; technicians can update their assigned requests;
    // employees can only update their own requests
    if (req.user.role !== 'admin') {
      const { rows } = await pool.query(
        'SELECT requested_by, electrician_name FROM maintenance_requests WHERE id = $1',
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
      const record = rows[0];
      const isTechAssigned =
        (req.user.role === 'electrician' || req.user.role === 'dwcra') &&
        record.electrician_name === req.user.name;
      if (!isTechAssigned && record.requested_by !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const {
      project_id, issue_type, description,
      status, assigned_to, electrician_name, electrician_phone,
      scheduled_date, completed_date, resolution_notes, priority,
      amount, payment_status,
      before_photo_1, before_photo_2, after_photo_1, after_photo_2,
    } = req.body;

    const { rowCount } = await pool.query(
      `UPDATE maintenance_requests SET project_id=$1, issue_type=$2, description=$3,
        status=$4, assigned_to=$5, electrician_name=$6,
        electrician_phone=$7, scheduled_date=$8, completed_date=$9, resolution_notes=$10, priority=$11,
        amount=$12, payment_status=$13,
        before_photo_1=COALESCE($14, before_photo_1), before_photo_2=COALESCE($15, before_photo_2),
        after_photo_1=COALESCE($16, after_photo_1), after_photo_2=COALESCE($17, after_photo_2)
       WHERE id=$18`,
      [project_id || null, issue_type, description,
        status, assigned_to || null, electrician_name, electrician_phone,
        scheduled_date || null, completed_date || null, resolution_notes, priority,
        amount || null, payment_status || 'unpaid',
        before_photo_1 || null, before_photo_2 || null,
        after_photo_1 || null, after_photo_2 || null,
        req.params.id]
    );

    if (rowCount === 0) {
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

    // Only admins and the assigned technician may upload photos
    if (req.user.role !== 'admin') {
      const { rows } = await pool.query(
        'SELECT electrician_name FROM maintenance_requests WHERE id = $1',
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
      const isTechAssigned =
        (req.user.role === 'electrician' || req.user.role === 'dwcra') &&
        rows[0].electrician_name === req.user.name;
      if (!isTechAssigned) return res.status(403).json({ message: 'Access denied' });
    }

    const type = req.query.type; // 'before' or 'after'
    if (!['before', 'after'].includes(type)) {
      return res.status(400).json({ message: 'Query param "type" must be "before" or "after"' });
    }

    const fieldName = type === 'before' ? 'before_photos' : 'after_photos';
    const files = (req.files && req.files[fieldName]) || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded' });
    }

    const col1 = `${type}_photo_1`;
    const col2 = `${type}_photo_2`;
    const p1 = files[0] ? `/uploads/maintenance/${files[0].filename}` : null;
    const p2 = files[1] ? `/uploads/maintenance/${files[1].filename}` : null;

    const updates = [];
    const params = [];
    let idx = 1;
    if (p1) { updates.push(`${col1} = $${idx++}`); params.push(p1); }
    if (p2) { updates.push(`${col2} = $${idx++}`); params.push(p2); }
    params.push(id);

    const { rowCount } = await pool.query(
      `UPDATE maintenance_requests SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Photos uploaded', [`${type}_photo_1`]: p1, [`${type}_photo_2`]: p2 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Request deleted' });
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

    // Technicians see requests assigned to them; other non-admins see their own requests
    if (req.user.role !== 'admin') {
      if (req.user.role === 'electrician' || req.user.role === 'dwcra') {
        query += ' AND m.electrician_name = ?';
        params.push(req.user.name);
      } else {
        query += ' AND m.requested_by = ?';
        params.push(req.user.id);
      }
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
    // Access control: admin can update anything; technicians can update their assigned requests;
    // employees can only update their own requests
    if (req.user.role !== 'admin') {
      const [rows] = await pool.query(
        'SELECT requested_by, electrician_name FROM maintenance_requests WHERE id = ?',
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
      const record = rows[0];
      const isTechAssigned =
        (req.user.role === 'electrician' || req.user.role === 'dwcra') &&
        record.electrician_name === req.user.name;
      if (!isTechAssigned && record.requested_by !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const {
      project_id, issue_type, description,
      status, assigned_to, electrician_name, electrician_phone,
      scheduled_date, completed_date, resolution_notes, priority,
      amount, payment_status, photo_1, photo_2,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE maintenance_requests SET project_id=?, issue_type=?, description=?,
        status=?, assigned_to=?, electrician_name=?,
        electrician_phone=?, scheduled_date=?, completed_date=?, resolution_notes=?, priority=?,
        amount=?, payment_status=?,
        photo_1=COALESCE(?, photo_1), photo_2=COALESCE(?, photo_2)
       WHERE id=?`,
      [project_id || null, issue_type, description,
        status, assigned_to, electrician_name, electrician_phone,
        scheduled_date || null, completed_date || null, resolution_notes, priority,
        amount || null, payment_status || 'unpaid',
        photo_1 || null, photo_2 || null,
        req.params.id]
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

    // Only admins and the assigned technician may upload photos
    if (req.user.role !== 'admin') {
      const [rows] = await pool.query(
        'SELECT electrician_name FROM maintenance_requests WHERE id = ?',
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
      const isTechAssigned =
        (req.user.role === 'electrician' || req.user.role === 'dwcra') &&
        rows[0].electrician_name === req.user.name;
      if (!isTechAssigned) return res.status(403).json({ message: 'Access denied' });
    }

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
