import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'employee', label: 'Employee' },
  { value: 'electrician', label: 'Local Electrician' },
  { value: 'dwcra', label: 'DWCRA Group' },
];

const roleBadge = (role) => {
  const map = { admin: 'paid', employee: 'sent', electrician: 'in_progress', dwcra: 'assigned' };
  return map[role] || 'sent';
};

const emptyUser = { name: '', email: '', phone: '', role: 'employee', password: '', street: '', village: '', taluka: '', district: '', state: '' };

function formatAddress(u) {
  const parts = [u.street, u.village, u.taluka, u.district, u.state].filter(Boolean);
  return parts.length ? parts.join(', ') : '-';
}

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [filter, setFilter] = useState({ role: '', village: '', taluka: '', district: '' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUser);
    setError('');
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: u.password || '', street: u.street || '', village: u.village || '', taluka: u.taluka || '', district: u.district || '', state: u.state || '' });
    setError('');
    setShowPass(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editing}`, payload);
      } else {
        if (!form.password) { setError('Password is required for new users'); return; }
        await api.post('/auth/users', form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err) { alert('Failed to delete'); }
  };

  const filtered = users.filter((u) => {
    if (filter.role && u.role !== filter.role) return false;
    if (filter.village && (u.village || '') !== filter.village) return false;
    if (filter.taluka && (u.taluka || '') !== filter.taluka) return false;
    if (filter.district && (u.district || '') !== filter.district) return false;
    return true;
  });

  const uniqueVals = (key) => [...new Set(users.map((u) => u[key]).filter(Boolean))].sort();

  const districtOptions = uniqueVals('district');
  const talukaOptions = [...new Set(
    users.filter((u) => !filter.district || u.district === filter.district).map((u) => u.taluka).filter(Boolean)
  )].sort();
  const villageOptions = [...new Set(
    users.filter((u) => (!filter.district || u.district === filter.district) && (!filter.taluka || u.taluka === filter.taluka)).map((u) => u.village).filter(Boolean)
  )].sort();

  return (
    <div>
      <div className="page-header">
        <h1>👥 User Management</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New User</button>
      </div>

      <div className="filters-bar">
        <select className="form-control" value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })}>
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select className="form-control" value={filter.district} onChange={(e) => setFilter({ ...filter, district: e.target.value, taluka: '', village: '' })}>
          <option value="">All Districts</option>
          {districtOptions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="form-control" value={filter.taluka} onChange={(e) => setFilter({ ...filter, taluka: e.target.value, village: '' })}>
          <option value="">All Talukas</option>
          {talukaOptions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="form-control" value={filter.village} onChange={(e) => setFilter({ ...filter, village: e.target.value })}>
          <option value="">All Villages</option>
          {villageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${roleBadge(u.role)}`}>
                      {roles.find((r) => r.value === u.role)?.label || u.role}
                    </span></td>
                    <td>{u.phone || '-'}</td>
                    <td>{formatAddress(u)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
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
              <h2>{editing ? 'Edit User' : 'Create User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" className="form-control"
                    value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" className="form-control"
                    value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" className="form-control"
                    value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {(form.role === 'electrician' || form.role === 'dwcra') && (
                  <>
                    <div className="form-group">
                      <label>Street</label>
                      <input type="text" name="street" className="form-control"
                        value={form.street} onChange={handleChange} placeholder="Street / Door No" />
                    </div>
                    <div className="form-group">
                      <label>Village</label>
                      <input type="text" name="village" className="form-control"
                        value={form.village} onChange={handleChange} placeholder="Village" />
                    </div>
                    <div className="form-group">
                      <label>Taluka</label>
                      <input type="text" name="taluka" className="form-control"
                        value={form.taluka} onChange={handleChange} placeholder="Taluka / Mandal" />
                    </div>
                    <div className="form-group">
                      <label>District</label>
                      <input type="text" name="district" className="form-control"
                        value={form.district} onChange={handleChange} placeholder="District" />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input type="text" name="state" className="form-control"
                        value={form.state} onChange={handleChange} placeholder="State" />
                    </div>
                  </>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{editing ? 'Password' : 'Password *'}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password" className="form-control"
                      value={form.password} onChange={handleChange}
                      minLength={editing ? 0 : 6}
                      required={!editing}
                      placeholder={editing ? 'Current password shown — edit to change' : 'Min 6 characters'}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b', padding: 0,
                      }}
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {editing && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Showing current password — modify and save to change it</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
