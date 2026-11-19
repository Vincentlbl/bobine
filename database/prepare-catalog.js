// Prépare le fichier d'import du catalogue à partir du jeu de données public
// "sample_mflix" de MongoDB (collection movies, exportée en JSON, une fiche par ligne).
//
//   node database/prepare-catalog.js chemin/vers/movies.json
//
// Le jeu public contient des séries, des fiches sans note et ~800 doublons.
// Ce script garde uniquement les films notés et un seul exemplaire de chaque
// film (même titre + même année : on garde celui qui a le plus de votes).
// Résultat : database/seed/movies.json.gz, importé par Docker au premier démarrage.
//
// Il a déjà été exécuté : le fichier produit est versionné, inutile de le relancer.

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const zlib = require('node:zlib');

const OUTPUT_FILE = path.join(__dirname, 'seed', 'movies.json.gz');

// L'export MongoDB écrit les nombres sous la forme {"$numberInt":"1972"}.
function readNumber(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const raw = value.$numberInt ?? value.$numberDouble ?? value.$numberLong;
    return raw === undefined ? null : Number(raw);
  }
  return null; // chaîne vide, valeur absente...
}

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage : node database/prepare-catalog.js chemin/vers/movies.json');
    process.exit(1);
  }

  const bestByKey = new Map(); // "titre|année" -> { votes, line }
  let total = 0;

  const lines = readline.createInterface({ input: fs.createReadStream(inputFile) });
  for await (const line of lines) {
    if (!line.trim()) continue;
    total += 1;

    const movie = JSON.parse(line);
    const year = readNumber(movie.year);
    const rating = readNumber(movie.imdb?.rating);
    const votes = readNumber(movie.imdb?.votes);

    const isUsable = movie.type === 'movie' && year !== null && rating !== null && votes !== null;
    if (!isUsable) continue;

    const key = `${movie.title}|${year}`;
    const best = bestByKey.get(key);
    if (!best || votes > best.votes) {
      bestByKey.set(key, { votes, line });
    }
  }

  const output = [...bestByKey.values()].map((entry) => entry.line).join('\n') + '\n';
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, zlib.gzipSync(output, { level: 9 }));

  console.log(`${total} fiches lues, ${bestByKey.size} films gardés -> ${OUTPUT_FILE}`);
}

main();
