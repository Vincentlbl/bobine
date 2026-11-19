const { readInteger } = require('./catalog.validator');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

// GET /api/recommendations?limit=
function validateRecommendationQuery(query) {
  return {
    limit: readInteger(query.limit, { name: 'limit', min: 1, max: MAX_LIMIT, fallback: DEFAULT_LIMIT }),
  };
}

module.exports = { validateRecommendationQuery };
