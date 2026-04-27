import { useState } from 'react';

const EMPTY = { first_name: '', last_name: '', email: '', company: '', property_address: '', city: '', state: '' };

export default function AddLeadModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim()) errs.last_name = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.company.trim()) errs.company = 'Required';
    if (!form.property_address.trim()) errs.property_address = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (!form.state.trim()) errs.state = 'Required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd(form);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add New Lead</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="John" />
                {errors.first_name && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.first_name}</span>}
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Smith" />
                {errors.last_name && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.last_name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" />
              {errors.email && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Realty Group" />
              {errors.company && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.company}</span>}
            </div>

            <div className="form-group">
              <label>Property Address</label>
              <input value={form.property_address} onChange={e => set('property_address', e.target.value)} placeholder="123 Main St" />
              {errors.property_address && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.property_address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Austin" />
                {errors.city && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} />
                {errors.state && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.state}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent-light">Add Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
}
