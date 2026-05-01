const prisma = require('./src/config/prisma');
const bcrypt = require('bcryptjs');

const demoUsers = [
  { id: 1, name: 'Admin User', email: 'admin@solar.com', phone: '9876543210', role: 'admin', street: '', village: '', taluka: '', district: '', state: '' },
  { id: 2, name: 'Ravi Kumar', email: 'ravi@solar.com', phone: '9876543211', role: 'employee', street: '', village: '', taluka: '', district: '', state: '' },
  { id: 3, name: 'Sneha Reddy', email: 'sneha@solar.com', phone: '9876543212', role: 'employee', street: '', village: '', taluka: '', district: '', state: '' },
  { id: 4, name: 'Medha Dev', email: 'dev@solar.com', phone: '9876543213', role: 'admin', street: '', village: '', taluka: '', district: '', state: '' },
  { id: 5, name: 'Sunil Electricals', email: 'sunil@solar.com', phone: '9876543214', role: 'electrician', street: 'Door No 5, Main Road', village: 'Jubilee Hills', taluka: 'Khairatabad', district: 'Hyderabad', state: 'Telangana' },
  { id: 6, name: 'DWCRA Group Service', email: 'dwcra@solar.com', phone: '9876543215', role: 'dwcra', street: 'Block 2, DWCRA Colony', village: 'Madhapur', taluka: 'Serilingampally', district: 'Hyderabad', state: 'Telangana' },
];

const demoPasswords = {
  'admin@solar.com': 'admin123',
  'ravi@solar.com': 'ravi123',
  'sneha@solar.com': 'sneha123',
  'dev@solar.com': 'dev123',
  'sunil@solar.com': 'sunil123',
  'dwcra@solar.com': 'dwcra123',
};

const demoProjects = [
  {
    id: 1, project_name: '10kW Rooftop – Jubilee Hills', customer_name: 'Rajesh Kumar',
    customer_email: 'rajesh@gmail.com', customer_phone: '9988776655',
    village: 'Jubilee Hills', site_address: 'Plot 42, Jubilee Hills, Hyderabad', system_size_kw: 10,
    panel_type: 'Mono PERC 540W', panel_count: 20, inverter_type: 'Growatt 10kW Hybrid',
    inverter_count: 1, project_cost: 650000, status: 'completed',
    start_date: '2025-11-15', expected_completion: '2025-12-15', actual_completion: '2025-12-10',
    notes: 'Net metering approved. Customer very satisfied.', created_by: 2,
    created_at: '2025-11-10T10:00:00Z',
  },
  {
    id: 2, project_name: '100kW Ground Mount – Vizag Factory', customer_name: 'Priya Sharma',
    customer_email: 'priya@textiles.com', customer_phone: '9876501234',
    village: 'Vizag', site_address: 'Industrial Area, Vizag', system_size_kw: 100,
    panel_type: 'Bifacial 545W', panel_count: 200, inverter_type: 'Sungrow 100kW',
    inverter_count: 1, project_cost: 5500000, status: 'completed',
    start_date: '2025-09-01', expected_completion: '2025-11-30', actual_completion: '2025-11-20',
    notes: 'Monitoring dashboard installed. ROI in 3.2 years.', created_by: 2,
    created_at: '2025-08-20T10:00:00Z',
  },
  {
    id: 3, project_name: '5kW Residential – Madhapur', customer_name: 'Anita Desai',
    customer_email: 'anita.d@gmail.com', customer_phone: '9123456789',
    village: 'Madhapur', site_address: '12-B, Madhapur Main Rd, Hyderabad', system_size_kw: 5,
    panel_type: 'Mono PERC 540W', panel_count: 10, inverter_type: 'Fronius 5kW',
    inverter_count: 1, project_cost: 350000, status: 'in_progress',
    start_date: '2026-03-10', expected_completion: '2026-04-15', actual_completion: null,
    notes: 'Subsidy application submitted under PM Surya Ghar.', created_by: 3,
    created_at: '2026-03-05T10:00:00Z',
  },
  {
    id: 4, project_name: '50kW Hospital Backup – Secunderabad', customer_name: 'Dr. Anand Rao',
    customer_email: 'anand@hospital.com', customer_phone: '9090909090',
    village: 'Secunderabad', site_address: 'MG Road, Secunderabad', system_size_kw: 50,
    panel_type: 'Bifacial 545W', panel_count: 100, inverter_type: 'Huawei 50kW',
    inverter_count: 1, project_cost: 3200000, status: 'in_progress',
    start_date: '2026-02-01', expected_completion: '2026-05-01', actual_completion: null,
    notes: 'Battery backup 20kWh with auto-switchover.', created_by: 2,
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 5, project_name: '3kW Rooftop – Kukatpally', customer_name: 'Suresh Babu',
    customer_email: 'suresh@gmail.com', customer_phone: '9012345678',
    village: 'Kukatpally', site_address: 'Flat 302, Green Heights, Kukatpally', system_size_kw: 3,
    panel_type: 'Mono PERC 540W', panel_count: 6, inverter_type: 'Growatt 3kW',
    inverter_count: 1, project_cost: 210000, status: 'planning',
    start_date: '2026-04-20', expected_completion: '2026-05-10', actual_completion: null,
    notes: 'Site survey done. Waiting for subsidy approval.', created_by: 3,
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 6, project_name: '8kW Rooftop – Gachibowli', customer_name: 'Meena Patel',
    customer_email: 'meena@gmail.com', customer_phone: '9871234567',
    village: 'Gachibowli', site_address: 'Villa 12, Gachibowli', system_size_kw: 8,
    panel_type: 'Mono PERC 540W', panel_count: 16, inverter_type: 'Growatt 10kW Hybrid',
    inverter_count: 1, project_cost: 520000, status: 'completed',
    start_date: '2025-07-01', expected_completion: '2025-08-01', actual_completion: '2025-07-28',
    notes: 'Roof reinforcement done.', created_by: 2,
    created_at: '2025-06-20T10:00:00Z',
  },
];

const demoInvoices = [
  {
    id: 1, invoice_number: 'INV-20251210-0001', project_id: 1,
    project_name: '10kW Rooftop – Jubilee Hills', customer_name: 'Rajesh Kumar',
    customer_email: 'rajesh@gmail.com', subtotal: 585000, tax_percent: 12,
    tax_amount: 70200, total_amount: 655200, status: 'paid',
    due_date: '2026-01-10', paid_date: '2025-12-28',
    notes: 'Full payment received via NEFT.',
    created_at: '2025-12-10T10:00:00Z',
    items: [
      { id: 1, description: 'Mono PERC 540W Panels (x20)', quantity: 20, unit_price: 18000, total: 360000 },
      { id: 2, description: 'Growatt 10kW Hybrid Inverter', quantity: 1, unit_price: 125000, total: 125000 },
      { id: 3, description: 'Mounting Structure & Wiring', quantity: 1, unit_price: 60000, total: 60000 },
      { id: 4, description: 'Installation & Commissioning', quantity: 1, unit_price: 40000, total: 40000 },
    ],
  },
  {
    id: 2, invoice_number: 'INV-20251120-0002', project_id: 2,
    project_name: '100kW Ground Mount – Vizag Factory', customer_name: 'Priya Sharma',
    customer_email: 'priya@textiles.com', subtotal: 4900000, tax_percent: 12,
    tax_amount: 588000, total_amount: 5488000, status: 'paid',
    due_date: '2025-12-20', paid_date: '2025-12-15',
    notes: 'Payment in 2 installments.',
    created_at: '2025-11-20T10:00:00Z',
    items: [
      { id: 5, description: 'Bifacial 545W Panels (x200)', quantity: 200, unit_price: 17500, total: 3500000 },
      { id: 6, description: 'Sungrow 100kW Inverter', quantity: 1, unit_price: 650000, total: 650000 },
      { id: 7, description: 'Ground Mount Structure', quantity: 1, unit_price: 450000, total: 450000 },
      { id: 8, description: 'Monitoring Dashboard Setup', quantity: 1, unit_price: 100000, total: 100000 },
      { id: 9, description: 'Installation & Testing', quantity: 1, unit_price: 200000, total: 200000 },
    ],
  },
  {
    id: 3, invoice_number: 'INV-20260310-0003', project_id: 3,
    project_name: '5kW Residential – Madhapur', customer_name: 'Anita Desai',
    customer_email: 'anita.d@gmail.com', subtotal: 315000, tax_percent: 12,
    tax_amount: 37800, total_amount: 352800, status: 'sent',
    due_date: '2026-04-10', paid_date: null,
    notes: 'Advance 50% received. Balance on completion.',
    created_at: '2026-03-10T10:00:00Z',
    items: [
      { id: 10, description: 'Mono PERC 540W Panels (x10)', quantity: 10, unit_price: 18000, total: 180000 },
      { id: 11, description: 'Fronius 5kW Inverter', quantity: 1, unit_price: 85000, total: 85000 },
      { id: 12, description: 'Mounting + Wiring + Installation', quantity: 1, unit_price: 50000, total: 50000 },
    ],
  },
];

const demoInventory = [
  { id: 1, item_name: 'Mono PERC 540W Panel', sku: 'PNL-MONO-540', category: 'panel', quantity: 120, unit: 'piece', min_stock_level: 50, unit_price: 18000, supplier: 'Adani Solar', location: 'Warehouse A', notes: 'Tier-1 panels, 25-yr warranty' },
  { id: 2, item_name: 'Bifacial 545W Panel', sku: 'PNL-BFCL-545', category: 'panel', quantity: 45, unit: 'piece', min_stock_level: 30, unit_price: 17500, supplier: 'Trina Solar', location: 'Warehouse A', notes: 'For ground mount & carport' },
  { id: 3, item_name: 'Growatt 10kW Hybrid Inverter', sku: 'INV-GRW-10H', category: 'inverter', quantity: 8, unit: 'piece', min_stock_level: 5, unit_price: 125000, supplier: 'Growatt India', location: 'Warehouse B', notes: 'Popular for residential' },
  { id: 4, item_name: 'Growatt 3kW Inverter', sku: 'INV-GRW-3K', category: 'inverter', quantity: 3, unit: 'piece', min_stock_level: 5, unit_price: 45000, supplier: 'Growatt India', location: 'Warehouse B', notes: 'Low stock — reorder' },
  { id: 5, item_name: 'Lithium Battery 10kWh', sku: 'BAT-LI-10K', category: 'battery', quantity: 6, unit: 'piece', min_stock_level: 3, unit_price: 320000, supplier: 'BYD Energy', location: 'Warehouse B', notes: 'For hybrid systems' },
];

const demoMaintenance = [
  {
    id: 1, project_id: 1, project_name: '10kW Rooftop – Jubilee Hills',
    issue_type: 'panel_cleaning', priority: 'medium', status: 'completed',
    description: 'Annual maintenance check — panel cleaning and inverter inspection.',
    assigned_to: 'dwcra_group', electrician_name: 'Venkat Rao', electrician_phone: '9000100001',
    scheduled_date: '2026-03-15', completed_date: '2026-03-15',
    resolution_notes: 'All panels cleaned. Inverter firmware updated. System performing at 98%.',
    amount: 5000, payment_status: 'paid', before_photo_1: null, before_photo_2: null, after_photo_1: null, after_photo_2: null,
    created_by: 2, requested_by_name: 'Ravi Kumar',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 2, project_id: 3, project_name: '5kW Residential – Madhapur',
    issue_type: 'inverter_repair', priority: 'high', status: 'in_progress',
    description: 'Inverter showing error E-011. System not generating power since yesterday.',
    assigned_to: 'local_electrician', electrician_name: '', electrician_phone: '',
    scheduled_date: '2026-04-08', completed_date: null,
    resolution_notes: null,
    amount: 12000, payment_status: 'unpaid', before_photo_1: null, before_photo_2: null, after_photo_1: null, after_photo_2: null,
    created_by: 3, requested_by_name: 'Sneha Reddy',
    created_at: '2026-04-07T08:00:00Z',
  },
];

async function seed() {
  console.log('Seeding data...');
  
  for (const u of demoUsers) {
    if (u.id === 1) continue; 
    const password = await bcrypt.hash(demoPasswords[u.email], 10);
    await prisma.users.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password,
        role: u.role,
        phone: u.phone,
        street: u.street || null,
        village: u.village || null,
        taluka: u.taluka || null,
        district: u.district || null,
        state: u.state || null
      }
    });
  }

  for (const p of demoProjects) {
    await prisma.projects.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        project_name: p.project_name,
        customer_name: p.customer_name,
        customer_email: p.customer_email,
        customer_phone: p.customer_phone,
        site_address: p.site_address,
        system_size_kw: p.system_size_kw,
        panel_type: p.panel_type,
        panel_count: p.panel_count,
        inverter_type: p.inverter_type,
        inverter_count: p.inverter_count,
        project_cost: p.project_cost,
        status: p.status,
        start_date: p.start_date ? new Date(p.start_date) : null,
        expected_completion: p.expected_completion ? new Date(p.expected_completion) : null,
        actual_completion: p.actual_completion ? new Date(p.actual_completion) : null,
        notes: p.notes,
        created_by: p.created_by,
        created_at: new Date(p.created_at)
      }
    });
  }

  for (const inv of demoInvoices) {
    await prisma.invoices.upsert({
      where: { invoice_number: inv.invoice_number },
      update: {},
      create: {
        id: inv.id,
        invoice_number: inv.invoice_number,
        project_id: inv.project_id,
        customer_name: inv.customer_name,
        customer_email: inv.customer_email,
        subtotal: inv.subtotal,
        tax_rate: inv.tax_percent,
        tax_amount: inv.tax_amount,
        total_amount: inv.total_amount,
        status: inv.status,
        due_date: inv.due_date ? new Date(inv.due_date) : null,
        paid_date: inv.paid_date ? new Date(inv.paid_date) : null,
        notes: inv.notes,
        created_at: new Date(inv.created_at),
        invoice_items: {
          create: inv.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total
          }))
        }
      }
    });
  }

  for (const inv of demoInventory) {
    await prisma.inventory.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id,
        item_name: inv.item_name,
        sku: inv.sku,
        category: inv.category,
        quantity: inv.quantity,
        min_stock_level: inv.min_stock_level,
        unit_price: inv.unit_price,
        supplier: inv.supplier,
        location: inv.location,
        description: inv.notes
      }
    });
  }

  for (const m of demoMaintenance) {
    await prisma.maintenance_requests.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        project_id: m.project_id,
        requested_by: m.created_by,
        issue_type: m.issue_type,
        description: m.description,
        priority: m.priority,
        status: m.status,
        assigned_to: m.assigned_to,
        electrician_name: m.electrician_name || null,
        electrician_phone: m.electrician_phone || null,
        scheduled_date: m.scheduled_date ? new Date(m.scheduled_date) : null,
        completed_date: m.completed_date ? new Date(m.completed_date) : null,
        resolution_notes: m.resolution_notes,
        amount: m.amount,
        payment_status: m.payment_status,
        created_at: new Date(m.created_at)
      }
    });
  }

  console.log('Seeding finished.');
  
  await prisma.$queryRawUnsafe(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
  await prisma.$queryRawUnsafe(`SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects))`);
  await prisma.$queryRawUnsafe(`SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices))`);
  await prisma.$queryRawUnsafe(`SELECT setval('invoice_items_id_seq', (SELECT MAX(id) FROM invoice_items))`);
  await prisma.$queryRawUnsafe(`SELECT setval('inventory_id_seq', (SELECT MAX(id) FROM inventory))`);
  await prisma.$queryRawUnsafe(`SELECT setval('maintenance_requests_id_seq', (SELECT MAX(id) FROM maintenance_requests))`);

}
seed().catch(console.error).finally(() => prisma.$disconnect());
