const express = require('express');
const recommendationController = require('../controllers/recommendation.controller');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

// Les recommandations se calculent à partir du journal : jeton obligatoire.
router.use(requireAuth);

router.get('/', recommendationController.listRecommendations);

module.exports = router;
