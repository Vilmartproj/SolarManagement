import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const emptyItem = {
  item_name: '', category: 'panel', sku: '', quantity: 0,
  min_stock_level: 10, unit_price: '', supplier: '', location: '', description: '',
};

const categories = [
  { value: 'panel', label: 'Solar Panel' },
  { value: 'inverter', label: 'Inverter' },
  { value: 'battery', label: 'Battery' },
  { value: 'mounting', label: 'Mounting Structure' },
  { value: 'wire', label: 'Wire & Cable' },
  { value: 'connector', label: 'Connector' },
  { value: 'other', label: 'Other' },
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [filter, setFilter] = useState({ category: '', search: '', low_stock: false });
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.search) params.search = filter.search;
      if (filter.low_stock) params.low_stock = 'true';
      const res = await api.get('/inventory', { params });
      setItems(res.data);
    } catch (err) { console.error(err); }
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => { setEditing(null); setForm(emptyItem); setError(''); setShowModal(true); };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm(item);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/inventory/${editing}`, form);
      } else {
        await api.post('/inventory', form);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      fetchItems();
    } catch (err) { alert('Failed to delete'); }
  };

  const handleStockUpdate = async (id, operation) => {
    const qty = prompt(`Enter quantity to ${operation}:`);
    if (!qty || isNaN(qty)) return;
    try {
      await api.patch(`/inventory/${id}/stock`, { quantity: parseInt(qty), operation });
      fetchItems();
    } catch (err) { alert('Failed to update stock'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Item</button>
      </div>

      <div className="filters-bar">
        <input type="text" className="form-control" placeholder="Search inventory..."
          value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
        <select className="form-control" value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <input type="checkbox" checked={filter.low_stock}
            onChange={(e) => setFilter({ ...filter, low_stock: e.target.checked })} />
          Low Stock Only
        </label>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Min Level</th>
                <th>Unit Price</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No items found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                    <td>{categories.find(c => c.value === item.category)?.label}</td>
                    <td>{item.sku || '-'}</td>
                    <td className={item.quantity <= item.min_stock_level ? 'low-stock' : ''}>
                      {item.quantity}
                      {item.quantity <= item.min_stock_level && ' ⚠️'}
                    </td>
                    <td>{item.min_stock_level}</td>
                    <td>{item.unit_price ? `₹${Number(item.unit_price).toLocaleString()}` : '-'}</td>
                    <td>{item.supplier || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-success btn-sm" onClick={() => handleStockUpdate(item.id, 'add')}>+</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStockUpdate(item.id, 'subtract')}>-</button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
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
              <h2>{editing ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input type="text" name="item_name" className="form-control"
                    value={form.item_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" className="form-control" value={form.category} onChange={handleChange} required>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input type="text" name="sku" className="form-control"
                    value={form.sku} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" name="quantity" className="form-control"
                    value={form.quantity} onChange={handleChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Min Stock Level</label>
                  <input type="number" name="min_stock_level" className="form-control"
                    value={form.min_stock_level} onChange={handleChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Unit Price (₹)</label>
                  <input type="number" name="unit_price" className="form-control" step="0.01"
                    value={form.unit_price} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input type="text" name="supplier" className="form-control"
                    value={form.supplier} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" className="form-control"
                    value={form.location} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea name="description" className="form-control"
                    value={form.description} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'} Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
