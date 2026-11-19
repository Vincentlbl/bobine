const express = require('express');
const entryController = require('../controllers/entry.controller');
const requireAuth = require('../middlewares/requireAuth');
const validateId = require('../middlewares/validateId');

const router = express.Router();

// Tout le journal est privé : le jeton est exigé sur chaque route.
router.use(requireAuth);

// Déclarée avant "/:id", sinon "stats" serait pris pour un identifiant.
router.get('/stats', entryController.getStats);

router.get('/', entryController.listEntries);
router.post('/', entryController.createEntry);
router.get('/:id', validateId, entryController.getEntry);
router.patch('/:id', validateId, entryController.updateEntry);
router.delete('/:id', validateId, entryController.deleteEntry);

module.exports = router;
