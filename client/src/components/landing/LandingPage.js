import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo, { LogoEditButton } from '../shared/Logo';
import './LandingPage.css';

const STORAGE_KEY = 'solart_landing_content';

const menuItems = [
  { label: 'Home', href: '#hero' },
  { label: 'Services', href: '#services' },
  { label: 'Trends', href: '#trends' },
  // { label: 'Why Solar', href: '#why-solar' },
  { label: 'Projects', href: '#projects' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

const defaultContent = {
  hero: {
    badge: '🌍 Powering a Sustainable Future',
    title: 'Harness the Power of Sun for Your Home & Business',
    subtitle: 'End-to-end solar solutions — from design and installation to monitoring and maintenance. Trusted by 500+ customers across India.',
  },
  stats: [
    { value: '500+', label: 'Projects Completed' },
    { value: '50MW+', label: 'Capacity Installed' },
    { value: '₹12Cr+', label: 'Customer Savings' },
    { value: '98%', label: 'Satisfaction Rate' },
  ],
  services: [
    { icon: '🏠', title: 'Residential Solar', desc: 'Rooftop installations for homes with net metering and 25-year warranty panels.' },
    { icon: '🏭', title: 'Commercial Solar', desc: 'Large-scale solar plants for factories, offices and commercial buildings.' },
    { icon: '🔧', title: 'Maintenance & AMC', desc: 'Annual maintenance contracts with local electricians and Dwaraka Group.' },
    { icon: '🔋', title: 'Battery Storage', desc: 'Hybrid & off-grid systems with lithium-ion battery backup solutions.' },
    { icon: '📊', title: 'Energy Audit', desc: 'Complete energy consumption analysis and custom solar design.' },
    { icon: '📋', title: 'Subsidy Assistance', desc: 'End-to-end help with government solar subsidies and documentation.' },
  ],
  trends: [
    { tag: '2026 Trend', title: 'AI-Powered Solar Monitoring', desc: 'Machine learning algorithms now predict panel degradation, optimize tilt angles in real-time, and forecast energy generation with 98% accuracy.', image: '🤖' },
    { tag: 'Innovation', title: 'Perovskite-Silicon Tandem Cells', desc: 'Next-gen tandem solar cells are crossing 33% efficiency in commercial production — a 40% jump over traditional silicon.', image: '⚡' },
    { tag: 'Sustainability', title: 'Agrivoltaics — Solar + Farming', desc: 'Dual-use land with elevated solar panels allowing crops to grow underneath. Boosting farm income while generating clean energy.', image: '🌾' },
    { tag: 'Storage', title: 'Sodium-Ion Batteries', desc: 'Affordable, fire-safe sodium-ion batteries are replacing lithium for home storage at 60% lower cost.', image: '🔋' },
    { tag: 'Smart Grid', title: 'Vehicle-to-Grid (V2G) Integration', desc: 'EV owners now sell stored solar energy back to the grid during peak hours, turning cars into mobile power banks.', image: '🚗' },
    { tag: 'Design', title: 'Building-Integrated Photovoltaics', desc: 'Solar roof tiles, facades, and windows are replacing traditional panels — turning entire buildings into power plants.', image: '🏗️' },
  ],
  benefits: [
    { title: 'Slash Electricity Bills', desc: 'Reduce your monthly electricity bill by up to 90%. With net metering, sell excess power back to the grid.' },
    { title: 'Government Subsidies', desc: 'Get up to 40% subsidy under PM Surya Ghar scheme for residential installations up to 3kW.' },
    { title: '25-Year Returns', desc: 'Solar panels last 25+ years with minimal maintenance. ROI typically achieved within 3-5 years.' },
    { title: 'Increase Property Value', desc: 'Homes with solar sell for 4-6% more. It\'s an investment that appreciates while saving you money.' },
    { title: 'Energy Independence', desc: 'With battery storage, say goodbye to power cuts. Generate, store, and use your own clean energy.' },
    { title: 'Reduce Carbon Footprint', desc: 'A 5kW system prevents ~7 tonnes of CO₂ per year — equivalent to planting 350 trees annually.' },
  ],
  showcases: [
    { icon: '🏠', tag: 'Residential', title: '10kW Rooftop — Hyderabad', desc: '20 Mono PERC panels with hybrid inverter and 10kWh lithium battery backup.', stat: 'Bill reduced: ₹6,500 → ₹150/month' },
    { icon: '🏭', tag: 'Commercial', title: '100kW Solar Plant — Vizag', desc: 'Ground-mounted system for a textile factory with real-time monitoring dashboard.', stat: 'ROI achieved in 3.2 years' },
    { icon: '🏥', tag: 'Institutional', title: '50kW + Battery — Hospital', desc: 'Critical backup for operation theaters with 20kWh storage and auto-switchover.', stat: 'Zero power cuts in 2 years' },
  ],
  testimonials: [
    { name: 'Rajesh Kumar', role: 'Homeowner, Hyderabad', text: 'Our electricity bill dropped from ₹8,000 to ₹200/month. The team handled everything from permits to installation seamlessly.' },
    { name: 'Priya Sharma', role: 'Factory Owner, Vizag', text: 'We installed 100kW on our factory roof. ROI came in 3.5 years instead of the projected 5. Excellent service and monitoring.' },
    { name: 'Dr. Anand Rao', role: 'Hospital Director', text: 'The battery backup solution keeps our critical systems running 24/7. Maintenance team from Dwaraka Group responds within hours.' },
  ],
  contact: {
    title: 'Ready to Go Solar?',
    subtitle: 'Get a free site survey and custom solar proposal. Our team will design the perfect system for your needs.',
    phone: '+91 98765 43210',
    email: 'info@cherieshpower.in',
    address: 'Plot 42, Jubilee Hills',
    city: 'Hyderabad, Telangana 500033',
  },
};

function loadContent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return defaultContent;
}

// ── Edit button shown only to logged-in users ──
function EditBtn({ onClick, label }) {
  return (
    <button className="landing-edit-btn" onClick={onClick} title={`Edit ${label}`}>
      ✏️ Edit {label}
    </button>
  );
}

// ── Generic edit modal ──
function EditModal({ title, children, onSave, onCancel }) {
  return (
    <div className="landing-edit-overlay" onClick={onCancel}>
      <div className="landing-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="landing-edit-modal-header">
          <h3>Edit {title}</h3>
          <button className="landing-edit-close" onClick={onCancel}>✕</button>
        </div>
        <div className="landing-edit-modal-body">{children}</div>
        <div className="landing-edit-modal-footer">
          <button className="landing-edit-cancel" onClick={onCancel}>Cancel</button>
          <button className="landing-edit-save" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── List editor (for services, trends, benefits, showcases, testimonials, stats) ──
function ListEditor({ items, fields, onChange }) {
  const update = (idx, field, value) => {
    const copy = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(copy);
  };
  const addItem = () => {
    const empty = {};
    fields.forEach((f) => (empty[f.key] = ''));
    onChange([...items, empty]);
  };
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="landing-list-editor">
      {items.map((item, idx) => (
        <div key={idx} className="landing-list-editor-item">
          <div className="landing-list-editor-item-header">
            <span className="landing-list-editor-number">#{idx + 1}</span>
            <button className="landing-list-editor-remove" onClick={() => removeItem(idx)}>🗑️ Remove</button>
          </div>
          {fields.map((f) => (
            <label key={f.key} className="landing-edit-label">
              {f.label}
              {f.type === 'textarea' ? (
                <textarea value={item[f.key] || ''} onChange={(e) => update(idx, f.key, e.target.value)} rows={3} />
              ) : (
                <input type="text" value={item[f.key] || ''} onChange={(e) => update(idx, f.key, e.target.value)} />
              )}
            </label>
          ))}
        </div>
      ))}
      <button className="landing-list-editor-add" onClick={addItem}>+ Add Item</button>
    </div>
  );
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [content, setContent] = useState(loadContent);
  const [editing, setEditing] = useState(null); // which section is being edited
  const [draft, setDraft] = useState(null);     // draft copy while editing

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  const isDev = user?.email === 'dev@solar.com';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileMenu(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const saveContent = useCallback((updated) => {
    setContent(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const openEdit = (section) => {
    setEditing(section);
    setDraft(JSON.parse(JSON.stringify(content)));
  };

  const cancelEdit = () => { setEditing(null); setDraft(null); };

  const saveEdit = () => {
    saveContent(draft);
    setEditing(null);
    setDraft(null);
  };

  const resetToDefaults = () => {
    saveContent(defaultContent);
  };

  return (
    <div className="landing">
      {/* ===== Navbar ===== */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#hero" className="nav-logo" onClick={() => scrollTo('#hero')}>
            <Logo size={100} />
            <span className="nav-brand-text">
              <span className="nav-brand-name">Cheriesh</span>
              <span className="nav-brand-sub">Power Technologies</span>
            </span>
          </a>
          {isDev && <LogoEditButton />}

          <div className={`nav-menu ${mobileMenu ? 'open' : ''}`}>
            {menuItems.map((item) => (
              <a key={item.href} href={item.href} className="nav-menu-link"
                onClick={(e) => { e.preventDefault(); scrollTo(item.href); }}>
                {item.label}
              </a>
            ))}
            <Link to={user ? '/dashboard' : '/login'} className="nav-cta-btn">
              {user ? 'Dashboard' : 'Login / Register'}
            </Link>
            {user && (
              <button className="nav-logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            )}
          </div>

          <button className="nav-hamburger" onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ===== Admin edit toolbar (admin only) ===== */}
      {isAdmin && (
        <div className="landing-edit-toolbar">
          <span>✏️ Edit Mode — Click any section's edit button to modify content</span>
          <button className="landing-reset-btn" onClick={resetToDefaults}>↩️ Reset All to Defaults</button>
        </div>
      )}

      {/* ===== Hero ===== */}
      <section id="hero" className="hero-section">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <div className="hero-content">
          {isAdmin && <EditBtn onClick={() => openEdit('hero')} label="Hero" />}
          <span className="hero-badge">{content.hero.badge}</span>
          <h1>
            {content.hero.title.includes('Power of Sun')
              ? <>Harness the <span className="text-gradient">Power of Sun</span> for Your Home & Business</>
              : content.hero.title}
          </h1>
          <p>{content.hero.subtitle}</p>
          <div className="hero-buttons">
            <Link to={user ? '/projects' : '/login'} className="btn-landing btn-landing-primary">
              Get Started →
            </Link>
            <a href="#services" className="btn-landing btn-landing-outline"
              onClick={(e) => { e.preventDefault(); scrollTo('#services'); }}>
              Explore Services
            </a>
          </div>
          <div className="hero-stats">
            {content.stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section id="services" className="section">
        <div className="section-container">
          {isAdmin && <EditBtn onClick={() => openEdit('services')} label="Services" />}
          <span className="section-tag">What We Offer</span>
          <h2 className="section-title">Complete Solar Solutions</h2>
          <p className="section-subtitle">From rooftop installations to large-scale solar farms — we handle everything.</p>
          <div className="services-grid">
            {content.services.map((s, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Trends ===== */}
      <section id="trends" className="section section-dark">
        <div className="section-container">
          {isAdmin && <EditBtn onClick={() => openEdit('trends')} label="Trends" />}
          <span className="section-tag tag-light">🔥 What's New in 2026</span>
          <h2 className="section-title" style={{ color: 'white' }}>Solar Industry Trends</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>
            The solar industry is evolving fast. Here are the breakthroughs shaping the future.
          </p>
          <div className="trends-grid">
            {content.trends.map((t, i) => (
              <div key={i} className="trend-card">
                <div className="trend-icon">{t.image}</div>
                <span className="trend-tag">{t.tag}</span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Why Solar ===== */}
      <section id="why-solar" className="section">
        <div className="section-container">
          {isAdmin && <EditBtn onClick={() => openEdit('benefits')} label="Benefits" />}
          <span className="section-tag">Why Go Solar?</span>
          <h2 className="section-title">Benefits That Pay for Themselves</h2>
          <div className="benefits-grid">
            {content.benefits.map((b, i) => (
              <div key={i} className="benefit-card">
                <div className="benefit-number">{String(i + 1).padStart(2, '0')}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Projects Showcase ===== */}
      <section id="projects" className="section section-alt">
        <div className="section-container">
          {isAdmin && <EditBtn onClick={() => openEdit('showcases')} label="Projects" />}
          <span className="section-tag">Our Work</span>
          <h2 className="section-title">Recent Installations</h2>
          <div className="projects-showcase">
            {content.showcases.map((s, i) => (
              <div key={i} className="showcase-card">
                <div className="showcase-img">{s.icon}</div>
                <div className="showcase-info">
                  <span className="showcase-tag">{s.tag}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <span className="showcase-stat">{s.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section id="testimonials" className="section">
        <div className="section-container">
          {isAdmin && <EditBtn onClick={() => openEdit('testimonials')} label="Testimonials" />}
          <span className="section-tag">Client Stories</span>
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-grid">
            {content.testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p>"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact / CTA ===== */}
      <section id="contact" className="section section-cta">
        <div className="section-container" style={{ textAlign: 'center' }}>
          {isAdmin && <EditBtn onClick={() => openEdit('contact')} label="Contact" />}
          <h2 style={{ fontSize: 36, color: 'white', marginBottom: 16 }}>{content.contact.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
            {content.contact.subtitle}
          </p>
          <div className="cta-buttons">
            <Link to={user ? '/projects' : '/login'} className="btn-landing btn-landing-white">
              Start Your Project →
            </Link>
            <Link to={user ? '/maintenance' : '/login'} className="btn-landing btn-landing-outline-white">
              Request Maintenance
            </Link>
          </div>
          <div className="cta-contact-info">
            <span>📞 {content.contact.phone}</span>
            <span>📧 {content.contact.email}</span>
            <span>📍 {content.contact.city}</span>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3><Logo size={24} /> Cheriesh Power Technologies</h3>
              <p>End-to-end solar solutions for homes, businesses, and institutions. Partnered with Dwaraka Group for maintenance excellence.</p>
            </div>
            <div>
              <h4>Quick Links</h4>
              <a href="#services" onClick={(e) => { e.preventDefault(); scrollTo('#services'); }}>Services</a>
              <a href="#trends" onClick={(e) => { e.preventDefault(); scrollTo('#trends'); }}>Trends</a>
              <a href="#why-solar" onClick={(e) => { e.preventDefault(); scrollTo('#why-solar'); }}>Why Solar</a>
              <a href="#projects" onClick={(e) => { e.preventDefault(); scrollTo('#projects'); }}>Projects</a>
            </div>
            <div>
              <h4>Portal</h4>
              <Link to="/login">Employee Login</Link>
              <Link to="/login">Admin Login</Link>
              <Link to={user ? '/maintenance' : '/login'}>Maintenance Request</Link>
              <Link to={user ? '/projects' : '/login'}>Submit Project</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <span>📞 {content.contact.phone}</span>
              <span>📧 {content.contact.email}</span>
              <span>📍 {content.contact.address}</span>
              <span>{content.contact.city}</span>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Cheriesh Power Technologies. All rights reserved. | Powered by Clean Energy</p>
          </div>
        </div>
      </footer>

      {/* ===== EDIT MODALS ===== */}

      {editing === 'hero' && draft && (
        <EditModal title="Hero Section" onSave={saveEdit} onCancel={cancelEdit}>
          <label className="landing-edit-label">
            Badge Text
            <input type="text" value={draft.hero.badge}
              onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, badge: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            Main Title
            <input type="text" value={draft.hero.title}
              onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            Subtitle
            <textarea rows={3} value={draft.hero.subtitle}
              onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })} />
          </label>
          <h4 style={{ marginTop: 16 }}>Stats</h4>
          <ListEditor
            items={draft.stats}
            fields={[
              { key: 'value', label: 'Value', type: 'text' },
              { key: 'label', label: 'Label', type: 'text' },
            ]}
            onChange={(stats) => setDraft({ ...draft, stats })}
          />
        </EditModal>
      )}

      {editing === 'services' && draft && (
        <EditModal title="Services" onSave={saveEdit} onCancel={cancelEdit}>
          <ListEditor
            items={draft.services}
            fields={[
              { key: 'icon', label: 'Icon (emoji)', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
            onChange={(services) => setDraft({ ...draft, services })}
          />
        </EditModal>
      )}

      {editing === 'trends' && draft && (
        <EditModal title="Trends" onSave={saveEdit} onCancel={cancelEdit}>
          <ListEditor
            items={draft.trends}
            fields={[
              { key: 'image', label: 'Icon (emoji)', type: 'text' },
              { key: 'tag', label: 'Tag Label', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
            onChange={(trends) => setDraft({ ...draft, trends })}
          />
        </EditModal>
      )}

      {editing === 'benefits' && draft && (
        <EditModal title="Benefits" onSave={saveEdit} onCancel={cancelEdit}>
          <ListEditor
            items={draft.benefits}
            fields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
            onChange={(benefits) => setDraft({ ...draft, benefits })}
          />
        </EditModal>
      )}

      {editing === 'showcases' && draft && (
        <EditModal title="Project Showcases" onSave={saveEdit} onCancel={cancelEdit}>
          <ListEditor
            items={draft.showcases}
            fields={[
              { key: 'icon', label: 'Icon (emoji)', type: 'text' },
              { key: 'tag', label: 'Tag (e.g. Residential)', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
              { key: 'stat', label: 'Key Stat', type: 'text' },
            ]}
            onChange={(showcases) => setDraft({ ...draft, showcases })}
          />
        </EditModal>
      )}

      {editing === 'testimonials' && draft && (
        <EditModal title="Testimonials" onSave={saveEdit} onCancel={cancelEdit}>
          <ListEditor
            items={draft.testimonials}
            fields={[
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'role', label: 'Role / Location', type: 'text' },
              { key: 'text', label: 'Testimonial', type: 'textarea' },
            ]}
            onChange={(testimonials) => setDraft({ ...draft, testimonials })}
          />
        </EditModal>
      )}

      {editing === 'contact' && draft && (
        <EditModal title="Contact Section" onSave={saveEdit} onCancel={cancelEdit}>
          <label className="landing-edit-label">
            Heading
            <input type="text" value={draft.contact.title}
              onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, title: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            Subtitle
            <textarea rows={2} value={draft.contact.subtitle}
              onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, subtitle: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            Phone
            <input type="text" value={draft.contact.phone}
              onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            Email
            <input type="text" value={draft.contact.email}
              onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            Address Line
            <input type="text" value={draft.contact.address}
              onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })} />
          </label>
          <label className="landing-edit-label">
            City
            <input type="text" value={draft.contact.city}
              onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, city: e.target.value } })} />
          </label>
        </EditModal>
      )}
    </div>
  );
}
