/**
 * Client API pour le backend Laravel.
 * Remplace complètement `src/lib/supabase.ts` et l'usage de `@supabase/supabase-js`.
 *
 * Variable d'environnement attendue dans .env :
 *   VITE_API_URL=https://api.tondomaine.com/api
 */

const API_URL = import.meta.env.VITE_API_URL as string;

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Delai maximum : une requete qui ne repond pas ne doit jamais laisser
  // l'interface tourner dans le vide.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new ApiError('Le serveur met trop de temps a repondre. Reessayez dans un instant.', 0);
    }
    throw new ApiError('Connexion au serveur impossible. Verifiez votre connexion.', 0);
  } finally {
    clearTimeout(timer);
  }

  // 401 = token invalide/expiré : on nettoie côté client
  if (response.status === 401) {
    setToken(null);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      data?.message || (response.status === 413 ? 'Image trop volumineuse.' : 'Une erreur est survenue.'),
      response.status,
      data?.errors
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
