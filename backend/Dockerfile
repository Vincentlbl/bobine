# Un seul Dockerfile, deux cibles :
#   - dev  : toutes les dépendances + rechargement automatique (nodemon)
#   - prod : dépendances de production uniquement, utilisateur non root

FROM node:22-slim AS base
WORKDIR /app
# On copie d'abord les fichiers de dépendances : tant qu'ils ne changent pas,
# Docker réutilise son cache et ne refait pas "npm ci".
COPY package*.json ./

FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
