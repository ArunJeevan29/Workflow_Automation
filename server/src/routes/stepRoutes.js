const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createStep,
  getStepsByWorkflow,
  updateStep,
  deleteStep
} = require('../controllers/stepController');

router.post('/', createStep);
router.get('/', getStepsByWorkflow);
router.put('/:id', updateStep);
router.delete('/:id', deleteStep);

module.exports = router;