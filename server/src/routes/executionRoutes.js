wconst express = require('express');
const router = express.Router({ mergeParams: true });
const {
  startExecution,
  getExecution,
  cancelExecution,
  retryExecution,
  getAllExecutions,
  getStaffInbox, 
  getStaffPerformance,
  respondToTask      
} = require('../controllers/executionController');

router.get('/my-inbox', getStaffInbox);
router.get('/my-performance', getStaffPerformance);

router.post('/', startExecution);
router.get('/', getAllExecutions);
router.get('/:id', getExecution);
router.post('/:id/cancel', cancelExecution);
router.post('/:id/retry', retryExecution);
router.post('/:id/respond', respondToTask);

module.exports = router;