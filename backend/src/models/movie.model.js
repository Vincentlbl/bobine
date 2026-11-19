const mongoose = require('mongoose');
const { catalogConnection } = require('../config/db');

// Modèle de lecture sur la collection "movies" du jeu de données public
// sample_mflix (MongoDB). On ne déclare que les champs que l'API utilise.
const movieSchema = new mongoose.Schema(
  {
    title: String,
    year: Number,
    type: String,
    genres: [String],
    poster: String,
    plot: String,
    fullplot: String,
    runtime: Number,
    rated: String,
    released: Date,
    directors: [String],
    cast: [String],
    countries: [String],
    languages: [String],
    imdb: {
      rating: Number,
      votes: Number,
    },
  },
  {
    collection: 'movies',
    // Base en lecture seule : Mongoose ne doit rien y créer (ni collection, ni index).
    autoCreate: false,
    autoIndex: false,
  }
);

module.exports = catalogConnection.model('Movie', movieSchema);
