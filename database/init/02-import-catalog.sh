#!/bin/bash
# Exécuté au tout premier démarrage du conteneur MongoDB : importe le catalogue
# public de films (jeu de données sample_mflix de MongoDB, préparé par
# database/prepare-catalog.js) dans la base "sample_mflix".

echo "Import du catalogue de films..."

# mongoimport ne sait pas lire un fichier compressé : on le décompresse
# avec gunzip et on lui envoie le résultat par l'entrée standard.
gunzip -c /seed/movies.json.gz | mongoimport \
  --host 127.0.0.1 --port 27017 \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db sample_mflix --collection movies

echo "Catalogue importé."
