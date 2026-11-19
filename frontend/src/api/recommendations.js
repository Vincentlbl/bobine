import { apiFetch } from './client';

// Recommandations calculées par l'API à partir du journal du compte connecté.
// Réponse : { basedOn: 'journal' | 'popular', likedGenres: [...], items: [...] }
export function fetchRecommendations(limit = 12) {
  return apiFetch(`/recommendations?limit=${limit}`);
}
