# Bobine

**Ton journal de films, rien que pour toi.** Bobine permet de parcourir un catalogue de plus de 22 000 films, de garder une watchlist, puis de noter et commenter les films vus. C'est l'esprit de Letterboxd sans le réseau social : pas de profil public, pas d'abonnés, le journal de chaque compte est privé.

Projet du module **Full Stack JS** (EFREI, M1), réalisé en groupe de trois. Le sujet est libre ; la stack et le contrat d'API du livret sont respectés.

| | |
| --- | --- |
| Front-end | React 19, Vite 8, React Router 7, CSS sans framework |
| Back-end | Node.js 22, Express 5, architecture routes → contrôleurs → services → modèles |
| Données | MongoDB 7 + Mongoose 9, **deux bases** : catalogue public (lecture seule) et base de l'application |
| Authentification | bcrypt (hachage), JWT signé avec expiration, en-tête `Authorization: Bearer` |
| Qualité | ESLint, Jest + Supertest (79 tests), collection Postman (41 requêtes), Swagger/OpenAPI |
| Outillage | Docker Compose (développement et déploiement), GitHub Actions |

## Sommaire

1. [Démarrage rapide avec Docker](#1-démarrage-rapide-avec-docker)
2. [Variables d'environnement](#2-variables-denvironnement)
3. [Utiliser l'application](#3-utiliser-lapplication)
4. [L'API](#4-lapi)
5. [Les deux bases MongoDB](#5-les-deux-bases-mongodb)
6. [Tests, lint, build](#6-tests-lint-build)
7. [Architecture du code](#7-architecture-du-code)
8. [Sécurité : ce qui est fait et pourquoi](#8-sécurité--ce-qui-est-fait-et-pourquoi)
9. [Déploiement](#9-déploiement)
10. [Lancer sans Docker](#10-lancer-sans-docker)
11. [Vite, Babel, Webpack et la CI](#11-vite-babel-webpack-et-la-ci)
12. [Limites connues et pistes d'amélioration](#12-limites-connues-et-pistes-damélioration)

## 1. Démarrage rapide avec Docker

Prérequis : [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2). Rien d'autre à installer.

```bash
git clone <url-du-depot> bobine
cd bobine
cp .env.example .env        # puis remplacer les valeurs dans .env
docker compose up --build
```

Le premier démarrage prend une à deux minutes : Docker télécharge les images, puis MongoDB crée ses comptes et importe le catalogue (22 439 films). Les démarrages suivants sont immédiats.

| Service | Adresse |
| --- | --- |
| Application (front) | http://localhost:5173 |
| API, route de santé | http://localhost:3000/api/health |
| Documentation Swagger | http://localhost:3000/api/docs |
| MongoDB (pour Compass) | `localhost:27018`, identifiants de `.env` |

Trois conteneurs tournent : `mongo` (les deux bases), `api` (Express) et `web` (Vite). Le code est partagé avec les conteneurs : une modification recharge l'API (nodemon) ou le front (Vite) sans rien relancer.

Commandes utiles :

| Besoin | Commande |
| --- | --- |
| Arrêter | `docker compose down` |
| Repartir de zéro (efface comptes et journaux, réimporte le catalogue) | `docker compose down -v` puis `docker compose up` |
| Voir les logs de l'API | `docker compose logs -f api` |
| Après un `git pull` qui change les dépendances | `docker compose up --build -V` |
| Ajouter une dépendance | `docker compose exec api npm install <paquet>`, puis commiter `package.json` et `package-lock.json` |
| Ouvrir un shell MongoDB (admin) | `docker compose exec mongo mongosh -u <MONGO_ROOT_USER> -p` |

## 2. Variables d'environnement

Tout se règle dans le fichier `.env` à la racine (copie de `.env.example`, jamais versionné).

| Variable | Rôle |
| --- | --- |
| `JWT_SECRET` | Clé de signature des jetons. Longue, aléatoire, secrète. |
| `JWT_EXPIRES_IN` | Durée de vie d'un jeton (`2h` par défaut). |
| `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD` | Compte administrateur MongoDB (initialisation et maintenance uniquement). |
| `APP_DB_PASSWORD` | Mot de passe du compte `bobine_app` (lecture/écriture sur la base `bobine`). |
| `CATALOG_DB_PASSWORD` | Mot de passe du compte `catalog_reader` (lecture seule sur `sample_mflix`). |
| `WEB_PORT` | Port public du site en déploiement (`80` par défaut). |

`docker-compose.yml` construit à partir de ces valeurs les variables lues par l'API : `PORT`, `MONGODB_URI`, `CATALOG_MONGODB_URI`, et leurs équivalents `_TEST` pour les tests.

Les mots de passe MongoDB sont appliqués au premier démarrage. Pour les changer ensuite, il faut repartir de zéro (`docker compose down -v`).

## 3. Utiliser l'application

1. **Parcourir** : la page d'accueil affiche le catalogue. Recherche par titre (en anglais, comme le catalogue), filtre par genre, quatre tris, défilement infini. Accessible sans compte.
2. **Créer un compte** ou se connecter (email + mot de passe de 8 caractères minimum).
3. **Sur la fiche d'un film**, bloc « Mon journal » : *Ajouter à ma watchlist* ou *Je l'ai vu*. Un film vu peut recevoir une note sur 10, une date, une critique, un coup de cœur.
4. **Mon journal** : trois onglets (À voir, Vus, Coups de cœur), un résumé chiffré, et pour chaque film : marquer comme vu, coup de cœur, modifier, retirer (avec confirmation).
5. **Pour toi** : des films recommandés d'après le journal, chacun avec un pourcentage de correspondance et les genres qui expliquent le choix.

Pour vérifier l'isolation : créer deux comptes dans deux navigateurs (ou une fenêtre privée). Chacun ne voit que son journal.

## 4. L'API

Documentation complète et testable : **http://localhost:3000/api/docs** (fichier source : `backend/openapi.yaml`).

| Méthode | Route | Accès | Rôle |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Santé : `{"status":"ok"}` |
| POST | `/api/auth/register` | public | Créer un compte → `201 {user, token}` |
| POST | `/api/auth/login` | public | Se connecter → `200 {user, token}` |
| GET | `/api/movies` | public | Catalogue : `?q=&genre=&year=&sort=&page=&limit=` |
| GET | `/api/movies/:id` | public | Fiche d'un film |
| GET | `/api/genres` | public | Liste des genres |
| GET | `/api/entries` | jeton | Mon journal → `{"items":[...]}` (filtres `status`, `favorite`, `movieId`) |
| POST | `/api/entries` | jeton | Ajouter un film à mon journal → `201` |
| GET | `/api/entries/:id` | jeton | Consulter une entrée |
| PATCH | `/api/entries/:id` | jeton | Modifier une entrée (partiel, non vide) |
| DELETE | `/api/entries/:id` | jeton | Supprimer une entrée → `204` sans corps |
| GET | `/api/entries/stats` | jeton | Statistiques de mon journal |
| GET | `/api/recommendations` | jeton | Films recommandés d'après mon journal (`?limit=`, 12 par défaut, 24 au plus) |

### Recommandations

`GET /api/recommendations` propose des films à partir du journal du compte connecté. Le calcul tient dans `backend/src/services/recommendation.service.js`, en trois étapes :

1. **Un signal par film du journal.** Une note sur 10 devient un nombre entre -0,8 et 1 : `(note - 5) / 5`, donc 5/10 est neutre. Un film de la watchlist vaut 0,3, un film vu sans note 0,2, et un coup de cœur ajoute 0,5.
2. **Un profil de goûts.** Les signaux sont additionnés par genre. Exemple : `{ "Sci-Fi": 2.6, "Action": 2.3, "Romance": -0.6 }`.
3. **Un score par film candidat.** Les candidats sont les films bien notés du catalogue (au moins 10 000 votes) qui portent un des trois genres préférés et qui ne sont pas déjà dans le journal. Score sur 100 = 70 % d'affinité (moyenne des poids des genres du film, rapportée au genre préféré) + 30 % de note IMDb. Un genre mal noté fait donc baisser un film, même très bien noté par le public.

Si le journal est vide ou ne contient aucun genre aimé, l'API répond `"basedOn": "popular"` avec les films les mieux notés du catalogue. Comme pour le journal, le calcul croise les deux bases : entrées dans `bobine`, genres et candidats dans `sample_mflix`.

**La ressource métier du contrat est l'entrée de journal** (`/api/entries`) : c'est elle qui porte les cinq opérations CRUD, la validation et l'isolation entre comptes.

| Champ | Règle | POST | PATCH |
| --- | --- | --- | --- |
| `movieId` | Identifiant d'un film existant du catalogue | obligatoire | interdit |
| `status` | `watchlist` (à voir) ou `watched` (vu) | obligatoire | oui |
| `rating` | Entier de 1 à 10, ou `null`. Interdit tant que le film est en watchlist | facultatif | oui |
| `watchedAt` | Date réelle `YYYY-MM-DD`, pas dans le futur, ou `null`. Interdit en watchlist | facultatif | oui |
| `review` | Texte de 0 à 2000 caractères | facultatif | oui |
| `favorite` | Booléen | facultatif | oui |

Toutes les erreurs ont la même forme : `{"error":{"code":"...","message":"..."}}`.

| HTTP | `error.code` | Quand |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | Corps ou paramètre invalide, identifiant malformé, champ interdit (`id`, `ownerId`, champ inconnu), PATCH vide |
| 401 | `UNAUTHORIZED` | Jeton absent, falsifié ou expiré ; identifiants de connexion incorrects |
| 404 | `NOT_FOUND` | Ressource absente **ou appartenant à un autre compte** |
| 409 | `EMAIL_ALREADY_USED` | Email déjà inscrit |
| 409 | `ENTRY_ALREADY_EXISTS` | Film déjà présent dans le journal du compte |

### Collection Postman

`postman/Bobine.postman_collection.json` : 41 requêtes rangées en 6 dossiers (santé, authentification, catalogue, journal et recommandations, isolation A/B, suppression), avec 83 vérifications automatiques.

Dans Postman : *Import* → choisir le fichier → bouton *Run* sur la collection. Les requêtes s'enchaînent dans l'ordre et se passent les valeurs utiles (jeton, identifiants). En ligne de commande :

```bash
npx newman run postman/Bobine.postman_collection.json
```

## 5. Les deux bases MongoDB

| | Base catalogue `sample_mflix` | Base application `bobine` |
| --- | --- | --- |
| Contenu | 22 439 films : titre, année, genres, affiche, résumé, casting, note IMDb | Comptes (`users`) et journal (`entries`) |
| Origine | Jeu de données public [sample_mflix](https://www.mongodb.com/docs/manual/sample-data/sample-mflix/) de MongoDB | Créée par l'application |
| Compte MongoDB utilisé par l'API | `catalog_reader`, rôle `read` | `bobine_app`, rôle `readWrite` |
| Connexion Mongoose | `catalogConnection` | `appConnection` |

Pourquoi deux bases plutôt qu'une :

1. **Moindre privilège.** Le compte du catalogue ne peut que lire. Même avec un bug ou une injection, l'API ne peut ni modifier ni supprimer un film : c'est MongoDB qui refuse, pas seulement notre code.
2. **Deux natures de données.** Le catalogue est une donnée de référence, publique, volumineuse et identique pour tous. Le journal est privé, petit et modifié en permanence. Les mélanger obligerait à leur donner les mêmes droits et les mêmes sauvegardes.
3. **Cycles de vie indépendants.** On peut remplacer ou réimporter tout le catalogue sans toucher à un seul compte, et sauvegarder uniquement la base application (la seule irremplaçable).
4. **Évolutivité.** Le catalogue est branché par une variable (`CATALOG_MONGODB_URI`). Le déplacer sur MongoDB Atlas, ou le remplacer par une autre source, ne touche qu'un fichier : `catalog.service.js`.

Le prix à payer : MongoDB ne sait pas joindre deux bases via deux connexions. Le lien entre une entrée et son film est donc fait dans le code (`entry.service.js`, fonction `withMovies`) : une requête pour les entrées, une requête `$in` pour les films, assemblage en JavaScript. Et l'existence du film est vérifiée à la création d'une entrée, puisqu'aucune clé étrangère ne le garantit.

### Préparation du catalogue

Le jeu public contient des séries, des fiches sans note et environ 800 doublons. Le script `database/prepare-catalog.js` produit `database/seed/movies.json.gz` (films notés, un seul exemplaire par titre et année). Ce fichier est importé automatiquement au premier démarrage du conteneur MongoDB par `database/init/` :

1. `01-create-users.js` crée les deux comptes ;
2. `02-import-catalog.sh` importe les films (`mongoimport`) ;
3. `03-create-indexes.js` crée les index de tri et de filtre.

Le fichier préparé est versionné : il n'y a rien à télécharger ni à relancer.

## 6. Tests, lint, build

```bash
docker compose exec api npm test        # 79 tests Jest + Supertest
docker compose exec api npm run lint    # ESLint côté API
docker compose exec web npm run lint    # ESLint côté front
docker compose exec web npm run build   # build de production du front
```

Les tests tournent sur deux bases dédiées (`bobine_test`, `catalog_test`), jamais sur les données de développement : la configuration bascule dès que `NODE_ENV=test`, et un garde-fou refuse de vider une base dont le nom ne finit pas par `_test`. Le catalogue de test contient 5 films fictifs (`backend/tests/fixtures/movies.js`).

| Fichier | Ce qui est vérifié |
| --- | --- |
| `health.test.js` | Route de santé, route inconnue, JSON illisible |
| `auth.test.js` | Inscription, connexion, 409, 400, absence de hash dans les réponses, jeton absent, falsifié, expiré |
| `catalog.test.js` | Recherche, filtres, tris, pagination, paramètres invalides, lecture seule |
| `entries.test.js` | Parcours CRUD complet, 24 cas de validation, 409, **isolation A/B**, persistance, statistiques |
| `recommendations.test.js` | Repli sur les mieux notés (journal vide), genre aimé qui remonte, genre mal noté qui descend, films du journal exclus, isolation A/B, `limit`, calcul du profil et du score |

Si l'on retire le filtre par propriétaire dans `entry.service.js`, les tests d'isolation échouent : c'est leur rôle.

## 7. Architecture du code

```
bobine/
├─ docker-compose.yml           développement (3 conteneurs)
├─ docker-compose.prod.yml      déploiement
├─ .env.example
├─ database/
│  ├─ init/                     scripts du premier démarrage de MongoDB
│  ├─ seed/movies.json.gz       catalogue préparé
│  └─ prepare-catalog.js        script de préparation du catalogue
├─ postman/                     collection de tests de l'API
├─ backend/
│  ├─ openapi.yaml              documentation de l'API
│  ├─ src/
│  │  ├─ app.js                 construit l'application Express (sans ouvrir de port)
│  │  ├─ server.js              connecte les bases et démarre l'écoute
│  │  ├─ config/                variables d'environnement, deux connexions MongoDB
│  │  ├─ routes/                URL → contrôleur
│  │  ├─ controllers/           valider, appeler le service, répondre
│  │  ├─ services/              règles métier et accès aux données
│  │  ├─ models/                schémas Mongoose (User, Entry, Movie)
│  │  ├─ validators/            validation des entrées
│  │  ├─ middlewares/           requireAuth, validateId, errorHandler
│  │  └─ utils/AppError.js      erreur applicative (statut + code)
│  └─ tests/
└─ frontend/
   └─ src/
      ├─ main.jsx, App.jsx      point d'entrée, routes
      ├─ api/                   apiFetch (jeton, erreurs) et appels par ressource
      ├─ context/               session (AuthContext), messages (ToastContext)
      ├─ components/            Poster, MovieCard, MovieResults, EntryPanel, EntryRow...
      ├─ pages/                 Catalogue, Fiche film, Journal, Pour toi, Connexion, Inscription
      ├─ styles/                jetons de design (couleurs, tailles) et styles de base
      └─ utils/                 formats de dates, traduction des genres
```

### Le chemin d'une requête

Exemple : l'utilisateur clique sur « Ajouter à ma watchlist ».

1. `EntryPanel.jsx` appelle `createEntry()` (`api/entries.js`), qui passe par `apiFetch()` : ajout de l'en-tête `Authorization: Bearer <jeton>`, envoi de `POST /api/entries`.
2. En développement, Vite fait suivre `/api` vers le conteneur de l'API (proxy).
3. `entry.routes.js` : le middleware `requireAuth` vérifie la signature et l'expiration du jeton, puis place l'identifiant du compte dans `req.user.id`.
4. `entry.controller.js` : `validateEntryCreation()` contrôle le corps, puis appelle le service.
5. `entry.service.js` : vérifie que le film existe (base **catalogue**), qu'il n'est pas déjà dans le journal, applique la règle métier, enregistre l'entrée avec `ownerId = req.user.id` (base **application**), puis ajoute le résumé du film.
6. Réponse `201` avec l'entrée. En cas d'erreur à n'importe quelle étape, `errorHandler.js` produit le JSON d'erreur du contrat.

### Choix techniques

- **Express 5** : une erreur levée dans un contrôleur `async` arrive seule dans le gestionnaire d'erreurs, sans `try/catch` répété.
- **Validation écrite à la main** (`validators/`) : une fonction par champ, lisible, sans bibliothèque à apprendre, et qui refuse tout champ non prévu.
- **`app.js` séparé de `server.js`** : les tests importent l'application sans ouvrir de port.
- **CSS sans framework** : variables CSS (`styles/tokens.css`) et un fichier par composant. Animations en CSS pur, plus les View Transitions du navigateur pour le passage de la grille à la fiche.
- **Police installée par npm** (`@fontsource-variable/bricolage-grotesque`) : aucune dépendance à un site externe.
- **Session côté navigateur** : jeton dans `localStorage`, voir la section suivante.

## 8. Sécurité : ce qui est fait et pourquoi

| Mesure | Où | Pourquoi |
| --- | --- | --- |
| Mots de passe hachés avec bcrypt (coût 10) | `auth.service.js` | La base ne contient jamais de mot de passe lisible |
| JWT signé (HS256) avec expiration | `auth.service.js` | Jeton infalsifiable sans `JWT_SECRET`, et limité dans le temps |
| Propriétaire déduit du jeton uniquement | `requireAuth.js`, contrôleurs | Le client ne peut pas se faire passer pour un autre compte |
| Filtre `ownerId` dans chaque requête du journal | `entry.service.js` | Isolation des données entre comptes |
| 404 (et non 403) sur la ressource d'un autre | `entry.service.js` | Ne pas révéler qu'une ressource existe |
| Même réponse 401 pour email inconnu et mauvais mot de passe | `auth.service.js` | Ne pas révéler quels emails sont inscrits |
| Validation serveur stricte, champs inconnus refusés | `validators/` | La validation du front n'est qu'un confort : on peut appeler l'API sans lui |
| Recherche : caractères spéciaux neutralisés | `catalog.service.js` | Pas d'expression régulière contrôlée par l'utilisateur |
| Compte MongoDB en lecture seule pour le catalogue | `database/init/01-create-users.js` | Moindre privilège |
| Erreurs 500 sans détail technique | `errorHandler.js` | Aucune trace ni secret envoyé au client |
| Secrets hors du dépôt | `.env`, `.gitignore` | Rien de sensible dans Git |

**Stockage du jeton dans le navigateur.** Le jeton est gardé dans `localStorage` : simple, et la session survit à un rechargement. Le risque est qu'un script malveillant injecté dans la page (faille XSS) puisse le lire ; React échappe le texte affiché, ce qui limite ce risque, et l'expiration (2 h) limite les dégâts. L'alternative plus robuste est un cookie `httpOnly`, illisible en JavaScript, au prix d'une protection CSRF à ajouter. Quand l'API répond 401 (jeton expiré), le front efface la session et renvoie vers la connexion.

**Pourquoi la sécurité est dans Express et pas seulement dans React.** Masquer un bouton n'empêche personne d'envoyer une requête avec Postman ou `curl`. Seul le serveur peut décider : il vérifie le jeton et filtre par propriétaire à chaque requête.

## 9. Déploiement

Le déploiement réutilise les mêmes conteneurs, en version production :

```bash
# Sur le serveur (Docker installé), dans le dossier du projet :
cp .env.example .env     # avec de vrais secrets, différents de ceux du développement
docker compose -f docker-compose.prod.yml up -d --build
```

| | Développement | Production |
| --- | --- | --- |
| Front | Serveur Vite, rechargement à chaud | Fichiers compilés (`vite build`) servis par Nginx |
| API | nodemon, toutes les dépendances | `node`, dépendances de production, utilisateur non root |
| Ports ouverts | 5173, 3000, 27018 | Un seul : celui du site (`WEB_PORT`) |
| Appels `/api` | Proxy Vite | Proxy Nginx (`frontend/nginx.conf`) |

Front et API partagent la même origine grâce à Nginx : aucune configuration CORS n'est nécessaire. MongoDB et l'API ne sont pas joignables depuis l'extérieur.

À ajouter pour une vraie mise en ligne : un nom de domaine et HTTPS (par exemple avec Caddy ou Traefik devant le conteneur `web`), et une sauvegarde régulière de la base `bobine` (`mongodump`).

## 10. Lancer sans Docker

Prérequis : Node.js 22, MongoDB 7 lancé sur `localhost:27017` (sans authentification), et les [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/) pour l'import.

```bash
# 1. Importer le catalogue (une seule fois)
gunzip -c database/seed/movies.json.gz | mongoimport --db sample_mflix --collection movies

# 2. API
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3000

# 3. Front (dans un autre terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Tests et qualité : `npm test` et `npm run lint` dans `backend/`, `npm run lint` et `npm run build` dans `frontend/`.

## 11. Vite, Babel, Webpack et la CI

Un navigateur ne comprend ni le JSX ni les imports de paquets npm. Il faut donc transformer le code source avant de le lui servir.

- **Transpilation** : traduire une syntaxe en une autre (JSX → JavaScript standard). **Babel** est l'outil historique pour cela.
- **Bundling** : regrouper des centaines de modules en quelques fichiers optimisés. **Webpack** est le bundler historique de l'écosystème React.
- **Vite** fait les deux, avec ses propres outils intégrés. En développement, il sert les modules à la demande et recharge à chaud ; pour la production, `vite build` produit le dossier `dist` (fichiers minifiés, noms avec empreinte pour le cache). Ce projet n'a donc ni configuration Babel ni configuration Webpack.

**CI/CD.** Le fichier `.github/workflows/ci.yml` lance à chaque push : lint et tests de l'API (avec un MongoDB jetable), lint et build du front. Dans une chaîne complète, ces étapes sont la porte d'entrée : si elles passent, on construit les images Docker, puis on déploie (`docker compose -f docker-compose.prod.yml up -d --build`) ; si elles échouent, rien n'est livré.

## 12. Limites connues et pistes d'amélioration

- Le catalogue est en anglais (titres, résumés) et s'arrête vers 2016 : c'est le contenu du jeu de données public. Les genres sont traduits à l'affichage.
- Les affiches sont des liens vers les serveurs d'images d'IMDb. Si un lien ne répond plus, un carton avec le titre du film le remplace.
- La recherche porte sur le titre uniquement (expression régulière, sans tolérance aux fautes de frappe).
- Pas de limitation du nombre de tentatives de connexion, pas de réinitialisation du mot de passe, pas de suppression de compte.
- Un jeton reste valable jusqu'à son expiration, même après déconnexion (pas de liste de révocation).
- La configuration de déploiement ne fournit pas HTTPS.
- Les recommandations ne s'appuient que sur les genres, les notes et la note IMDb : ni réalisateurs, ni acteurs, ni goûts des autres comptes (pas de filtrage collaboratif).
- Pistes : listes personnalisées, statistiques par mois, import d'un export Letterboxd, tests automatisés du front.

---

Version rendue : tag `v1.0.0`.
