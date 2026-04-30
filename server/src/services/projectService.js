const pool = require('../config/db');

exports.createProject = async (projectData, userId) => {
  const {
    project_name, customer_name, customer_email, customer_phone,
    site_address, system_size_kw, panel_type, panel_count,
    inverter_type, inverter_count, project_cost, status,
    start_date, expected_completion, notes,
  } = projectData;

  const { rows } = await pool.query(
    `INSERT INTO projects (project_name, customer_name, customer_email, customer_phone,
      site_address, system_size_kw, panel_type, panel_count, inverter_type, inverter_count,
      project_cost, status, start_date, expected_completion, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
    [project_name, customer_name, customer_email, customer_phone,
      site_address, system_size_kw, panel_type, panel_count,
      inverter_type, inverter_count, project_cost, status || 'planning',
      start_date, expected_completion, notes, userId]
  );
  return rows[0].id;
};

exports.getAllProjects = async (status, search) => {
  let query = `SELECT p.*, u.name as created_by_name FROM projects p
               LEFT JOIN users u ON p.created_by = u.id WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (status) {
    query += ` AND p.status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    query += ` AND (p.project_name ILIKE $${idx} OR p.customer_name ILIKE $${idx + 1})`;
    params.push(`%${search}%`, `%${search}%`);
    idx += 2;
  }

  query += ' ORDER BY p.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
};

exports.getProjectById = async (id) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.name as created_by_name FROM projects p
     LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1`,
    [id]
  );
  return rows[0];
};

exports.updateProject = async (id, projectData) => {
  const {
    project_name, customer_name, customer_email, customer_phone,
    site_address, system_size_kw, panel_type, panel_count,
    inverter_type, inverter_count, project_cost, status,
    start_date, expected_completion, actual_completion, notes,
  } = projectData;

  const { rowCount } = await pool.query(
    `UPDATE projects SET project_name=$1, customer_name=$2, customer_email=$3, customer_phone=$4,
      site_address=$5, system_size_kw=$6, panel_type=$7, panel_count=$8, inverter_type=$9,
      inverter_count=$10, project_cost=$11, status=$12, start_date=$13, expected_completion=$14,
      actual_completion=$15, notes=$16 WHERE id=$17`,
    [project_name, customer_name, customer_email, customer_phone,
      site_address, system_size_kw, panel_type, panel_count,
      inverter_type, inverter_count, project_cost, status,
      start_date, expected_completion, actual_completion, notes, id]
  );
  return rowCount;
};

exports.deleteProject = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  return rowCount;
};

exports.getDashboardStats = async () => {
  const { rows: [tp] } = await pool.query('SELECT COUNT(*) AS count FROM projects');
  const { rows: [ap] } = await pool.query("SELECT COUNT(*) AS count FROM projects WHERE status = 'in_progress'");
  const { rows: [cp] } = await pool.query("SELECT COUNT(*) AS count FROM projects WHERE status = 'completed'");
  const { rows: [tr] } = await pool.query("SELECT COALESCE(SUM(project_cost), 0) AS total FROM projects WHERE status = 'completed'");
  const { rows: [pm] } = await pool.query("SELECT COUNT(*) AS count FROM maintenance_requests WHERE status IN ('pending', 'assigned')");
  const { rows: [ls] } = await pool.query('SELECT COUNT(*) AS count FROM inventory WHERE quantity <= min_stock_level');

  return {
    totalProjects: Number(tp.count),
    activeProjects: Number(ap.count),
    completedProjects: Number(cp.count),
    totalRevenue: Number(tr.total),
    pendingMaintenance: Number(pm.count),
    lowStockItems: Number(ls.count),
  };
};
