// Exécuté par le conteneur MongoDB à son tout premier démarrage, avec le
// compte administrateur. Crée les deux comptes utilisés par l'API.
// Principe du moindre privilège : chaque compte n'a que les droits nécessaires.

const appPassword = process.env.APP_DB_PASSWORD;
const catalogPassword = process.env.CATALOG_DB_PASSWORD;

if (!appPassword || !catalogPassword) {
  throw new Error('APP_DB_PASSWORD et CATALOG_DB_PASSWORD doivent être définis dans .env');
}

// Compte de l'application : lit et écrit dans NOTRE base (comptes, journal),
// et dans les deux bases jetables utilisées par les tests automatisés.
db.getSiblingDB('bobine').createUser({
  user: 'bobine_app',
  pwd: appPassword,
  roles: [
    { role: 'readWrite', db: 'bobine' },
    { role: 'readWrite', db: 'bobine_test' },
    { role: 'readWrite', db: 'catalog_test' },
  ],
});

// Compte du catalogue : lecture seule. Même en cas de bug ou d'attaque,
// l'API ne peut ni modifier ni supprimer un film.
db.getSiblingDB('sample_mflix').createUser({
  user: 'catalog_reader',
  pwd: catalogPassword,
  roles: [{ role: 'read', db: 'sample_mflix' }],
});

print('Comptes MongoDB créés : bobine_app (lecture/écriture), catalog_reader (lecture seule).');
