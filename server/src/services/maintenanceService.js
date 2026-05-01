const prisma = require('../config/prisma');

exports.createRequest = async (requestData, userId) => {
  const {
    project_id, issue_type, description, priority,
    assigned_to, electrician_name, electrician_phone, scheduled_date,
    amount, payment_status,
  } = requestData;

  const request = await prisma.maintenance_requests.create({
    data: {
      project_id: project_id ? parseInt(project_id, 10) : null,
      requested_by: parseInt(userId, 10),
      issue_type,
      description,
      priority: priority || 'medium',
      assigned_to: assigned_to || null,
      electrician_name,
      electrician_phone,
      scheduled_date: scheduled_date ? new Date(scheduled_date) : null,
      amount: amount ? parseFloat(amount) : null,
      payment_status: payment_status || 'unpaid'
    }
  });
  return request.id;
};

exports.getAllRequests = async (filters, user) => {
  const { status, priority, assigned_to } = filters;
  const where = {};
  
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigned_to) where.assigned_to = assigned_to;

  if (user.role !== 'admin') {
    if (user.role === 'electrician' || user.role === 'dwcra') {
      where.electrician_name = user.name;
    } else {
      where.requested_by = parseInt(user.id, 10);
    }
  }

  const requests = await prisma.maintenance_requests.findMany({
    where,
    include: {
      projects: { select: { project_name: true } },
      users: { select: { name: true } }
    },
    orderBy: { created_at: 'desc' }
  });

  return requests.map(r => ({
    ...r,
    project_name: r.projects?.project_name,
    requested_by_name: r.users?.name
  }));
};

exports.getRequestById = async (id) => {
  const request = await prisma.maintenance_requests.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      projects: { select: { project_name: true } },
      users: { select: { name: true } }
    }
  });

  if (!request) return null;

  return {
    ...request,
    project_name: request.projects?.project_name,
    requested_by_name: request.users?.name
  };
};

exports.updateRequest = async (id, requestData, user) => {
  const requestId = parseInt(id, 10);
  const record = await prisma.maintenance_requests.findUnique({ where: { id: requestId } });
  if (!record) return { error: 'Request not found', status: 404 };

  if (user.role !== 'admin') {
    const isTechAssigned =
      (user.role === 'electrician' || user.role === 'dwcra') &&
      record.electrician_name === user.name;
    if (!isTechAssigned && record.requested_by !== parseInt(user.id, 10)) {
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

  const data = {};
  if (project_id !== undefined) data.project_id = project_id ? parseInt(project_id, 10) : null;
  if (issue_type !== undefined) data.issue_type = issue_type;
  if (description !== undefined) data.description = description;
  if (status !== undefined) data.status = status;
  if (assigned_to !== undefined) data.assigned_to = assigned_to || null;
  if (electrician_name !== undefined) data.electrician_name = electrician_name;
  if (electrician_phone !== undefined) data.electrician_phone = electrician_phone;
  if (scheduled_date !== undefined) data.scheduled_date = scheduled_date ? new Date(scheduled_date) : null;
  if (completed_date !== undefined) data.completed_date = completed_date ? new Date(completed_date) : null;
  if (resolution_notes !== undefined) data.resolution_notes = resolution_notes;
  if (priority !== undefined) data.priority = priority;
  if (amount !== undefined) data.amount = amount ? parseFloat(amount) : null;
  if (payment_status !== undefined) data.payment_status = payment_status;
  if (before_photo_1 !== undefined) data.before_photo_1 = before_photo_1;
  if (before_photo_2 !== undefined) data.before_photo_2 = before_photo_2;
  if (after_photo_1 !== undefined) data.after_photo_1 = after_photo_1;
  if (after_photo_2 !== undefined) data.after_photo_2 = after_photo_2;

  try {
    await prisma.maintenance_requests.update({
      where: { id: requestId },
      data
    });
    return { success: true };
  } catch (err) {
    return { error: 'Request not found', status: 404 };
  }
};

exports.uploadPhotos = async (id, type, files, user) => {
  const requestId = parseInt(id, 10);
  const record = await prisma.maintenance_requests.findUnique({ where: { id: requestId } });
  if (!record) return { error: 'Request not found', status: 404 };

  if (user.role !== 'admin') {
    const isTechAssigned =
      (user.role === 'electrician' || user.role === 'dwcra') &&
      record.electrician_name === user.name;
    if (!isTechAssigned) return { error: 'Access denied', status: 403 };
  }

  if (!['before', 'after'].includes(type)) {
    return { error: 'Query param "type" must be "before" or "after"', status: 400 };
  }

  if (!files || files.length === 0) {
    return { error: 'No photos uploaded', status: 400 };
  }

  const p1 = files[0] ? `/uploads/maintenance/${files[0].filename}` : undefined;
  const p2 = files[1] ? `/uploads/maintenance/${files[1].filename}` : undefined;

  const data = {};
  if (type === 'before') {
    if (p1) data.before_photo_1 = p1;
    if (p2) data.before_photo_2 = p2;
  } else {
    if (p1) data.after_photo_1 = p1;
    if (p2) data.after_photo_2 = p2;
  }

  try {
    await prisma.maintenance_requests.update({
      where: { id: requestId },
      data
    });
    return { p1: p1 || null, p2: p2 || null };
  } catch (err) {
    return { error: 'Update failed', status: 500 };
  }
};

exports.deleteRequest = async (id) => {
  try {
    await prisma.maintenance_requests.delete({ where: { id: parseInt(id, 10) } });
    return 1;
  } catch (err) {
    return 0;
  }
};
