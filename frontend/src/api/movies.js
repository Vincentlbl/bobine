import { apiFetch } from './client';

// Construit "?q=...&genre=..." en ignorant les valeurs vides.
function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function fetchMovies({ q, genre, sort, page, limit = 24 }) {
  return apiFetch(`/movies${toQueryString({ q, genre, sort, page, limit })}`);
}

export function fetchMovie(id) {
  return apiFetch(`/movies/${id}`);
}

export async function fetchGenres() {
  const data = await apiFetch('/genres');
  return data.items;
}
