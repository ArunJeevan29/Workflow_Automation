// server/src/routes/ruleRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); 
const {
  createRule,
  getRulesByStep,
  updateRule,
  deleteRule,
  reorderRules
} = require('../controllers/ruleController');

// Mounted at /api/steps/:step_id/rules
router.route('/')
  .post(createRule)
  .get(getRulesByStep);

// Drag and drop endpoint
router.route('/reorder')
  .put(reorderRules);

// Mounted at /api/rules/:id
router.route('/:id')
  .put(updateRule)
  .delete(deleteRule);

module.exports = router;