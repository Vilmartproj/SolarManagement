import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const emptyItem = { description: '', quantity: 1, unit_price: '' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    project_id: '', customer_name: '', customer_email: '',
    customer_address: '', tax_rate: 18, due_date: '', notes: '',
    items: [{ ...emptyItem }],
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      const res = await api.get('/invoices', { params });
      setInvoices(res.data);
    } catch (err) { console.error(err); }
  }, [filter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    fetchProjects();
    setForm({
      project_id: '', customer_name: '', customer_email: '',
      customer_address: '', tax_rate: 18, due_date: '', notes: '',
      items: [{ ...emptyItem }],
    });
    setError('');
    setShowCreate(true);
  };

  const handleProjectChange = (e) => {
    const pid = e.target.value;
    const project = projects.find(p => String(p.id) === pid);
    setForm({
      ...form,
      project_id: pid,
      customer_name: project?.customer_name || '',
      customer_email: project?.customer_email || '',
      customer_address: project?.site_address || '',
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, items: updated });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const removeItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const getSubtotal = () => form.items.reduce((s, item) => s + (item.quantity * item.unit_price || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/invoices', form);
      setShowCreate(false);
      fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  const viewInvoice = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setShowView(res.data);
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/invoices/${id}/status`, { status, paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null });
      fetchInvoices();
      if (showView) viewInvoice(id);
    } catch (err) { console.error(err); }
  };

  const subtotal = getSubtotal();
  const taxAmount = (subtotal * (form.tax_rate || 18)) / 100;

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New Invoice</button>
      </div>

      <div className="filters-bar">
        <input type="text" className="form-control" placeholder="Search invoices..."
          value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
        <select className="form-control" value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No invoices found</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>{inv.invoice_number}</td>
                    <td>{inv.project_name}</td>
                    <td>{inv.customer_name}</td>
                    <td>₹{Number(inv.total_amount).toLocaleString()}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" onClick={() => viewInvoice(inv.id)}>View</button>
                        {inv.status === 'draft' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateStatus(inv.id, 'sent')}>Send</button>
                        )}
                        {(inv.status === 'sent' || inv.status === 'overdue') && (
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(inv.id, 'paid')}>Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Create Invoice</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project *</label>
                  <select className="form-control" value={form.project_id} onChange={handleProjectChange} required>
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name} - {p.customer_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input type="text" className="form-control" value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Customer Email</label>
                  <input type="email" className="form-control" value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="form-control" value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Customer Address</label>
                  <textarea className="form-control" value={form.customer_address}
                    onChange={(e) => setForm({ ...form, customer_address: e.target.value })} />
                </div>
              </div>

              <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 16 }}>Invoice Items</h3>
              <table style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ width: 80 }}>Qty</th>
                    <th style={{ width: 120 }}>Unit Price</th>
                    <th style={{ width: 120 }}>Total</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td><input type="text" className="form-control" value={item.description}
                        onChange={(e) => handleItemChange(i, 'description', e.target.value)} required /></td>
                      <td><input type="number" className="form-control" value={item.quantity} min="1"
                        onChange={(e) => handleItemChange(i, 'quantity', parseInt(e.target.value) || 0)} /></td>
                      <td><input type="number" className="form-control" value={item.unit_price} step="0.01"
                        onChange={(e) => handleItemChange(i, 'unit_price', parseFloat(e.target.value) || 0)} required /></td>
                      <td style={{ fontWeight: 500, padding: '12px 16px' }}>₹{((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}</td>
                      <td><button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>

              <div className="invoice-totals" style={{ marginTop: 16 }}>
                <div className="total-row"><span>Subtotal:</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="total-row">
                  <span>Tax ({form.tax_rate}%):</span><span>₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="total-row grand-total"><span>Total:</span><span>₹{(subtotal + taxAmount).toLocaleString()}</span></div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showView && (
        <div className="modal-overlay" onClick={() => setShowView(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Invoice {showView.invoice_number}</h2>
              <button className="modal-close" onClick={() => setShowView(null)}>×</button>
            </div>
            <div className="invoice-preview">
              <div className="invoice-header">
                <div>
                  <h2 style={{ color: '#1e3a5f' }}>☀️ Solar Management</h2>
                  <p style={{ color: '#64748b', fontSize: 14 }}>Solar Installation & Maintenance</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3>INVOICE</h3>
                  <p>{showView.invoice_number}</p>
                  <p><span className={`badge badge-${showView.status}`}>{showView.status}</span></p>
                </div>
              </div>

              <div className="invoice-details-grid">
                <div>
                  <strong>Bill To:</strong><br />
                  {showView.customer_name}<br />
                  {showView.customer_email && <>{showView.customer_email}<br /></>}
                  {showView.customer_address}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Date:</strong> {new Date(showView.created_at).toLocaleDateString()}</p>
                  <p><strong>Due:</strong> {showView.due_date ? new Date(showView.due_date).toLocaleDateString() : '-'}</p>
                  <p><strong>Project:</strong> {showView.project_name}</p>
                </div>
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {showView.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>₹{Number(item.unit_price).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(item.total_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals">
                <div className="total-row"><span>Subtotal:</span><span>₹{Number(showView.subtotal).toLocaleString()}</span></div>
                <div className="total-row"><span>Tax ({showView.tax_rate}%):</span><span>₹{Number(showView.tax_amount).toLocaleString()}</span></div>
                <div className="total-row grand-total"><span>Total:</span><span>₹{Number(showView.total_amount).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print</button>
              <button className="btn btn-outline" onClick={() => setShowView(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
