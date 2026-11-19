const mongoose = require('mongoose');
const env = require('./env');

// Deux connexions MongoDB distinctes :
//  - appConnection     : NOTRE base (comptes + journal), en lecture/écriture ;
//  - catalogConnection : le catalogue public de films, en lecture seule
//                        (le compte MongoDB utilisé n'a que le rôle "read").
// Chaque modèle Mongoose est rattaché à l'une des deux (voir src/models).
const appConnection = mongoose.createConnection();
const catalogConnection = mongoose.createConnection();

async function connectDatabases() {
  await Promise.all([
    appConnection.openUri(env.appDbUri),
    catalogConnection.openUri(env.catalogDbUri),
  ]);
}

async function closeDatabases() {
  await Promise.all([appConnection.close(), catalogConnection.close()]);
}

module.exports = {
  appConnection,
  catalogConnection,
  connectDatabases,
  closeDatabases,
};
