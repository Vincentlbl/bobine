const catalogService = require('../services/catalog.service');
const { validateMovieQuery } = require('../validators/catalog.validator');

async function listMovies(req, res) {
  const query = validateMovieQuery(req.query);
  const result = await catalogService.searchMovies(query);
  res.json(result);
}

async function getMovie(req, res) {
  const movie = await catalogService.getMovieById(req.params.id);
  res.json(movie);
}

async function listGenres(req, res) {
  const genres = await catalogService.listGenres();
  res.json({ items: genres });
}

module.exports = { listMovies, getMovie, listGenres };
