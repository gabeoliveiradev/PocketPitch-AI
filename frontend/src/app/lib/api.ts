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
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
