import { useEffect, useRef, useState } from 'react';
import type { FirmInfo } from '../types';
import FirmLogo from './FirmLogo';
import { MAX_LOGO_BYTES, validateLogo } from '../data/branding';

export default function FirmBrandingEditor({ draft, editing, onChange, onBusyChange }: { draft: FirmInfo; editing: boolean; onChange: React.Dispatch<React.SetStateAction<FirmInfo>>; onBusyChange: (busy: boolean) => void }) {
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current++; onBusyChange(false); }, [onBusyChange]);
  const readLogo = async (file: File) => {
    const token = ++request.current;
    setError('');
    onBusyChange(true);
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP logo.');
      if (file.size > MAX_LOGO_BYTES) throw new Error('The logo must be 512 KB or smaller.');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('The logo file could not be read.'));
        reader.readAsDataURL(file);
      });
      validateLogo(dataUrl);
      const image = new Image(); image.src = dataUrl;
      await image.decode().catch(() => { throw new Error('This file is not a readable image. Choose another logo.'); });
      if (request.current === token) onChange(current => ({ ...current, logoDataUrl: dataUrl }));
    } catch (e) { if (request.current === token) setError((e as Error).message); }
    finally { if (request.current === token) onBusyChange(false); }
  };
  return <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, padding: 18, marginBottom: 14 }}>
    <h2 style={{ fontSize: '.85rem', fontWeight: 600 }}>Firm Branding</h2>
    <p className="demo-note">Set the name and logo shown on sign-in, registration and in the sidebar. Save Changes applies this branding throughout the demo.</p>
    <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--muted-foreground)' }}>Firm Name
      <input required maxLength={100} value={draft.name} disabled={!editing} onChange={e => onChange({ ...draft, name: e.target.value })} style={{ marginTop: 6 }} />
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 4, padding: 12 }}><FirmLogo firm={draft} size={64} /></div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <label style={{ display: 'block', fontSize: '.75rem' }}>Upload firm logo
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!editing} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void readLogo(file); }} style={{ marginTop: 6 }} />
        </label>
        <p className="demo-note" style={{ marginBottom: 8 }}>PNG, JPEG or WebP, up to 512 KB. A transparent square logo works best in both themes.</p>
        {draft.logoDataUrl && <button className="btn-secondary" disabled={!editing} onClick={() => { request.current++; onBusyChange(false); setError(''); onChange({ ...draft, logoDataUrl: '' }); }}>Use default logo</button>}
      </div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
