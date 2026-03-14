// server/src/controllers/ruleController.js
const Rule = require('../models/Rule');
const Step = require('../models/Step');

// @desc    Add a rule to a step
// @route   POST /api/steps/:step_id/rules
exports.createRule = async (req, res, next) => {
  try {
    const { step_id } = req.params;
    const { condition, next_step_id, priority } = req.body;

    const step = await Step.findById(step_id);
    if (!step) return res.status(404).json({ status: 'error', message: 'Step not found' });

    const rule = new Rule({ step_id, condition, next_step_id, priority });
    await rule.save();

    res.status(201).json({ status: 'success', data: rule });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rules for a step
// @route   GET /api/steps/:step_id/rules
exports.getRulesByStep = async (req, res, next) => {
  try {
    const rules = await Rule.find({ step_id: req.params.step_id }).sort({ priority: 1 });
    res.status(200).json({ status: 'success', count: rules.length, data: rules });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update rule priorities (For Drag and Drop UI!)
// @route   PUT /api/steps/:step_id/rules/reorder
exports.reorderRules = async (req, res, next) => {
  try {
    const { rules } = req.body; // Expects an array: [{ ruleId: "123", priority: 1 }, ...]
    
    // Use Promise.all to update all rule priorities in parallel
    await Promise.all(rules.map(r => 
      Rule.findByIdAndUpdate(r.ruleId, { priority: r.priority })
    ));

    res.status(200).json({ status: 'success', message: 'Rules reordered successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a single rule
// @route   PUT /api/rules/:id
exports.updateRule = async (req, res, next) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found' });
    res.status(200).json({ status: 'success', data: rule });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a rule
// @route   DELETE /api/rules/:id
exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found' });
    res.status(200).json({ status: 'success', message: 'Rule deleted' });
  } catch (error) {
    next(error);
  }
};