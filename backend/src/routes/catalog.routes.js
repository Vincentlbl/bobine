const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const validateId = require('../middlewares/validateId');

// Le catalogue est une donnée publique : ces routes sont accessibles
// sans jeton, et uniquement en lecture (GET).
const router = express.Router();

router.get('/movies', catalogController.listMovies);
router.get('/movies/:id', validateId, catalogController.getMovie);
router.get('/genres', catalogController.listGenres);

module.exports = router;
