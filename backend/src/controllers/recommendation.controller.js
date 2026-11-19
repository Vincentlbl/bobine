const recommendationService = require('../services/recommendation.service');
const { validateRecommendationQuery } = require('../validators/recommendation.validator');

// req.user.id vient du JWT vérifié : on ne recommande qu'à partir
// du journal du compte connecté.
async function listRecommendations(req, res) {
  const { limit } = validateRecommendationQuery(req.query);
  const recommendations = await recommendationService.getRecommendations(req.user.id, limit);
  res.json(recommendations);
}

module.exports = { listRecommendations };
