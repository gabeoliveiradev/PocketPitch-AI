// In production, API_URL is empty so requests go through the Next.js rewrite
// proxy (/api/* → backend). This keeps cookies same-site (fixes Safari ITP).
// In local dev without Docker, fallback to same hostname on port 8000.
function resolveApiUrl(): string {
  // Server-side rendering or build-time — use env var or localhost
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // Client-side in production — use empty string (proxy via Next.js rewrites)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return '';
  }

  // Client-side in local dev — direct connection to backend
  return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export const API_URL = resolveApiUrl();

export const QUICK_ACTIONS = [
  'Criar Pitch 30s',
  'Dica de Quebra-gelo',
  'Contornar Objeção de Preço',
  'Resumo do Cliente',
];

/**
 * Wrapper around fetch that always includes credentials and the API base URL.
 * Handles common errors like parsing JSON failures from HTML error pages.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; data: any; status: number }> {
  try {
    const url = `${API_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // When proxied, relative requests are same-origin. 
      // Defaults to 'same-origin' if not set, which is safer for Safari.
      credentials: options.credentials || 'include',
    });

    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      // Handle cases where the server returns HTML errors (502, 504, 403, etc.)
      const text = await res.text();
      data = { error: `Resposta inesperada: ${res.status} ${res.statusText}` };
      console.warn('Backend returned non-JSON response:', text.slice(0, 500));
    }

    return { ok: res.ok, data, status: res.status };
  } catch (err) {
    console.error('apiFetch error:', err);
    return { 
      ok: false, 
      data: { error: 'O navegador bloqueou a conexão ou o servidor está offline.' },
      status: 0 
    };
  }
}
