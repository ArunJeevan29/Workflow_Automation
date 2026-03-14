const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');
const { evaluateCondition } = require('../utils/ruleParser');

const MAX_ITERATIONS = 50;

const runWorkflowEngine = async (executionId) => {
  
  const execution = await Execution.findById(executionId);
  
  if (!execution) {
    throw new Error('Execution record not found');
  }

  let currentStepId = execution.current_step_id;
  let iterationCount = 0;

  while (currentStepId !== null) {
    
    iterationCount++;
    if (iterationCount > MAX_ITERATIONS) {
      execution.status = 'failed';
      await execution.save();
      throw new Error(`Execution aborted: Exceeded maximum iterations of ${MAX_ITERATIONS}. Possible infinite loop detected.`);
    }

    const step = await Step.findById(currentStepId);
    
    if (!step) {
      execution.status = 'failed';
      await execution.save();
      throw new Error(`Step ID ${currentStepId} not found`);
    }

    const stepStartTime = new Date();
    
    const stepLog = {
      step_name: step.name,
      step_type: step.step_type,
      evaluated_rules: [],
      selected_next_step: null,
      status: 'completed',
      started_at: stepStartTime,
      ended_at: null
    };

    if (step.step_type === 'approval') {
      stepLog.status = 'pending_approval';
      stepLog.ended_at = new Date();
      execution.logs.push(stepLog);
      
      execution.status = 'in_progress';
      execution.current_step_id = currentStepId;
      
      await execution.save();
      
      return execution; 
    }

    const rules = await Rule.find({ step_id: currentStepId }).sort({ priority: 1 });
    let nextStepId = null;
    let ruleMatched = false;

    for (const rule of rules) {
      const isTrue = evaluateCondition(rule.condition, execution.data);
      
      stepLog.evaluated_rules.push({
        rule: rule.condition,
        result: isTrue
      });

      if (isTrue) {
        nextStepId = rule.next_step_id;
        stepLog.selected_next_step = nextStepId;
        ruleMatched = true;
        break; 
      }
    }

    if (!ruleMatched) {
      stepLog.status = 'failed';
      stepLog.error_message = 'No matching rules found and no DEFAULT rule provided.';
      stepLog.ended_at = new Date();
      execution.logs.push(stepLog);
      
      execution.status = 'failed';
      await execution.save();
      throw new Error(`Execution failed at step ${step.name}: No matching rules found.`);
    }

    stepLog.ended_at = new Date();
    execution.logs.push(stepLog);
    
    currentStepId = nextStepId;
  }

  execution.status = 'completed';
  execution.current_step_id = null;
  execution.ended_at = new Date();
  
  await execution.save();
  return execution;
};

module.exports = { runWorkflowEngine };