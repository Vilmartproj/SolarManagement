const prisma = require('../config/prisma');

exports.createProject = async (projectData, userId) => {
  const {
    project_name, customer_name, customer_email, customer_phone,
    site_address, system_size_kw, panel_type, panel_count,
    inverter_type, inverter_count, project_cost, status,
    start_date, expected_completion, notes,
  } = projectData;

  const project = await prisma.projects.create({
    data: {
      project_name,
      customer_name,
      customer_email,
      customer_phone,
      site_address,
      system_size_kw: system_size_kw ? parseFloat(system_size_kw) : 0,
      panel_type,
      panel_count: panel_count ? parseInt(panel_count, 10) : null,
      inverter_type,
      inverter_count: inverter_count ? parseInt(inverter_count, 10) : null,
      project_cost: project_cost ? parseFloat(project_cost) : null,
      status: status || 'planning',
      start_date: start_date ? new Date(start_date) : null,
      expected_completion: expected_completion ? new Date(expected_completion) : null,
      notes,
      created_by: userId ? parseInt(userId, 10) : null
    }
  });
  return project.id;
};

exports.getAllProjects = async (status, search) => {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { project_name: { contains: search, mode: 'insensitive' } },
      { customer_name: { contains: search, mode: 'insensitive' } }
    ];
  }

  const projects = await prisma.projects.findMany({
    where,
    include: {
      users: {
        select: { name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return projects.map(p => ({
    ...p,
    created_by_name: p.users?.name
  }));
};

exports.getProjectById = async (id) => {
  const project = await prisma.projects.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      users: {
        select: { name: true }
      }
    }
  });

  if (!project) return null;

  return {
    ...project,
    created_by_name: project.users?.name
  };
};

exports.updateProject = async (id, projectData) => {
  const {
    project_name, customer_name, customer_email, customer_phone,
    site_address, system_size_kw, panel_type, panel_count,
    inverter_type, inverter_count, project_cost, status,
    start_date, expected_completion, actual_completion, notes,
  } = projectData;

  const data = {};
  if (project_name !== undefined) data.project_name = project_name;
  if (customer_name !== undefined) data.customer_name = customer_name;
  if (customer_email !== undefined) data.customer_email = customer_email;
  if (customer_phone !== undefined) data.customer_phone = customer_phone;
  if (site_address !== undefined) data.site_address = site_address;
  if (system_size_kw !== undefined) data.system_size_kw = parseFloat(system_size_kw);
  if (panel_type !== undefined) data.panel_type = panel_type;
  if (panel_count !== undefined) data.panel_count = panel_count ? parseInt(panel_count, 10) : null;
  if (inverter_type !== undefined) data.inverter_type = inverter_type;
  if (inverter_count !== undefined) data.inverter_count = inverter_count ? parseInt(inverter_count, 10) : null;
  if (project_cost !== undefined) data.project_cost = project_cost ? parseFloat(project_cost) : null;
  if (status !== undefined) data.status = status;
  if (start_date !== undefined) data.start_date = start_date ? new Date(start_date) : null;
  if (expected_completion !== undefined) data.expected_completion = expected_completion ? new Date(expected_completion) : null;
  if (actual_completion !== undefined) data.actual_completion = actual_completion ? new Date(actual_completion) : null;
  if (notes !== undefined) data.notes = notes;

  try {
    await prisma.projects.update({
      where: { id: parseInt(id, 10) },
      data
    });
    return 1;
  } catch (err) {
    return 0;
  }
};

exports.deleteProject = async (id) => {
  try {
    await prisma.projects.delete({ where: { id: parseInt(id, 10) } });
    return 1;
  } catch (err) {
    return 0;
  }
};

exports.getDashboardStats = async () => {
  const totalProjects = await prisma.projects.count();
  const activeProjects = await prisma.projects.count({ where: { status: 'in_progress' } });
  const completedProjects = await prisma.projects.count({ where: { status: 'completed' } });
  
  const revenueResult = await prisma.projects.aggregate({
    _sum: { project_cost: true },
    where: { status: 'completed' }
  });
  
  const pendingMaintenance = await prisma.maintenance_requests.count({
    where: { status: { in: ['pending', 'assigned'] } }
  });
  
  const lowStockItemsResult = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM inventory WHERE quantity <= min_stock_level`;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalRevenue: Number(revenueResult._sum.project_cost) || 0,
    pendingMaintenance,
    lowStockItems: Number(lowStockItemsResult[0].count),
  };
};
