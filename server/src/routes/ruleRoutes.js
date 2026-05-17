const express = require('express');
const router = express.Router({ mergeParams: true }); 
const {
  createRule,
  getRulesByStep,
  updateRule,
  deleteRule,
  reorderRules
} = require('../controllers/ruleController');

router.post('/', createRule);
router.get('/', getRulesByStep);
router.put('/reorder', reorderRules);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

module.exports = router;