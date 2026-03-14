const Execution = require('../models/Execution');
const Workflow = require('../models/Workflow');
const { runWorkflowEngine } = require('../services/workflowEngine');

exports.startExecution = async (req, res, next) => {
  try {
    const { workflow_id } = req.params;
    const inputData = req.body; 

    const workflow = await Workflow.findById(workflow_id);
    
    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    if (!workflow.start_step_id) {
      return res.status(400).json({ status: 'error', message: 'Workflow has no steps configured' });
    }

    const execution = new Execution({
      workflow_id: workflow._id,
      workflow_version: workflow.version,
      status: 'pending',
      data: inputData,
      current_step_id: workflow.start_step_id,
      
      triggered_by: 'mock-admin-user-123' 
    });

    await execution.save();

    const finalExecutionState = await runWorkflowEngine(execution._id);

    res.status(200).json({ status: 'success', data: finalExecutionState });
    
  } catch (error) {
    next(error);
  }
};

exports.getExecution = async (req, res, next) => {
  try {
    const executionId = req.params.id;
    
    const execution = await Execution.findById(executionId).populate('workflow_id', 'name');

    if (!execution) {
      return res.status(404).json({ status: 'error', message: 'Execution not found' });
    }

    res.status(200).json({ status: 'success', data: execution });
    
  } catch (error) {
    next(error);
  }
};

exports.cancelExecution = async (req, res, next) => {
  try {
    const executionId = req.params.id;

    const execution = await Execution.findById(executionId);

    if (!execution) {
      return res.status(404).json({ status: 'error', message: 'Execution not found' });
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Cannot cancel an execution that is already completed or failed' 
      });
    }

    execution.status = 'canceled';
    execution.ended_at = new Date();
    await execution.save();

    res.status(200).json({ status: 'success', message: 'Execution canceled successfully', data: execution });
    
  } catch (error) {
    next(error);
  }
};

exports.retryExecution = async (req, res, next) => {
  try {
    const executionId = req.params.id;

    const execution = await Execution.findById(executionId);

    if (!execution) {
      return res.status(404).json({ status: 'error', message: 'Execution not found' });
    }

    if (execution.status !== 'failed') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'You can only retry a failed execution' 
      });
    }

    execution.retries += 1;
    execution.status = 'pending';
    execution.ended_at = null; 
    await execution.save();

    const finalExecutionState = await runWorkflowEngine(execution._id);

    res.status(200).json({ status: 'success', data: finalExecutionState });
    
  } catch (error) {
    next(error);
  }
};