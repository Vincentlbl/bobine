const authService = require('../services/auth.service');
const { validateCredentials } = require('../validators/auth.validator');

// Un contrôleur fait toujours les 3 mêmes choses :
// 1. valider l'entrée, 2. appeler le service, 3. répondre en JSON.

async function register(req, res) {
  const credentials = validateCredentials(req.body);
  const result = await authService.register(credentials);
  res.status(201).json(result);
}

async function login(req, res) {
  const credentials = validateCredentials(req.body);
  const result = await authService.login(credentials);
  res.status(200).json(result);
}

module.exports = { register, login };
