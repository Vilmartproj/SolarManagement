/**
 * Demo/mock API layer — intercepts axios requests and returns
 * local data so the app works without a running backend.
 *
 * Data is stored in localStorage and survives page reloads.
 */
import {
  demoUsers, demoPasswords, demoProjects, demoInvoices,
  demoInventory, demoMaintenance,
} from './mockData';

const STORE = {
  projects: 'demo_projects',
  invoices: 'demo_invoices',
  inventory: 'demo_inventory',
  maintenance: 'demo_maintenance',
  users: 'demo_users',
  passwords: 'demo_passwords',
};

// ── helpers ──
function load(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function nextId(list) { return list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1; }

function initStore() {
  // Reset projects if they lack the 'village' field (data upgrade)
  const existingProjects = load(STORE.projects, []);
  if (existingProjects.length && !existingProjects[0].village) {
    save(STORE.projects, demoProjects);
  }

  // Reset maintenance if it lacks the 'amount' field (data upgrade)
  const existingMaint = load(STORE.maintenance, []);
  if (existingMaint.length && existingMaint[0].amount === undefined) {
    save(STORE.maintenance, demoMaintenance);
  }

  if (!localStorage.getItem(STORE.projects)) save(STORE.projects, demoProjects);
  if (!localStorage.getItem(STORE.invoices)) save(STORE.invoices, demoInvoices);
  if (!localStorage.getItem(STORE.inventory)) save(STORE.inventory, demoInventory);
  if (!localStorage.getItem(STORE.maintenance)) save(STORE.maintenance, demoMaintenance);

  // Users + passwords: merge any missing demo users into existing store
  const existingUsers = load(STORE.users, []);
  const existingPws = load(STORE.passwords, {});
  if (!existingUsers.length) {
    save(STORE.users, demoUsers);
    save(STORE.passwords, { ...demoPasswords });
  } else {
    let changed = false;
    const pwCopy = { ...existingPws };
    const usersCopy = [...existingUsers];
    demoUsers.forEach((du) => {
      if (!usersCopy.find((u) => u.email === du.email)) {
        usersCopy.push(du);
        changed = true;
      }
      if (!pwCopy[du.email]) {
        pwCopy[du.email] = demoPasswords[du.email];
        changed = true;
      }
    });
    if (changed) {
      save(STORE.users, usersCopy);
      save(STORE.passwords, pwCopy);
    }
  }
}

function getCurrentUser() {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}
function ok(data) { return { data, status: 200 }; }
function err(status, message) { const e = new Error(message); e.response = { status, data: { message } }; throw e; }

// ── Route handlers ──
function handleAuth(method, path, body) {
  let users = load(STORE.users, demoUsers);
  const passwords = load(STORE.passwords, demoPasswords);
  const idMatch = path.match(/^\/auth\/users\/(\d+)$/);

  if (method === 'post' && path === '/auth/login') {
    const u = users.find((u) => u.email === body.email);
    if (!u || passwords[body.email] !== body.password) err(401, 'Invalid email or password');
    return ok({ token: 'demo-jwt-token-' + u.id, user: u });
  }

  if (method === 'post' && path === '/auth/register') {
    if (users.find((u) => u.email === body.email)) err(400, 'Email already registered');
    const newUser = { id: nextId(users), name: body.name, email: body.email, phone: body.phone || '', role: 'employee', created_at: new Date().toISOString() };
    passwords[body.email] = body.password;
    users.push(newUser);
    save(STORE.users, users);
    save(STORE.passwords, passwords);
    return ok({ message: 'Registration successful' });
  }

  if (method === 'get' && path === '/auth/users') {
    return ok(users);
  }

  // Admin create user with role
  if (method === 'post' && path === '/auth/users') {
    if (users.find((u) => u.email === body.email)) err(400, 'Email already registered');
    const newUser = {
      id: nextId(users), name: body.name, email: body.email,
      phone: body.phone || '', role: body.role || 'employee',
      created_at: new Date().toISOString(),
    };
    passwords[body.email] = body.password || 'solar123';
    users.push(newUser);
    save(STORE.users, users);
    save(STORE.passwords, passwords);
    return ok(newUser);
  }

  // Admin update user
  if (idMatch && method === 'put') {
    const id = Number(idMatch[1]);
    const target = users.find((u) => u.id === id);
    if (!target) err(404, 'User not found');
    // If email changed, update passwords map
    if (body.email && body.email !== target.email) {
      passwords[body.email] = passwords[target.email];
      delete passwords[target.email];
    }
    if (body.password) {
      passwords[body.email || target.email] = body.password;
    }
    users = users.map((u) => (u.id === id ? { ...u, ...body, password: undefined } : u));
    save(STORE.users, users);
    save(STORE.passwords, passwords);
    return ok(users.find((u) => u.id === id));
  }

  // Admin delete user
  if (idMatch && method === 'delete') {
    const id = Number(idMatch[1]);
    const target = users.find((u) => u.id === id);
    if (target) delete passwords[target.email];
    users = users.filter((u) => u.id !== id);
    save(STORE.users, users);
    save(STORE.passwords, passwords);
    return ok({ message: 'Deleted' });
  }

  return null;
}

function handleProjects(method, path, body, params) {
  let projects = load(STORE.projects, demoProjects);
  const idMatch = path.match(/^\/projects\/(\d+)$/);

  if (path === '/projects/dashboard' && method === 'get') {
    const maintenance = load(STORE.maintenance, demoMaintenance);
    return ok({
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'in_progress').length,
      completedProjects: projects.filter((p) => p.status === 'completed').length,
      totalRevenue: projects.reduce((s, p) => s + Number(p.project_cost || 0), 0),
      pendingMaintenance: maintenance.filter((m) => m.status === 'pending').length,
      lowStockItems: load(STORE.inventory, demoInventory).filter((i) => i.quantity <= i.min_stock_level).length,
      // --- chart data ---
      projectsByVillage: Object.entries(
        projects.reduce((acc, p) => { const v = p.village || 'Unknown'; acc[v] = (acc[v] || 0) + 1; return acc; }, {})
      ).map(([village, count]) => ({ village, count })).sort((a, b) => b.count - a.count),

      projectsByMonth: (() => {
        const months = {};
        projects.forEach((p) => {
          const d = p.start_date || p.created_at;
          if (d) { const key = d.slice(0, 7); months[key] = (months[key] || 0) + 1; }
        });
        return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
      })(),

      projectsByStatus: Object.entries(
        projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
      ).map(([status, count]) => ({ status, count })),

      maintenanceByType: Object.entries(
        maintenance.reduce((acc, m) => { const t = m.issue_type || 'other'; acc[t] = (acc[t] || 0) + 1; return acc; }, {})
      ).map(([type, count]) => ({ type, count })),

      maintenanceByStatus: Object.entries(
        maintenance.reduce((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc; }, {})
      ).map(([status, count]) => ({ status, count })),

      maintenanceByPriority: Object.entries(
        maintenance.reduce((acc, m) => { acc[m.priority] = (acc[m.priority] || 0) + 1; return acc; }, {})
      ).map(([priority, count]) => ({ priority, count })),
    });
  }

  if (path === '/projects' && method === 'get') {
    let list = [...projects];
    // Non-admin users only see their own projects
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'admin') {
      list = list.filter((p) => p.created_by === currentUser.id);
    }
    if (params?.status) list = list.filter((p) => p.status === params.status);
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((p) => p.project_name.toLowerCase().includes(s) || p.customer_name.toLowerCase().includes(s));
    }
    return ok(list);
  }

  if (path === '/projects' && method === 'post') {
    const currentUser = getCurrentUser();
    const p = { ...body, id: nextId(projects), created_at: new Date().toISOString(), created_by: currentUser?.id || 1 };
    projects.push(p);
    save(STORE.projects, projects);
    return ok(p);
  }

  if (idMatch && method === 'put') {
    const id = Number(idMatch[1]);
    projects = projects.map((p) => (p.id === id ? { ...p, ...body } : p));
    save(STORE.projects, projects);
    return ok(projects.find((p) => p.id === id));
  }

  if (idMatch && method === 'delete') {
    const id = Number(idMatch[1]);
    projects = projects.filter((p) => p.id !== id);
    save(STORE.projects, projects);
    return ok({ message: 'Deleted' });
  }
  return null;
}

function handleInvoices(method, path, body, params) {
  let invoices = load(STORE.invoices, demoInvoices);
  const idMatch = path.match(/^\/invoices\/(\d+)$/);
  const statusMatch = path.match(/^\/invoices\/(\d+)\/status$/);

  if (path === '/invoices' && method === 'get') {
    let list = [...invoices];
    if (params?.status) list = list.filter((i) => i.status === params.status);
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((i) => i.invoice_number.toLowerCase().includes(s) || (i.customer_name || '').toLowerCase().includes(s));
    }
    return ok(list);
  }

  if (path === '/invoices' && method === 'post') {
    const inv = {
      ...body, id: nextId(invoices),
      invoice_number: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextId(invoices)).padStart(4, '0')}`,
      created_at: new Date().toISOString(),
    };
    invoices.push(inv);
    save(STORE.invoices, invoices);
    return ok(inv);
  }

  if (idMatch && method === 'get') {
    const inv = invoices.find((i) => i.id === Number(idMatch[1]));
    return inv ? ok(inv) : err(404, 'Invoice not found');
  }

  if (statusMatch && method === 'patch') {
    const id = Number(statusMatch[1]);
    invoices = invoices.map((i) => (i.id === id ? { ...i, status: body.status, paid_date: body.paid_date || i.paid_date } : i));
    save(STORE.invoices, invoices);
    return ok(invoices.find((i) => i.id === id));
  }
  return null;
}

function handleInventory(method, path, body, params) {
  let inventory = load(STORE.inventory, demoInventory);
  const idMatch = path.match(/^\/inventory\/(\d+)$/);
  const stockMatch = path.match(/^\/inventory\/(\d+)\/stock$/);

  if (path === '/inventory' && method === 'get') {
    let list = [...inventory];
    if (params?.category) list = list.filter((i) => i.category === params.category);
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((i) => i.item_name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    }
    if (params?.low_stock === 'true') list = list.filter((i) => i.quantity <= i.min_stock_level);
    return ok(list);
  }

  if (path === '/inventory' && method === 'post') {
    const item = { ...body, id: nextId(inventory) };
    inventory.push(item);
    save(STORE.inventory, inventory);
    return ok(item);
  }

  if (stockMatch && method === 'patch') {
    const id = Number(stockMatch[1]);
    inventory = inventory.map((i) => {
      if (i.id !== id) return i;
      const qty = Number(body.quantity) || 0;
      return { ...i, quantity: body.operation === 'add' ? i.quantity + qty : Math.max(0, i.quantity - qty) };
    });
    save(STORE.inventory, inventory);
    return ok(inventory.find((i) => i.id === id));
  }

  if (idMatch && method === 'put') {
    const id = Number(idMatch[1]);
    inventory = inventory.map((i) => (i.id === id ? { ...i, ...body } : i));
    save(STORE.inventory, inventory);
    return ok(inventory.find((i) => i.id === id));
  }

  if (idMatch && method === 'delete') {
    const id = Number(idMatch[1]);
    inventory = inventory.filter((i) => i.id !== id);
    save(STORE.inventory, inventory);
    return ok({ message: 'Deleted' });
  }
  return null;
}

function handleMaintenance(method, path, body, params) {
  let maintenance = load(STORE.maintenance, demoMaintenance);
  const idMatch = path.match(/^\/maintenance\/(\d+)(\/photos)?$/);

  if (path === '/maintenance' && method === 'get') {
    let list = [...maintenance];
    // Non-admin, non-technician users only see their own maintenance requests
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'electrician' && currentUser.role !== 'dwcra') {
      list = list.filter((m) => m.created_by === currentUser.id);
    }
    if (params?.status) list = list.filter((m) => m.status === params.status);
    if (params?.priority) list = list.filter((m) => m.priority === params.priority);
    if (params?.assigned_to) list = list.filter((m) => m.assigned_to === params.assigned_to);
    // Technician role filtering: only see their own assignments (by name)
    if (params?.tech_role === 'electrician' || params?.tech_role === 'dwcra') {
      const techUser = getCurrentUser();
      if (techUser) {
        list = list.filter((m) => m.electrician_name === techUser.name);
      }
    }
    return ok(list);
  }

  if (path === '/maintenance' && method === 'post') {
    const projects = load(STORE.projects, demoProjects);
    const proj = projects.find((p) => p.id === Number(body.project_id));
    const currentUser = getCurrentUser();
    const m = {
      ...body, id: nextId(maintenance),
      project_name: proj?.project_name || '',
      created_by: currentUser?.id || 1,
      created_by_name: currentUser?.name || 'Demo User',
      amount: body.amount || null,
      payment_status: body.payment_status || 'unpaid',
      photo_1: null, photo_2: null,
      created_at: new Date().toISOString(),
    };
    maintenance.push(m);
    save(STORE.maintenance, maintenance);
    return ok(m);
  }

  if (idMatch && method === 'put') {
    const id = Number(idMatch[1]);
    maintenance = maintenance.map((m) => (m.id === id ? { ...m, ...body } : m));
    save(STORE.maintenance, maintenance);
    return ok(maintenance.find((m) => m.id === id));
  }

  // Photo upload (mock — store as data URLs)
  if (idMatch && method === 'post' && path.endsWith('/photos')) {
    const id = Number(idMatch[1]);
    // In demo mode, photos come via FormData; we just mark them as uploaded
    const target = maintenance.find((m) => m.id === id);
    if (target) {
      // Placeholder — real files can’t be stored in localStorage easily
      target.photo_1 = target.photo_1 || 'demo-photo';
      target.photo_2 = target.photo_2 || null;
      maintenance = maintenance.map((m) => (m.id === id ? target : m));
      save(STORE.maintenance, maintenance);
    }
    return ok({ message: 'Photos uploaded (demo)' });
  }

  if (idMatch && method === 'delete') {
    const id = Number(idMatch[1]);
    maintenance = maintenance.filter((m) => m.id !== id);
    save(STORE.maintenance, maintenance);
    return ok({ message: 'Deleted' });
  }
  return null;
}

// ── Main router ──
function route(method, url, body, params) {
  // Strip query string from path and merge into params
  const [rawPath, qs] = url.replace(/^\/api/, '').split('?');
  const path = rawPath;
  if (qs) {
    const sp = new URLSearchParams(qs);
    sp.forEach((v, k) => { if (!(k in params)) params[k] = v; });
  }

  return (
    handleAuth(method, path, body) ||
    handleProjects(method, path, body, params) ||
    handleInvoices(method, path, body, params) ||
    handleInventory(method, path, body, params) ||
    handleMaintenance(method, path, body, params) ||
    err(404, 'Not found')
  );
}

// ── Install mock interceptor on an axios instance ──
export function installMockApi(axiosInstance) {
  initStore();

  axiosInstance.interceptors.request.use(async (config) => {
    const method = (config.method || 'get').toLowerCase();
    const url = (config.url || '').replace(config.baseURL || '', '');
    const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
    const params = config.params || {};

    // Simulate slight network delay
    await new Promise((r) => setTimeout(r, 150));

    const result = route(method, url, body, params);
    // Return an adapter-resolved response so axios thinks the call succeeded
    return {
      ...config,
      adapter: () => Promise.resolve({
        data: result.data,
        status: result.status,
        statusText: 'OK',
        headers: {},
        config,
      }),
    };
  });
}
