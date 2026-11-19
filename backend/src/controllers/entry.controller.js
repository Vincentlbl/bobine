const entryService = require('../services/entry.service');
const {
  validateEntryCreation,
  validateEntryUpdate,
  validateEntryFilters,
} = require('../validators/entry.validator');

// req.user.id vient du middleware requireAuth (donc du JWT vérifié),
// jamais du corps de la requête.

async function listEntries(req, res) {
  const filters = validateEntryFilters(req.query);
  const entries = await entryService.listEntries(req.user.id, filters);
  res.json({ items: entries });
}

async function createEntry(req, res) {
  const data = validateEntryCreation(req.body);
  const entry = await entryService.createEntry(req.user.id, data);
  res.status(201).json(entry);
}

async function getEntry(req, res) {
  const entry = await entryService.getEntry(req.user.id, req.params.id);
  res.json(entry);
}

async function updateEntry(req, res) {
  const changes = validateEntryUpdate(req.body);
  const entry = await entryService.updateEntry(req.user.id, req.params.id, changes);
  res.json(entry);
}

async function deleteEntry(req, res) {
  await entryService.deleteEntry(req.user.id, req.params.id);
  res.status(204).end();
}

async function getStats(req, res) {
  const stats = await entryService.getStats(req.user.id);
  res.json(stats);
}

module.exports = { listEntries, createEntry, getEntry, updateEntry, deleteEntry, getStats };
