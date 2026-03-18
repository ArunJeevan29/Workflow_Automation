// server/src/routes/stepRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Crucial for reading :workflow_id from parent route
const {
  createStep,
  getStepsByWorkflow,
  updateStep,
  deleteStep
} = require('../controllers/stepController');

// Routes mounted at /api/workflows/:workflow_id/steps
router.route('/')
  .post(createStep)
  .get(getStepsByWorkflow);

// Routes mounted at /api/steps
// (We will map this directly in server.js)
router.route('/:id')
  .put(updateStep)
  .delete(deleteStep);

module.exports = router;