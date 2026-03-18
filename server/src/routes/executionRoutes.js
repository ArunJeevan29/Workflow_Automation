// server/routes/executionRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  startExecution,
  getExecution,
  cancelExecution,
  retryExecution,
  getAllExecutions,
  getStaffInbox, 
  getStaffPerformance, // <-- NEW
  respondToTask      
} = require('../controllers/executionController');

router.get('/my-inbox', getStaffInbox);
router.get('/my-performance', getStaffPerformance); // <-- NEW

router.route('/')
  .post(startExecution)
  .get(getAllExecutions);

router.route('/:id')
  .get(getExecution);

router.route('/:id/cancel')
  .post(cancelExecution);

router.route('/:id/retry')
  .post(retryExecution);

// Route for the Manager clicking Approve/Reject
router.post('/:id/respond', respondToTask);

module.exports = router;