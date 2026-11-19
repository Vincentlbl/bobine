import { apiFetch } from './client';

// Les 5 opérations CRUD du journal + les statistiques.

export async function fetchEntries() {
  const data = await apiFetch('/entries');
  return data.items;
}

// Renvoie l'entrée du journal pour ce film, ou null s'il n'y est pas.
export async function fetchEntryForMovie(movieId) {
  const data = await apiFetch(`/entries?movieId=${movieId}`);
  return data.items[0] || null;
}

export function createEntry(entry) {
  return apiFetch('/entries', { method: 'POST', body: entry });
}

export function updateEntry(id, changes) {
  return apiFetch(`/entries/${id}`, { method: 'PATCH', body: changes });
}

export function deleteEntry(id) {
  return apiFetch(`/entries/${id}`, { method: 'DELETE' });
}

export function fetchStats() {
  return apiFetch('/entries/stats');
}
