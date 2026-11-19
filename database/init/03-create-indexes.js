// Index du catalogue : ils accélèrent les tris et les filtres de GET /api/movies.
const movies = db.getSiblingDB('sample_mflix').movies;

movies.createIndex({ 'imdb.votes': -1 }); // tri "les plus populaires"
movies.createIndex({ 'imdb.rating': -1 }); // tri "les mieux notés"
movies.createIndex({ year: -1 }); // tri "les plus récents" et filtre par année
movies.createIndex({ title: 1 }); // tri par titre
movies.createIndex({ genres: 1 }); // filtre par genre

print(`Catalogue prêt : ${movies.countDocuments()} films.`);
