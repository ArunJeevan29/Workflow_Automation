// server/controllers/workflowController.js
const Workflow = require('../models/Workflow');

exports.createWorkflow = async (req, res, next) => {
  try {
    const { name, description, input_schema, steps } = req.body;

    if (!name || !input_schema) {
      return res.status(400).json({ status: 'error', message: 'Name and input_schema are required' });
    }

    const start_id = (steps && steps.length > 0) ? steps[0].id : null;

    const workflow = new Workflow({
      name,
      description,
      input_schema,
      steps: steps || [],
      start_step_id: start_id,
      version: 1,
      is_active: true
    });

    workflow.parent_id = workflow._id;

    await workflow.save();
    res.status(201).json({ status: 'success', data: workflow });
  } catch (error) {
    next(error);
  }
};

exports.getWorkflows = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, parent_id } = req.query;

    let filter = { is_active: true };

    if (parent_id) {
      filter = {
        $or: [
          { parent_id: parent_id },
          { _id: parent_id }
        ]
      };
    } else if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Workflow.countDocuments(filter);
    const workflows = await Workflow.find(filter)
      .sort({ created_at: -1 }) // Reverted back to sorting by newest created first
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      count: workflows.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: workflows
    });
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
    const { name, description, input_schema, steps, is_active } = req.body;

    const existingWorkflow = await Workflow.findById(workflowId);
    if (!existingWorkflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    existingWorkflow.is_active = false;
    await existingWorkflow.save();

    const start_id = (steps && steps.length > 0) ? steps[0].id : null;
    const parentIdToUse = existingWorkflow.parent_id || existingWorkflow._id;

    // THE FIX: Find the highest version number currently in the database for this workflow lineage
    const maxVersionDoc = await Workflow.findOne({ parent_id: parentIdToUse }).sort({ version: -1 });
    const nextVersion = (maxVersionDoc ? maxVersionDoc.version : existingWorkflow.version) + 1;

    const newWorkflow = new Workflow({
      name: name || existingWorkflow.name,
      description: description !== undefined ? description : existingWorkflow.description,
      input_schema: input_schema || existingWorkflow.input_schema,
      steps: steps || existingWorkflow.steps,
      start_step_id: start_id || existingWorkflow.start_step_id,
      version: nextVersion, 
      is_active: is_active !== undefined ? is_active : true, 
      parent_id: parentIdToUse 
    });

    await newWorkflow.save();

    res.status(200).json({ status: 'success', data: newWorkflow });
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