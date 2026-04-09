import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'employee', label: 'Employee' },
  { value: 'electrician', label: 'Local Electrician' },
  { value: 'dwaraka', label: 'Dwaraka Group' },
];

const roleBadge = (role) => {
  const map = { admin: 'paid', employee: 'sent', electrician: 'in_progress', dwaraka: 'assigned' };
  return map[role] || 'sent';
};

const emptyUser = { name: '', email: '', phone: '', role: 'employee', password: '' };

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

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
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '' });
    setError('');
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

  const filtered = filter ? users.filter((u) => u.role === filter) : users;

  return (
    <div>
      <div className="page-header">
        <h1>👥 User Management</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New User</button>
      </div>

      <div className="filters-bar">
        <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${roleBadge(u.role)}`}>
                      {roles.find((r) => r.value === u.role)?.label || u.role}
                    </span></td>
                    <td>{u.phone || '-'}</td>
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
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{editing ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input type="password" name="password" className="form-control"
                    value={form.password} onChange={handleChange}
                    minLength={editing ? 0 : 6}
                    required={!editing}
                    placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'} />
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
