const pool = require('../config/db');

exports.createRequest = async (requestData, userId) => {
  const {
    project_id, issue_type, description, priority,
    assigned_to, electrician_name, electrician_phone, scheduled_date,
    amount, payment_status,
  } = requestData;

  const { rows } = await pool.query(
    `INSERT INTO maintenance_requests (project_id, requested_by, issue_type, description,
      priority, assigned_to, electrician_name, electrician_phone, scheduled_date, amount, payment_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [project_id || null, userId, issue_type, description,
      priority || 'medium', assigned_to || null, electrician_name, electrician_phone,
      scheduled_date || null, amount || null, payment_status || 'unpaid']
  );
  return rows[0].id;
};

exports.getAllRequests = async (filters, user) => {
  const { status, priority, assigned_to } = filters;
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
  if (user.role !== 'admin') {
    if (user.role === 'electrician' || user.role === 'dwcra') {
      query += ` AND m.electrician_name = $${idx++}`;
      params.push(user.name);
    } else {
      query += ` AND m.requested_by = $${idx++}`;
      params.push(user.id);
    }
  }

  query += ' ORDER BY m.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
};

exports.getRequestById = async (id) => {
  const { rows } = await pool.query(
    `SELECT m.*, p.project_name, u.name as requested_by_name
     FROM maintenance_requests m
     LEFT JOIN projects p ON m.project_id = p.id
     LEFT JOIN users u ON m.requested_by = u.id WHERE m.id = $1`,
    [id]
  );
  return rows[0];
};

exports.updateRequest = async (id, requestData, user) => {
  if (user.role !== 'admin') {
    const { rows } = await pool.query(
      'SELECT requested_by, electrician_name FROM maintenance_requests WHERE id = $1',
      [id]
    );
    if (rows.length === 0) return { error: 'Request not found', status: 404 };
    const record = rows[0];
    const isTechAssigned =
      (user.role === 'electrician' || user.role === 'dwcra') &&
      record.electrician_name === user.name;
    if (!isTechAssigned && record.requested_by !== user.id) {
      return { error: 'Access denied', status: 403 };
    }
  }

  const {
    project_id, issue_type, description,
    status, assigned_to, electrician_name, electrician_phone,
    scheduled_date, completed_date, resolution_notes, priority,
    amount, payment_status,
    before_photo_1, before_photo_2, after_photo_1, after_photo_2,
  } = requestData;

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
      id]
  );

  if (rowCount === 0) return { error: 'Request not found', status: 404 };
  return { success: true };
};

exports.uploadPhotos = async (id, type, files, user) => {
  if (user.role !== 'admin') {
    const { rows } = await pool.query(
      'SELECT electrician_name FROM maintenance_requests WHERE id = $1',
      [id]
    );
    if (rows.length === 0) return { error: 'Request not found', status: 404 };
    const isTechAssigned =
      (user.role === 'electrician' || user.role === 'dwcra') &&
      rows[0].electrician_name === user.name;
    if (!isTechAssigned) return { error: 'Access denied', status: 403 };
  }

  if (!['before', 'after'].includes(type)) {
    return { error: 'Query param "type" must be "before" or "after"', status: 400 };
  }

  if (!files || files.length === 0) {
    return { error: 'No photos uploaded', status: 400 };
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

  if (rowCount === 0) return { error: 'Request not found', status: 404 };
  return { p1, p2 };
};

exports.deleteRequest = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [id]);
  return rowCount;
};
