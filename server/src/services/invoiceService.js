const prisma = require('../config/prisma');

exports.createInvoice = async (invoiceData, userId) => {
  const {
    project_id, customer_name, customer_email, customer_address,
    items, tax_rate, due_date, notes,
  } = invoiceData;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxRate = tax_rate || 18;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const countToday = await prisma.invoices.count({
    where: {
      created_at: {
        gte: todayStart
      }
    }
  });

  const seq = String(countToday + 1).padStart(4, '0');
  const invoiceNumber = `INV-${dateStr}-${seq}`;

  const invoice = await prisma.invoices.create({
    data: {
      invoice_number: invoiceNumber,
      project_id: parseInt(project_id, 10),
      customer_name,
      customer_email,
      customer_address,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      due_date: due_date ? new Date(due_date) : null,
      notes,
      created_by: userId ? parseInt(userId, 10) : null,
      invoice_items: {
        create: items.map(item => ({
          description: item.description,
          quantity: item.quantity ? parseInt(item.quantity, 10) : 1,
          unit_price: parseFloat(item.unit_price),
          total_price: (item.quantity || 1) * parseFloat(item.unit_price)
        }))
      }
    }
  });

  return { invoiceId: invoice.id, invoiceNumber };
};

exports.getAllInvoices = async (status, search) => {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { invoice_number: { contains: search, mode: 'insensitive' } },
      { customer_name: { contains: search, mode: 'insensitive' } }
    ];
  }

  const invoices = await prisma.invoices.findMany({
    where,
    include: {
      projects: {
        select: { project_name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return invoices.map(i => ({
    ...i,
    project_name: i.projects?.project_name
  }));
};

exports.getInvoiceById = async (id) => {
  const invoice = await prisma.invoices.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      projects: {
        select: { project_name: true }
      },
      invoice_items: true
    }
  });

  if (!invoice) return null;

  return {
    ...invoice,
    project_name: invoice.projects?.project_name,
    items: invoice.invoice_items
  };
};

exports.updateInvoiceStatus = async (id, status, paid_date) => {
  const data = { status };
  if (status === 'paid' && paid_date) {
    data.paid_date = new Date(paid_date);
  }

  try {
    await prisma.invoices.update({
      where: { id: parseInt(id, 10) },
      data
    });
    return 1;
  } catch (err) {
    return 0;
  }
};

exports.deleteInvoice = async (id) => {
  try {
    await prisma.invoices.delete({ where: { id: parseInt(id, 10) } });
    return 1;
  } catch (err) {
    return 0;
  }
};
