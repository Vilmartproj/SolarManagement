import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const emptyProject = {
  project_name: '', customer_name: '', customer_email: '', customer_phone: '',
  village_name: '', site_address: '', system_size_kw: '', panel_type: '', panel_count: '',
  inverter_type: '', inverter_count: '', project_cost: '', status: 'planning',
  start_date: '', expected_completion: '', actual_completion: '', notes: '',
  images: [],
};

const MAX_IMAGES = 5;

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [error, setError] = useState('');
  const [viewImages, setViewImages] = useState(null);
  const isAdmin = user?.role === 'admin';

  const fetchProjects = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      const res = await api.get('/projects', { params });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => { setEditing(null); setForm(emptyProject); setError(''); setShowModal(true); };

  const openEdit = (project) => {
    setEditing(project.id);
    setForm({
      ...project,
      images: project.images || [],
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      expected_completion: project.expected_completion ? project.expected_completion.split('T')[0] : '',
      actual_completion: project.actual_completion ? project.actual_completion.split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/projects/${editing}`, form);
      } else {
        await api.post('/projects', form);
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - (form.images || []).length;
    if (remaining <= 0) return;
    const toProcess = files.slice(0, remaining);

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) { alert('Each image must be under 5 MB'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), { name: file.name, data: ev.target.result }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
      </div>

      <div className="filters-bar">
        <input
          type="text" className="form-control" placeholder="Search projects..."
          value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        <select className="form-control" value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Customer</th>
                <th>Village</th>
                <th>Size (kW)</th>
                {isAdmin && <th>Cost (₹)</th>}
                <th>Photos</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No projects found</td></tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.project_name}</td>
                    <td>{p.customer_name}</td>
                    <td>{p.village_name || '-'}</td>
                    <td>{p.system_size_kw}</td>
                    {isAdmin && <td>{p.project_cost ? `₹${Number(p.project_cost).toLocaleString()}` : '-'}</td>}
                    <td>
                      {(p.images && p.images.length > 0) ? (
                        <button className="btn btn-outline btn-sm" onClick={() => setViewImages(p)}>
                          📷 {p.images.length}
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>None</span>
                      )}
                    </td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                    <td>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Project' : 'New Project'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input type="text" name="project_name" className="form-control"
                    value={form.project_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input type="text" name="customer_name" className="form-control"
                    value={form.customer_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Customer Email</label>
                  <input type="email" name="customer_email" className="form-control"
                    value={form.customer_email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Customer Phone</label>
                  <input type="tel" name="customer_phone" className="form-control"
                    value={form.customer_phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Village Name</label>
                  <input type="text" name="village_name" className="form-control"
                    value={form.village_name} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Site Address *</label>
                  <textarea name="site_address" className="form-control"
                    value={form.site_address} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>System Size (kW) *</label>
                  <input type="number" step="0.01" name="system_size_kw" className="form-control"
                    value={form.system_size_kw} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Panel Type</label>
                  <input type="text" name="panel_type" className="form-control"
                    value={form.panel_type} onChange={handleChange} placeholder="e.g., Mono PERC 540W" />
                </div>
                <div className="form-group">
                  <label>Panel Count</label>
                  <input type="number" name="panel_count" className="form-control"
                    value={form.panel_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Inverter Type</label>
                  <input type="text" name="inverter_type" className="form-control"
                    value={form.inverter_type} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Inverter Count</label>
                  <input type="number" name="inverter_count" className="form-control"
                    value={form.inverter_count} onChange={handleChange} />
                </div>
                {isAdmin && (
                  <div className="form-group">
                    <label>Project Cost (₹)</label>
                    <input type="number" step="0.01" name="project_cost" className="form-control"
                      value={form.project_cost} onChange={handleChange} />
                  </div>
                )}
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="start_date" className="form-control"
                    value={form.start_date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Expected Completion</label>
                  <input type="date" name="expected_completion" className="form-control"
                    value={form.expected_completion} onChange={handleChange} />
                </div>
                {editing && (
                  <div className="form-group">
                    <label>Actual Completion</label>
                    <input type="date" name="actual_completion" className="form-control"
                      value={form.actual_completion} onChange={handleChange} />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea name="notes" className="form-control"
                    value={form.notes} onChange={handleChange} />
                </div>

                {/* ── Image Upload ── */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Project Photos (up to {MAX_IMAGES})</label>
                  <div className="project-images-upload">
                    <div className="project-images-grid">
                      {(form.images || []).map((img, idx) => (
                        <div key={idx} className="project-image-thumb">
                          <img src={img.data} alt={img.name} />
                          <button type="button" className="project-image-remove" onClick={() => removeImage(idx)} title="Remove">✕</button>
                          <span className="project-image-name">{img.name}</span>
                        </div>
                      ))}
                      {(form.images || []).length < MAX_IMAGES && (
                        <label className="project-image-add">
                          <input type="file" accept="image/*" multiple onChange={handleImageAdd}
                            style={{ display: 'none' }} />
                          <span className="project-image-add-icon">📷</span>
                          <span>Add Photo</span>
                          <span className="project-image-add-count">{(form.images || []).length}/{MAX_IMAGES}</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Image Viewer Modal ── */}
      {viewImages && (
        <div className="modal-overlay" onClick={() => setViewImages(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>📷 {viewImages.project_name} — Photos</h2>
              <button className="modal-close" onClick={() => setViewImages(null)}>×</button>
            </div>
            <div className="project-images-viewer">
              {viewImages.images.map((img, idx) => (
                <div key={idx} className="project-image-view">
                  <img src={img.data} alt={img.name} />
                  <span>{img.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
