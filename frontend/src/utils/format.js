// Date du jour au format attendu par l'API : "YYYY-MM-DD" (heure locale).
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// "2026-11-14" -> "14 novembre 2026"
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// 175 -> "2 h 55"
export function formatRuntime(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = String(minutes % 60).padStart(2, '0');
  return hours > 0 ? `${hours} h ${rest}` : `${minutes} min`;
}

// 22439 -> "22 439"
export function formatCount(number) {
  return number.toLocaleString('fr-FR');
}

// 8.5 -> "8,5"
export function formatRating(number) {
  return number.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
