const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  startExecution,
  getExecution,
  cancelExecution,
  retryExecution
} = require('../controllers/executionController');

router.route('/')
  .post(startExecution);

router.route('/:id')
  .get(getExecution);

router.route('/:id/cancel')
  .post(cancelExecution);

router.route('/:id/retry')
  .post(retryExecution);

module.exports = router;