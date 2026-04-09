const pool = require('../config/db');

exports.createProject = async (req, res) => {
  try {
    const {
      project_name, customer_name, customer_email, customer_phone,
      site_address, system_size_kw, panel_type, panel_count,
      inverter_type, inverter_count, project_cost, status,
      start_date, expected_completion, notes,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO projects (project_name, customer_name, customer_email, customer_phone,
        site_address, system_size_kw, panel_type, panel_count, inverter_type, inverter_count,
        project_cost, status, start_date, expected_completion, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_name, customer_name, customer_email, customer_phone,
        site_address, system_size_kw, panel_type, panel_count,
        inverter_type, inverter_count, project_cost, status || 'planning',
        start_date, expected_completion, notes, req.user.id]
    );

    res.status(201).json({ message: 'Project created', projectId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT p.*, u.name as created_by_name FROM projects p
                 LEFT JOIN users u ON p.created_by = u.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (p.project_name LIKE ? OR p.customer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';
    const [projects] = await pool.query(query, params);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const [projects] = await pool.query(
      `SELECT p.*, u.name as created_by_name FROM projects p
       LEFT JOIN users u ON p.created_by = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(projects[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const {
      project_name, customer_name, customer_email, customer_phone,
      site_address, system_size_kw, panel_type, panel_count,
      inverter_type, inverter_count, project_cost, status,
      start_date, expected_completion, actual_completion, notes,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE projects SET project_name=?, customer_name=?, customer_email=?, customer_phone=?,
        site_address=?, system_size_kw=?, panel_type=?, panel_count=?, inverter_type=?,
        inverter_count=?, project_cost=?, status=?, start_date=?, expected_completion=?,
        actual_completion=?, notes=? WHERE id=?`,
      [project_name, customer_name, customer_email, customer_phone,
        site_address, system_size_kw, panel_type, panel_count,
        inverter_type, inverter_count, project_cost, status,
        start_date, expected_completion, actual_completion, notes, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalProjects] = await pool.query('SELECT COUNT(*) as count FROM projects');
    const [activeProjects] = await pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'");
    const [completedProjects] = await pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'");
    const [totalRevenue] = await pool.query("SELECT COALESCE(SUM(project_cost), 0) as total FROM projects WHERE status = 'completed'");
    const [pendingMaintenance] = await pool.query("SELECT COUNT(*) as count FROM maintenance_requests WHERE status IN ('pending', 'assigned')");
    const [lowStockItems] = await pool.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_stock_level');

    res.json({
      totalProjects: totalProjects[0].count,
      activeProjects: activeProjects[0].count,
      completedProjects: completedProjects[0].count,
      totalRevenue: totalRevenue[0].total,
      pendingMaintenance: pendingMaintenance[0].count,
      lowStockItems: lowStockItems[0].count,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
