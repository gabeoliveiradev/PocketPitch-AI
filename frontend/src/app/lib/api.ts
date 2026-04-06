// Dynamically resolve API URL so it works from any device on the network
// (phone via IP, PC via localhost)
export const API_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
