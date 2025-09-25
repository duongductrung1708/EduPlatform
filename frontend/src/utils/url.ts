import { API_BASE_URL } from '../api/client';

// Resolve possibly-relative file URLs (like /uploads/xyz) to absolute backend URL
export function resolveFileUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    // Absolute URL already
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch {}
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

function getExtensionFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const pathname = u.pathname || '';
    const idx = pathname.lastIndexOf('.');
    if (idx >= 0) return pathname.substring(idx + 1).toLowerCase();
  } catch {
    const qIdx = url.indexOf('?');
    const clean = qIdx >= 0 ? url.substring(0, qIdx) : url;
    const idx2 = clean.lastIndexOf('.');
    if (idx2 >= 0) return clean.substring(idx2 + 1).toLowerCase();
  }
  return undefined;
}

// Build a viewer URL (Office Online or Google Docs Viewer) for common document formats
export function buildViewerUrl(rawUrl?: string): string | undefined {
  const resolved = resolveFileUrl(rawUrl);
  if (!resolved) return undefined;
  const ext = getExtensionFromUrl(resolved) || '';
  const officeExts = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
  const googleExts = new Set(['odt', 'ods', 'odp', 'rtf', 'txt', 'csv']);
  const encoded = encodeURIComponent(resolved);
  if (officeExts.has(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  }
  if (googleExts.has(ext)) {
    return `https://docs.google.com/gview?embedded=true&url=${encoded}`;
  }
  return undefined;
}


