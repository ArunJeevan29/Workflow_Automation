// server/src/routes/workflowRoutes.js
const express = require('express');
const router = express.Router();
const {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow
} = require('../controllers/workflowController');

router.route('/')
  .post(createWorkflow)
  .get(getWorkflows);

router.route('/:id')
  .get(getWorkflowById)
  .put(updateWorkflow)
  .delete(deleteWorkflow);

module.exports = router;