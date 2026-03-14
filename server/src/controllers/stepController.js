const Step = require('../models/Step');
const Workflow = require('../models/Workflow');

exports.createStep = async (req, res, next) => {
  try {
    const { workflow_id } = req.params;
    const { name, step_type, order, metadata } = req.body;

    const workflow = await Workflow.findById(workflow_id);
    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    const step = new Step({
      workflow_id,
      name,
      step_type,
      order,
      metadata
    });
    await step.save();

    if (!workflow.start_step_id) {
      workflow.start_step_id = step._id;
      await workflow.save();
    }

    res.status(201).json({ status: 'success', data: step });
  } catch (error) {
    next(error);
  }
};

exports.getStepsByWorkflow = async (req, res, next) => {
  try {
    const steps = await Step.find({ workflow_id: req.params.workflow_id }).sort({ order: 1 });
    res.status(200).json({ status: 'success', count: steps.length, data: steps });
  } catch (error) {
    next(error);
  }
}

  exports.updateStep = async (req, res, next) => {
  try {
    const stepId = req.params.id;
    const updateData = req.body;

    const updatedStep = await Step.findByIdAndUpdate(stepId, updateData, { new: true, runValidators: true });

    if (!updatedStep) {
      return res.status(404).json({ status: 'error', message: 'Step not found' });
    }

    res.status(200).json({ status: 'success', data: updatedStep });
  } catch (error) {
    next(error);
  }
};

exports.deleteStep = async (req, res, next) => {
  try {
    const stepId = req.params.id;

    const deletedStep = await Step.findByIdAndDelete(stepId);

    if (!deletedStep) {
      return res.status(404).json({ status: 'error', message: 'Step not found' });
    }

    res.status(200).json({ status: 'success', message: 'Step deleted' });
  } catch (error) {
    next(error);
  }
}