// La session (jeton JWT + utilisateur) est gardée dans le localStorage du
// navigateur : elle survit à un rechargement de la page.
// Compromis à connaître : un script malveillant injecté dans la page (faille XSS)
// pourrait lire ce jeton. C'est pour cela qu'il expire (2 h par défaut) ;
// l'alternative plus sûre, mais plus complexe, est un cookie httpOnly.
const STORAGE_KEY = 'bobine.session';

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
