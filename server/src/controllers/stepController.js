// server/src/controllers/stepController.js
const Step = require('../models/Step');
const Workflow = require('../models/Workflow');

// @desc    Add a step to a workflow
// @route   POST /api/workflows/:workflow_id/steps
exports.createStep = async (req, res, next) => {
  try {
    const { workflow_id } = req.params;
    const { name, step_type, order, metadata } = req.body;

    // 1. Verify workflow exists
    const workflow = await Workflow.findById(workflow_id);
    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    // 2. Create the Step
    const step = new Step({
      workflow_id,
      name,
      step_type,
      order,
      metadata
    });
    await step.save();

    // 3. PRO MOVE: If this is the first step, auto-assign it as the start_step_id
    if (!workflow.start_step_id) {
      workflow.start_step_id = step._id;
      await workflow.save();
    }

    res.status(201).json({ status: 'success', data: step });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all steps for a workflow
// @route   GET /api/workflows/:workflow_id/steps
exports.getStepsByWorkflow = async (req, res, next) => {
  try {
    const steps = await Step.find({ workflow_id: req.params.workflow_id }).sort({ order: 1 });
    res.status(200).json({ status: 'success', count: steps.length, data: steps });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a step
// @route   PUT /api/steps/:id
exports.updateStep = async (req, res, next) => {
  try {
    const step = await Step.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!step) return res.status(404).json({ status: 'error', message: 'Step not found' });
    res.status(200).json({ status: 'success', data: step });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a step
// @route   DELETE /api/steps/:id
exports.deleteStep = async (req, res, next) => {
  try {
    const step = await Step.findByIdAndDelete(req.params.id);
    if (!step) return res.status(404).json({ status: 'error', message: 'Step not found' });
    res.status(200).json({ status: 'success', message: 'Step deleted' });
  } catch (error) {
    next(error);
  }
};