import { loadSession } from './session';

// Erreur renvoyée par l'API, au format du contrat :
// { "error": { "code": "...", "message": "..." } }
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// AuthContext s'enregistre ici pour être prévenu quand le jeton est refusé
// (expiré, par exemple) et déconnecter l'utilisateur.
let onSessionExpired = () => {};
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

// Point de passage unique de TOUS les appels à l'API :
// ajoute le jeton, envoie le JSON, et transforme les erreurs en ApiError.
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const session = loadSession();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "Impossible de joindre le serveur. Vérifie ta connexion.");
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && session?.token) onSessionExpired();
    throw new ApiError(
      response.status,
      data?.error?.code || 'UNKNOWN_ERROR',
      data?.error?.message || 'Une erreur est survenue.'
    );
  }
  return data;
}
