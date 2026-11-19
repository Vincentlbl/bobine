const mongoose = require('mongoose');
const { appConnection } = require('../config/db');

const ENTRY_STATUSES = ['watchlist', 'watched'];

// Une entrée du journal = le lien entre UN utilisateur et UN film du catalogue.
const entrySchema = new mongoose.Schema(
  {
    // Propriétaire : toujours déduit du JWT côté serveur, jamais envoyé par le client.
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    // Identifiant du film dans l'AUTRE base (catalogue). Pas de "ref" Mongoose
    // possible entre deux bases : le service fait le lien lui-même.
    movieId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ENTRY_STATUSES, required: true },
    rating: { type: Number, default: null }, // entier de 1 à 10, ou null
    watchedAt: { type: String, default: null }, // "YYYY-MM-DD", ou null
    review: { type: String, default: '' },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Un même film ne peut apparaître qu'une fois dans le journal d'un compte.
entrySchema.index({ ownerId: 1, movieId: 1 }, { unique: true });

// Forme publique : "id" au lieu de "_id", et pas d'ownerId.
entrySchema.set('toJSON', {
  transform(doc) {
    return {
      id: doc._id.toString(),
      movieId: doc.movieId.toString(),
      status: doc.status,
      rating: doc.rating,
      watchedAt: doc.watchedAt,
      review: doc.review,
      favorite: doc.favorite,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
});

const Entry = appConnection.model('Entry', entrySchema);

module.exports = { Entry, ENTRY_STATUSES };
