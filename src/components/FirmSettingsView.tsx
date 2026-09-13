import FirmBrandingEditor from './FirmBrandingEditor';
import FirmLogo from './FirmLogo';
import DemoDataTools from './DemoDataTools';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Toast } from './shared';

export default function FirmSettingsView() {
  const { firmInfo, updateFirmInfo } = useData();
  const [draft, setDraft] = useState({ ...firmInfo });
  const [editing, setEditing] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const f = (key: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft(d => ({ ...d, [key]: e.target.value }));

  const handleSave = () => { try { updateFirmInfo(draft); } catch (e) { showToast((e as Error).message); return; } setEditing(false); showToast('Firm information updated.'); };
  const handleDiscard = () => { setDraft({ ...firmInfo }); setEditing(false); };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 780 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px' }}>Firm Settings</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: 0 }}>
              Legal information, contact details, and regulatory identifiers
            </p>
          </div>
          {!editing
            ? <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
            : <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={handleDiscard}>Discard</button>
                <button className="btn-primary" disabled={logoLoading} onClick={handleSave}>Save Changes</button>
              </div>
          }
        </div>

        <DemoDataTools />
        <FirmBrandingEditor key={String(editing)} draft={draft} editing={editing} onChange={setDraft} onBusyChange={setLogoLoading} />
        {/* Status badge */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 3, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FirmLogo firm={draft} size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>{draft.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{draft.legalName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${draft.status === 'active' ? 'badge-green' : 'badge-red'}`}>{draft.status}</span>
            <div style={{ marginTop: 4, fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>
              Founded {draft.foundedYear} · AUM {draft.aum}
            </div>
          </div>
        </div>

        {/* Sections */}
        {[
          {
            title: 'General Information',
            fields: [
              { key: 'legalName',   label: 'Legal Name',      half: true  },
              { key: 'foundedYear', label: 'Founded Year',    half: true  },
              { key: 'aum',         label: 'AUM',             half: true  },
            ],
          },
          {
            title: 'Contact & Address',
            fields: [
              { key: 'address', label: 'Street Address', half: false },
              { key: 'city',    label: 'City',           half: true  },
              { key: 'state',   label: 'State',          half: true  },
              { key: 'zip',     label: 'ZIP Code',       half: true  },
              { key: 'country', label: 'Country',        half: true  },
              { key: 'phone',   label: 'Phone',          half: true  },
              { key: 'email',   label: 'Email',          half: true  },
              { key: 'website', label: 'Website',        half: false },
            ],
          },
          {
            title: 'Regulatory',
            fields: [
              { key: 'crd',             label: 'FINRA CRD Number',    half: true  },
              { key: 'ein',             label: 'EIN / Tax ID',         half: true  },
              { key: 'licenseType',     label: 'License Type',         half: true  },
              { key: 'regulatoryBody',  label: 'Regulatory Body',      half: true  },
            ],
          },
        ].map(section => (
          <div key={section.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 14 }}>
            <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{section.title}</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {section.fields.map(field => (
                <div key={field.key} style={field.half ? {} : { gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    value={draft[field.key as keyof typeof draft] as string}
                    onChange={f(field.key as keyof typeof draft)}
                    disabled={!editing}
                    style={!editing ? { opacity: 0.7 } : {}}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Toast message={toast} />
    </div>
  );
}
