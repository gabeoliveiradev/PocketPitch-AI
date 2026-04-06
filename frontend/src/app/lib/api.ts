// In production, NEXT_PUBLIC_API_URL must point to the Render backend.
// In local dev, fallback to same hostname on port 8000 (works with LAN/mobile).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : 'http://localhost:8000');

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
