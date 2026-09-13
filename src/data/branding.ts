export const MAX_LOGO_BYTES = 512 * 1024;

// Uploaded raster images travel with snapshots; no external URL is required.
export function validateLogo(value: unknown): void {
  if (value === undefined || value === '') return;
  if (typeof value !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error('Choose a PNG, JPEG or WebP logo.');
  }
  const encoded = value.slice(value.indexOf(',') + 1);
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  if (encoded.length % 4 !== 0 || encoded.length / 4 * 3 - padding > MAX_LOGO_BYTES) {
    throw new Error('The logo must be 512 KB or smaller.');
  }
}
