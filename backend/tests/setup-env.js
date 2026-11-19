// Les tests tournent toujours en mode "test" : la configuration (src/config/env.js)
// choisit alors les bases MONGODB_URI_TEST et CATALOG_MONGODB_URI_TEST,
// jamais les bases de développement.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-utilise-uniquement-par-les-tests';
