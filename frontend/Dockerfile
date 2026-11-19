# Trois étapes :
#   - dev   : serveur de développement Vite (rechargement à chaud)
#   - build : compile le front en fichiers statiques (dossier dist)
#   - prod  : Nginx sert ces fichiers et fait suivre /api vers l'API

FROM node:22-slim AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM dev AS build
RUN npm run build

FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
