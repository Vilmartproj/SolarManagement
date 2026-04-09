import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const issueTypes = [
  { value: 'panel_cleaning', label: 'Panel Cleaning' },
  { value: 'inverter_repair', label: 'Inverter Repair' },
  { value: 'wiring_issue', label: 'Wiring Issue' },
  { value: 'performance_drop', label: 'Performance Drop' },
  { value: 'physical_damage', label: 'Physical Damage' },
  { value: 'other', label: 'Other' },
];

const emptyRequest = {
  project_id: '', issue_type: 'panel_cleaning', description: '',
  priority: 'medium', assigned_to: '', electrician_name: '',
  electrician_phone: '', scheduled_date: '', status: 'pending',
  completed_date: '', resolution_notes: '',
};

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRequest);
  const [filter, setFilter] = useState({ status: '', priority: '', assigned_to: '' });
  const [error, setError] = useState('');
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'electrician' || user?.role === 'dwaraka';

  const fetchRequests = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.assigned_to) params.assigned_to = filter.assigned_to;
      // Technicians only see their assigned work
      if (user?.role === 'electrician') params.tech_role = 'electrician';
      if (user?.role === 'dwaraka') params.tech_role = 'dwaraka';
      const res = await api.get('/maintenance', { params });
      setRequests(res.data);
    } catch (err) { console.error(err); }
  }, [filter, user?.role]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    fetchProjects();
    setEditing(null);
    setForm(emptyRequest);
    setError('');
    setShowModal(true);
  };

  const openEdit = (req) => {
    fetchProjects();
    setEditing(req.id);
    setForm({
      ...req,
      scheduled_date: req.scheduled_date ? req.scheduled_date.split('T')[0] : '',
      completed_date: req.completed_date ? req.completed_date.split('T')[0] : '',
      assigned_to: req.assigned_to || '',
    });
    setError('');
    setShowModal(true);
  };

  const openTechUpdate = (req) => {
    setEditing(req.id);
    setForm({
      ...req,
      scheduled_date: req.scheduled_date ? req.scheduled_date.split('T')[0] : '',
      completed_date: req.completed_date ? req.completed_date.split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/maintenance/${editing}`, form);
      } else {
        await api.post('/maintenance', form);
      }
      setShowModal(false);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance request?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchRequests();
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🛠️ {isTechnician ? 'My Assigned Work' : 'Maintenance Requests'}</h1>
        {!isTechnician && <button className="btn btn-primary" onClick={openCreate}>+ New Request</button>}
      </div>

      {/* Info Banner */}
      {!isTechnician && (
        <div className="card" style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Need help with your solar system?</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Submit a maintenance request and get connected with a <strong>Local Electrician</strong> or the <strong>Dwaraka Group</strong> service team. Our team will assign the right technician for your needs.
          </p>
        </div>
      )}

      {isTechnician && (
        <div className="card" style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Welcome, {user?.name}</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Below are the maintenance requests assigned to you. You can update the status and add resolution notes.
          </p>
        </div>
      )}

      <div className="filters-bar">
        <select className="form-control" value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="form-control" value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select className="form-control" value={filter.assigned_to}
          onChange={(e) => setFilter({ ...filter, assigned_to: e.target.value })}>
          <option value="">All Teams</option>
          <option value="local_electrician">Local Electrician</option>
          <option value="dwaraka_group">Dwaraka Group</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Project</th>
                <th>Issue Type</th>
                <th>Priority</th>
                {!isTechnician && <th>Assigned To</th>}
                <th>Status</th>
                <th>Scheduled</th>
                {isAdmin && <th>Requested By</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={isAdmin ? 9 : (isTechnician ? 7 : 8)} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No maintenance requests</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td>#{req.id}</td>
                    <td>{req.project_name || '-'}</td>
                    <td>{issueTypes.find(t => t.value === req.issue_type)?.label}</td>
                    <td><span className={`badge badge-${req.priority}`}>{req.priority}</span></td>
                    {!isTechnician && (
                      <td>
                        {req.assigned_to === 'local_electrician' && '⚡ Local Electrician'}
                        {req.assigned_to === 'dwaraka_group' && '🏢 Dwaraka Group'}
                        {!req.assigned_to && <span style={{ color: '#94a3b8' }}>Unassigned</span>}
                        {req.electrician_name && <div style={{ fontSize: 12, color: '#64748b' }}>{req.electrician_name}</div>}
                      </td>
                    )}
                    <td><span className={`badge badge-${req.status}`}>{req.status.replace('_', ' ')}</span></td>
                    <td>{req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString() : '-'}</td>
                    {isAdmin && <td>{req.requested_by_name}</td>}
                    <td>
                      <div className="action-buttons">
                        {isTechnician ? (
                          <button className="btn btn-outline btn-sm" onClick={() => openTechUpdate(req)}>Update</button>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(req)}>
                            {isAdmin ? 'Manage' : 'Edit'}
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(req.id)}>🗑️</button>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isTechnician ? 'Update Work Status' : (editing ? (isAdmin ? 'Manage Request' : 'Edit Request') : 'New Maintenance Request')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Technician update view — show read-only details + editable status/notes */}
                {isTechnician ? (
                  <>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Project</label>
                      <input type="text" className="form-control" value={form.project_name || 'N/A'} disabled />
                    </div>
                    <div className="form-group">
                      <label>Issue Type</label>
                      <input type="text" className="form-control"
                        value={issueTypes.find(t => t.value === form.issue_type)?.label || form.issue_type} disabled />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <input type="text" className="form-control" value={form.priority} disabled />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Description</label>
                      <textarea className="form-control" value={form.description} disabled />
                    </div>
                    <div className="form-group">
                      <label>Status *</label>
                      <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Scheduled Date</label>
                      <input type="date" name="scheduled_date" className="form-control"
                        value={form.scheduled_date} onChange={handleChange} />
                    </div>
                    {form.status === 'completed' && (
                      <div className="form-group">
                        <label>Completed Date</label>
                        <input type="date" name="completed_date" className="form-control"
                          value={form.completed_date} onChange={handleChange} />
                      </div>
                    )}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Resolution Notes</label>
                      <textarea name="resolution_notes" className="form-control"
                        value={form.resolution_notes || ''} onChange={handleChange}
                        placeholder="Describe work done, parts replaced, etc." />
                    </div>
                  </>
                ) : (
                  <>
                {/* Standard employee/admin form */}
                <div className="form-group">
                  <label>Project</label>
                  <select name="project_id" className="form-control" value={form.project_id} onChange={handleChange}>
                    <option value="">Select project (optional)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Issue Type *</label>
                  <select name="issue_type" className="form-control" value={form.issue_type}
                    onChange={handleChange} required>
                    {issueTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" className="form-control" value={form.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Connect With *</label>
                  <select name="assigned_to" className="form-control" value={form.assigned_to} onChange={handleChange}>
                    <option value="">Select service provider</option>
                    <option value="local_electrician">⚡ Local Electrician</option>
                    <option value="dwaraka_group">🏢 Dwaraka Group</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description *</label>
                  <textarea name="description" className="form-control" value={form.description}
                    onChange={handleChange} required placeholder="Describe the issue in detail..." />
                </div>

                {/* Admin-only fields */}
                {isAdmin && (
                  <>
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Electrician Name</label>
                      <input type="text" name="electrician_name" className="form-control"
                        value={form.electrician_name} onChange={handleChange}
                        placeholder="Assigned technician name" />
                    </div>
                    <div className="form-group">
                      <label>Electrician Phone</label>
                      <input type="tel" name="electrician_phone" className="form-control"
                        value={form.electrician_phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Scheduled Date</label>
                      <input type="date" name="scheduled_date" className="form-control"
                        value={form.scheduled_date} onChange={handleChange} />
                    </div>
                    {editing && (
                      <>
                        <div className="form-group">
                          <label>Completed Date</label>
                          <input type="date" name="completed_date" className="form-control"
                            value={form.completed_date} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Resolution Notes</label>
                          <textarea name="resolution_notes" className="form-control"
                            value={form.resolution_notes} onChange={handleChange} />
                        </div>
                      </>
                    )}
                  </>
                )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update' : 'Submit'} Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
