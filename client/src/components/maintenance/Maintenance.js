import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { notifyAssignment } from '../../utils/notifications';

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
  amount: '', payment_status: 'unpaid',
};

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRequest);
  const [filter, setFilter] = useState({ status: '', priority: '', assigned_to: '', village: '', taluka: '', district: '' });
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [viewPhotos, setViewPhotos] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'electrician' || user?.role === 'dwcra';

  const fetchRequests = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.assigned_to) params.assigned_to = filter.assigned_to;
      // Technicians only see their assigned work
      if (user?.role === 'electrician') params.tech_role = 'electrician';
      if (user?.role === 'dwcra') params.tech_role = 'dwcra';
      const res = await api.get('/maintenance', { params });
      let list = res.data;
      // Client-side filtering by technician village/taluka/district
      if (filter.village || filter.taluka || filter.district) {
        const allUsers = (await api.get('/auth/users')).data;
        const techMap = {};
        allUsers.forEach((u) => { techMap[u.name] = u; });
        list = list.filter((r) => {
          const tech = techMap[r.electrician_name];
          if (!tech) return false;
          if (filter.village && (tech.village || '') !== filter.village) return false;
          if (filter.taluka && (tech.taluka || '') !== filter.taluka) return false;
          if (filter.district && (tech.district || '') !== filter.district) return false;
          return true;
        });
      }
      setRequests(list);
    } catch (err) { console.error(err); }
  }, [filter, user?.role]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => { fetchTechnicians(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/auth/users');
      setTechnicians(res.data.filter(u => u.role === 'electrician' || u.role === 'dwcra'));
    } catch (err) { console.error(err); }
  };

  // Map assigned_to value to user role
  const roleForAssignedTo = (assigned) => {
    if (assigned === 'local_electrician') return 'electrician';
    if (assigned === 'dwcra_group') return 'dwcra';
    return null;
  };

  const filteredTechnicians = form.assigned_to
    ? technicians.filter(t => t.role === roleForAssignedTo(form.assigned_to))
    : [];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    fetchProjects();
    fetchTechnicians();
    setEditing(null);
    setForm(emptyRequest);
    setPhotos([]);
    setPhotoPreviewUrls([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (req) => {
    fetchProjects();
    fetchTechnicians();
    setEditing(req.id);
    setForm({
      ...req,
      scheduled_date: req.scheduled_date ? req.scheduled_date.split('T')[0] : '',
      completed_date: req.completed_date ? req.completed_date.split('T')[0] : '',
      assigned_to: req.assigned_to || '',
      amount: req.amount || '',
      payment_status: req.payment_status || 'unpaid',
    });
    setPhotos([]);
    setPhotoPreviewUrls([]);
    setError('');
    setShowModal(true);
  };

  const openTechUpdate = (req) => {
    setEditing(req.id);
    setForm({
      ...req,
      scheduled_date: req.scheduled_date ? req.scheduled_date.split('T')[0] : '',
      completed_date: req.completed_date ? req.completed_date.split('T')[0] : '',
      amount: req.amount || '',
      payment_status: req.payment_status || 'unpaid',
    });
    setPhotos([]);
    setPhotoPreviewUrls([]);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/maintenance/${editing}`, form);
        // Upload photos if selected (technician)
        if (photos.length > 0) {
          // Convert to data URLs for demo mode compatibility
          const toDataURL = (file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          const dataUrls = await Promise.all(photos.map(toDataURL));
          // Update record with photo data URLs directly (works in demo + backend)
          await api.put(`/maintenance/${editing}`, {
            ...form,
            photo_1: dataUrls[0] || form.photo_1 || null,
            photo_2: dataUrls[1] || form.photo_2 || null,
          });
          // Also try the dedicated upload endpoint for real backend
          try {
            const formData = new FormData();
            photos.forEach((p) => formData.append('photos', p));
            await api.post(`/maintenance/${editing}/photos`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (_) { /* ignore if mock mode */ }
        }
      } else {
        await api.post('/maintenance', form);
      }
      setShowModal(false);
      // Notify assigned technician(s)
      if (form.assigned_to && form.electrician_name) {
        const project = projects.find(p => String(p.id) === String(form.project_id));
        notifyAssignment({
          assignedTo: form.assigned_to,
          electricianName: form.electrician_name,
          projectName: project?.project_name || '',
          issueType: form.issue_type,
          technicianUsers: technicians,
        });
      }
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
            Submit a maintenance request and get connected with a <strong>Local Electrician</strong> or the <strong>DWCRA Group</strong> service team. Our team will assign the right technician for your needs.
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
        {!isTechnician && (
          <select className="form-control" value={filter.assigned_to}
            onChange={(e) => setFilter({ ...filter, assigned_to: e.target.value })}>
            <option value="">All Teams</option>
            <option value="local_electrician">Local Electrician</option>
            <option value="dwcra_group">DWCRA Group</option>
          </select>
        )}
        {isAdmin && (
          <>
            <select className="form-control" value={filter.district}
              onChange={(e) => setFilter({ ...filter, district: e.target.value, taluka: '', village: '' })}>
              <option value="">All Districts</option>
              {[...new Set(technicians.map((t) => t.district).filter(Boolean))].sort().map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select className="form-control" value={filter.taluka}
              onChange={(e) => setFilter({ ...filter, taluka: e.target.value, village: '' })}>
              <option value="">All Talukas</option>
              {[...new Set(technicians.filter((t) => !filter.district || t.district === filter.district).map((t) => t.taluka).filter(Boolean))].sort().map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select className="form-control" value={filter.village}
              onChange={(e) => setFilter({ ...filter, village: e.target.value })}>
              <option value="">All Villages</option>
              {[...new Set(technicians.filter((t) => (!filter.district || t.district === filter.district) && (!filter.taluka || t.taluka === filter.taluka)).map((t) => t.village).filter(Boolean))].sort().map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </>
        )}
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
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Scheduled</th>
                {isAdmin && <th>Address</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={isAdmin ? 11 : (isTechnician ? 9 : 10)} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No maintenance requests</td></tr>
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
                        {req.assigned_to === 'dwcra_group' && '🏢 DWCRA Group'}
                        {!req.assigned_to && <span style={{ color: '#94a3b8' }}>Unassigned</span>}
                        {req.electrician_name && <div style={{ fontSize: 12, color: '#64748b' }}>{req.electrician_name}</div>}
                      </td>
                    )}
                    <td>{req.amount ? `₹${Number(req.amount).toLocaleString()}` : '-'}</td>
                    <td>
                      {req.payment_status === 'paid'
                        ? <span className="badge badge-completed">Paid</span>
                        : <span className="badge badge-pending">{req.amount ? 'Unpaid' : '-'}</span>}
                    </td>
                    <td><span className={`badge badge-${req.status}`}>{req.status.replace('_', ' ')}</span></td>
                    <td>{req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString() : '-'}</td>
                    {isAdmin && <td style={{ fontSize: 12 }}>{(() => {
                      const tech = technicians.find(t => t.name === req.electrician_name);
                      if (!tech) return '-';
                      return [tech.street, tech.village, tech.taluka, tech.district, tech.state].filter(Boolean).join(', ') || '-';
                    })()}</td>}
                    <td>
                      <div className="action-buttons">
                        {isTechnician ? (
                          <button className="btn btn-outline btn-sm" onClick={() => openTechUpdate(req)}>Update</button>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(req)}>
                            {isAdmin ? 'Manage' : 'Edit'}
                          </button>
                        )}
                        {isAdmin && (req.photo_1 || req.photo_2) && (
                          <button className="btn btn-outline btn-sm" onClick={() => setViewPhotos(req)}
                            title="View Photos">📷</button>
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
                    {/* Amount & Payment — read-only for technician */}
                    <div className="form-group">
                      <label>Amount</label>
                      <input type="text" className="form-control" value={form.amount ? `₹${Number(form.amount).toLocaleString()}` : 'Not set'} disabled />
                    </div>
                    <div className="form-group">
                      <label>Payment Status</label>
                      <input type="text" className="form-control" value={form.payment_status === 'paid' ? 'Paid' : 'Unpaid'} disabled />
                    </div>
                    {/* Photo Upload — max 2 */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Upload Photos (max 2)</label>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                        className="form-control"
                        onChange={(e) => {
                          const files = Array.from(e.target.files).slice(0, 2);
                          setPhotos(files);
                          setPhotoPreviewUrls(files.map(f => URL.createObjectURL(f)));
                        }} />
                      {photoPreviewUrls.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                          {photoPreviewUrls.map((url, i) => (
                            <img key={i} src={url} alt={`Preview ${i + 1}`}
                              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                          ))}
                        </div>
                      )}
                      {(form.photo_1 || form.photo_2) && photoPreviewUrls.length === 0 && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                          {[form.photo_1, form.photo_2].filter(Boolean).length} photo(s) already uploaded
                        </div>
                      )}
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
                  <select name="assigned_to" className="form-control" value={form.assigned_to}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updates = { assigned_to: val, electrician_name: '', electrician_phone: '' };
                      if (val && form.status === 'pending') updates.status = 'assigned';
                      setForm({ ...form, ...updates });
                    }}>
                    <option value="">Select service provider</option>
                    <option value="local_electrician">⚡ Local Electrician</option>
                    <option value="dwcra_group">🏢 DWCRA Group</option>
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
                      <select name="electrician_name" className="form-control"
                        value={form.electrician_name}
                        onChange={(e) => {
                          const selected = filteredTechnicians.find(t => t.name === e.target.value);
                          setForm({
                            ...form,
                            electrician_name: e.target.value,
                            electrician_phone: selected?.phone || '',
                          });
                        }}>
                        <option value="">Select technician</option>
                        {filteredTechnicians.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                      {!form.assigned_to && (
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Select "Connect With" first</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Electrician Phone</label>
                      <input type="tel" name="electrician_phone" className="form-control"
                        value={form.electrician_phone} readOnly
                        style={{ background: '#f8fafc' }} />
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
                    {/* Admin: Amount & Payment Status */}
                    <div className="form-group">
                      <label>Amount (₹)</label>
                      <input type="number" name="amount" className="form-control"
                        value={form.amount} onChange={handleChange}
                        placeholder="e.g. 5000" min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Payment Status</label>
                      <select name="payment_status" className="form-control" value={form.payment_status} onChange={handleChange}>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {/* Admin: View uploaded photos */}
                    {editing && (form.photo_1 || form.photo_2) && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Uploaded Photos</label>
                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                          {[form.photo_1, form.photo_2].filter(Boolean).map((url, i) => (
                            <img key={i} src={url} alt={`Maintenance photo ${i + 1}`}
                              style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                              onClick={() => window.open(url, '_blank')} />
                          ))}
                        </div>
                      </div>
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

      {/* Photo Viewer Modal (admin) */}
      {viewPhotos && (
        <div className="modal-overlay" onClick={() => setViewPhotos(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Photos — Request #{viewPhotos.id}</h2>
              <button className="modal-close" onClick={() => setViewPhotos(null)}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 16, padding: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[viewPhotos.photo_1, viewPhotos.photo_2].filter(Boolean).map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i + 1}`}
                  style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => window.open(url, '_blank')} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
