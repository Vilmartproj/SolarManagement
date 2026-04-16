import React, { useState, useEffect, useCallback } from 'react';

const LOGO_KEY = 'cheriesh_custom_logo';

function getCustomLogo() {
  try { return localStorage.getItem(LOGO_KEY); } catch { return null; }
}

export function setCustomLogo(dataUrl) {
  if (dataUrl) localStorage.setItem(LOGO_KEY, dataUrl);
  else localStorage.removeItem(LOGO_KEY);
  window.dispatchEvent(new Event('logo-changed'));
}

function DefaultSvg({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M50 8 A42 42 0 1 1 15 72" stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M35 62 Q35 78 38 82 Q40 85 50 85 Q60 85 62 82 Q65 78 65 62 Q65 50 75 38 Q72 20 50 16 Q28 20 25 38 Q35 50 35 62Z" fill="url(#bulbGrad)" />
      <path d="M38 58 Q30 48 32 38 Q36 42 42 50 Q44 44 40 34 Q48 38 48 50Z" fill="#2ecc40" />
      <path d="M62 58 Q70 48 68 38 Q64 42 58 50 Q56 44 60 34 Q52 38 52 50Z" fill="#2ecc40" />
      <rect x="48" y="50" width="4" height="16" rx="2" fill="#27ae60" />
      <path d="M50 36 Q44 28 50 20 Q56 28 50 36Z" fill="#2ecc40" />
      <path d="M50 36 Q42 32 38 26" stroke="#27ae60" strokeWidth="1.5" fill="none" />
      <path d="M50 36 Q58 32 62 26" stroke="#27ae60" strokeWidth="1.5" fill="none" />
      <rect x="40" y="82" width="20" height="4" rx="2" fill="#bbb" />
      <rect x="42" y="87" width="16" height="3" rx="1.5" fill="#ccc" />
      <defs>
        <linearGradient id="bulbGrad" x1="50" y1="16" x2="50" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8f5e9" />
          <stop offset="100%" stopColor="#c8e6c9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Logo({ size = 100 }) {
  const [custom, setCustom] = useState(getCustomLogo);

  useEffect(() => {
    const handler = () => setCustom(getCustomLogo());
    window.addEventListener('logo-changed', handler);
    return () => window.removeEventListener('logo-changed', handler);
  }, []);

  if (custom) {
    return <img src={custom} alt="Logo" width={size} height={size} style={{ verticalAlign: 'middle', flexShrink: 0, objectFit: 'contain', borderRadius: 8 }} />;
  }
  return <DefaultSvg size={size} />;
}

export function LogoEditButton() {
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState(getCustomLogo);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const save = () => {
    setCustomLogo(preview);
    setShow(false);
  };

  const removeLogo = () => {
    setPreview(null);
    setCustomLogo(null);
    setShow(false);
  };

  return (
    <>
      <button
        onClick={() => { setPreview(getCustomLogo()); setShow(true); }}
        style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontSize: 12, marginTop: 6 }}
      >
        ✏️ Edit Logo
      </button>

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Update Logo</h2>
              <button className="modal-close" onClick={() => setShow(false)}>×</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {preview ? (
                <img src={preview} alt="Preview" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
              ) : (
                <DefaultSvg size={100} />
              )}
            </div>

            <div className="form-group">
              <label>Upload new logo (PNG, JPG — max 2 MB)</label>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleFile} className="form-control" />
            </div>

            <div className="modal-footer">
              {preview && (
                <button className="btn btn-outline btn-sm" onClick={removeLogo}>Reset to Default</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save}>Save Logo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
