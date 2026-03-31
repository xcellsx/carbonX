import React, { useMemo, useState } from 'react';
import { SASB_FBFR_FIELDS, loadSasbInputs, saveSasbInputs } from '../../utils/sasb';

const SasbInputs = () => {
  const initial = useMemo(() => loadSasbInputs(), []);
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState('');

  const handleChange = (key, value) => {
    setSaved('');
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveSasbInputs(form);
    setSaved('SASB inputs saved. New reports will include a SASB index.');
  };

  return (
    <form className="form" onSubmit={handleSave}>
      <div className="sub-header">
        <div className="header-col">
          <p className="descriptor-medium">SASB Inputs (FB-FR)</p>
          <p className="small-regular">Food Retailers & Distributors metrics for audit-ready reporting.</p>
        </div>
      </div>

      {SASB_FBFR_FIELDS.map((f) => (
        <div className="input-group-col" key={f.key} style={{ marginBottom: '0.75rem' }}>
          <label className="normal-bold" htmlFor={f.key}>
            {f.code} - {f.label}
          </label>
          <input
            className="input-base"
            id={f.key}
            type="text"
            placeholder={f.unit}
            value={form[f.key] || ''}
            onChange={(e) => handleChange(f.key, e.target.value)}
          />
        </div>
      ))}

      {saved && <div className="submit-success">{saved}</div>}
      <button type="submit" className="default" style={{ marginTop: '1rem' }}>
        Save SASB Inputs
      </button>
    </form>
  );
};

export default SasbInputs;

