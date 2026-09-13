import { useState } from 'react';
import { useData } from '../context/DataContext';
import type { FirmInfo } from '../types';

export default function FirmLogo({ firm, size = 24 }: { firm?: FirmInfo; size?: number }) {
  const { firmInfo } = useData();
  const branding = firm ?? firmInfo;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (branding.logoDataUrl && failedSource !== branding.logoDataUrl) {
    return <img src={branding.logoDataUrl} alt={`${branding.name} logo`} onError={() => setFailedSource(branding.logoDataUrl!)} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
  }
  return <span aria-label={`${branding.name} default logo`} role="img" style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: Math.max(2, size / 12), flexShrink: 0 }}>
    {[0, 1, 2].map(i => <span key={i} style={{ width: size / 6, height: size * (.25 + i * .18), background: 'var(--primary)', borderRadius: 1 }} />)}
  </span>;
}
