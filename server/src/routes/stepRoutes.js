const express = require('express')
// If you try to access req.params.workflow_id inside your createStep controller without mergeParams, it will be undefined. 
// Your backend won't know which workflow to attach the step to, and the request will fail.
// You are explicitly telling Express: "Hey, take all the parameters from the parent route (like :workflow_id) and merge them into this router so I can use them."
// It successfully grabs the ID from the URL, finds the correct workflow in the database, and saves the step exactly where it belongs.
const router = express.Router({ mergeParams: true});

const {
  createStep,
  getStepsByWorkflow,
  updateStep,
  deleteStep
} = require('../controllers/stepController');

router.route('/')
    .post(createStep)
    .get(getStepsByWorkflow);

router.route('/:id')
    .put(updateStep)
    .delete(deleteStep);

module.exports = router;