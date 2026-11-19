import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, le front (port 5173) et l'API (port 3000) sont deux
// serveurs différents. Le proxy fait suivre tout ce qui commence par /api
// vers l'API : le navigateur ne parle qu'à une seule origine, donc pas de CORS.
// Dans Docker, docker-compose fournit l'adresse du conteneur de l'API.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000';
const insideDocker = Boolean(process.env.API_PROXY_TARGET);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dans Docker, il faut surveiller les fichiers "à l'ancienne" pour que
    // le rechargement à chaud voie les modifications faites sur la machine.
    watch: { usePolling: insideDocker },
    proxy: { '/api': apiTarget },
  },
});
