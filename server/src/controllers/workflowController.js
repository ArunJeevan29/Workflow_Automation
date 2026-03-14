const Workflow = require('../models/Workflow');

exports.createWorkflow = async (req, res, next) => {
  try {
    const { name, input_schema } = req.body;

    if (!name || !input_schema) {
      return res.status(400).json({ status: 'error', message: 'Name and input_schema are required' });
    }

    const workflow = new Workflow({
      name,
      input_schema,
      version: 1,
      is_active: true
    });

    await workflow.save();
    res.status(201).json({ status: 'success', data: workflow });
  } catch (error) {
    next(error);
  }
};

exports.getWorkflows = async (req, res, next) => {
  try {
    const workflows = await Workflow.find({ is_active: true }).sort({ created_at: -1 });
    res.status(200).json({ status: 'success', count: workflows.length, data: workflows });
  } catch (error) {
    next(error);
  }
};

exports.getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    res.status(200).json({ status: 'success', data: workflow });
  } catch (error) {
    next(error);
  }
};

exports.updateWorkflow = async (req, res, next) => {
  try {
    const workflowId = req.params.id;
    const { name, input_schema, start_step_id } = req.body;

    const existingWorkflow = await Workflow.findById(workflowId);
    if (!existingWorkflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    existingWorkflow.name = name || existingWorkflow.name;
    existingWorkflow.input_schema = input_schema || existingWorkflow.input_schema;
    existingWorkflow.start_step_id = start_step_id || existingWorkflow.start_step_id;
    existingWorkflow.version += 1;

    await existingWorkflow.save();

    res.status(200).json({ status: 'success', data: existingWorkflow });
  } catch (error) {
    next(error);
  }
};

exports.deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }
    workflow.is_active = false;
    await workflow.save();

    res.status(200).json({ status: 'success', message: 'Workflow archived successfully' });
  } catch (error) {
    next(error);
  }
};