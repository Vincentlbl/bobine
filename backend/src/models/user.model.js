const mongoose = require('mongoose');
const { appConnection } = require('../config/db');

const userSchema = new mongoose.Schema(
  {
    // lowercase + unique : "Alice@Mail.fr" et "alice@mail.fr" sont le même compte.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // On ne stocke jamais le mot de passe, seulement son hash bcrypt.
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// Forme publique d'un utilisateur : jamais de hash dans une réponse.
userSchema.set('toJSON', {
  transform(doc) {
    return { id: doc._id.toString(), email: doc.email };
  },
});

module.exports = appConnection.model('User', userSchema);
