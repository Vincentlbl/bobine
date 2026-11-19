// Le catalogue public est en anglais : on traduit les genres pour l'affichage.
// La valeur anglaise reste celle envoyée à l'API (?genre=Sci-Fi).
const GENRE_LABELS = {
  Action: 'Action',
  Adventure: 'Aventure',
  Animation: 'Animation',
  Biography: 'Biographie',
  Comedy: 'Comédie',
  Crime: 'Policier',
  Documentary: 'Documentaire',
  Drama: 'Drame',
  Family: 'Famille',
  Fantasy: 'Fantastique',
  'Film-Noir': 'Film noir',
  History: 'Histoire',
  Horror: 'Horreur',
  Music: 'Musique',
  Musical: 'Comédie musicale',
  Mystery: 'Mystère',
  News: 'Actualités',
  Romance: 'Romance',
  'Sci-Fi': 'Science-fiction',
  Short: 'Court-métrage',
  Sport: 'Sport',
  'Talk-Show': 'Talk-show',
  Thriller: 'Thriller',
  War: 'Guerre',
  Western: 'Western',
};

export function genreLabel(genre) {
  return GENRE_LABELS[genre] || genre;
}
