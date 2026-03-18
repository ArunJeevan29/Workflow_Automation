// server/services/workflowEngine.js
const mongoose = require('mongoose');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const Settings = require('../models/Settings'); 
const Notification = require('../models/Notification');
const Fund = require('../models/Fund'); // <-- THE FIX: Properly import the Fund model
const { evaluateCondition } = require('../utils/ruleParser');

/**
 * Send notification to user when execution fails
 */
const sendFailureNotification = async (execution, errorMessage) => {
  try {
    const workflow = await Workflow.findById(execution.workflow_id);
    const workflowName = workflow?.name || 'Unknown Workflow';
    
    await Notification.create({
      recipient_email: execution.triggered_by,
      message: `Your request "${workflowName}" has failed. ${errorMessage}`,
      workflow_id: execution.workflow_id,
      execution_id: execution._id,
      is_read: false
    });
    
    console.log(`[Notification] Failure alert sent to ${execution.triggered_by}`);
  } catch (err) {
    console.error(`[Notification Error] Failed to send failure notification:`, err.message);
  }
};

/**
 * Core Rule Evaluation Logic (The "Brain")
 */
const evaluateRules = (step, executionData) => {
  const rules = step.rules || [];
  rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));

  let nextStepId = null;
  let ruleMatched = false;
  const evaluated_rules = [];

  if (rules.length === 0) {
    return { ruleMatched: true, nextStepId: null, evaluated_rules: [] };
  }

  for (const rule of rules) {
    const condition = (rule.condition || '').trim();
    let isTrue = false;

    if (condition.toUpperCase() === 'DEFAULT' || condition.toUpperCase() === 'TRUE' || condition === '') {
      isTrue = true;
    } else {
      try {
        isTrue = evaluateCondition(condition, executionData);
      } catch (e) {
        console.error(`Rule parsing error [${condition}]:`, e.message);
        isTrue = false; 
      }
    }

    evaluated_rules.push({ rule: condition, result: isTrue });

    if (isTrue) {
      nextStepId = rule.next_step_id || rule.nextStepId || rule.nextStep || rule.next_step || null;
      
      if (nextStepId === 'END' || nextStepId === 'end') {
        nextStepId = null;
      }

      ruleMatched = true;
      break; 
    }
  }

  return { ruleMatched, nextStepId, evaluated_rules };
};

/**
 * The Main Engine Loop
 */
const runWorkflowEngine = async (executionId) => {
  const execution = await Execution.findById(executionId);
  if (!execution) throw new Error('Execution record not found');

  if (!execution.data || Object.keys(execution.data).length === 0) {
    execution.data = { "system_note": "No input schema provided" };
    execution.markModified('data');
  }

  const workflow = await Workflow.findById(execution.workflow_id);
  if (!workflow) throw new Error('Workflow blueprint not found');

  let settings = await Settings.findOne();
  if (!settings) {
    settings = { maxIterations: 50, defaultRuleBehavior: 'fail', notifyOnFail: true, notifyOnComplete: false };
  }

  let currentStepId = execution.current_step_id;
  let iterationCount = 0;

  while (currentStepId !== null) {
    iterationCount++;
    console.log(`[⚙️ Engine] Iteration ${iterationCount}/${settings.maxIterations} | Step ID: ${currentStepId}`);
    
    // Max Iterations Handler (Using Admin Setting)
    if (iterationCount > settings.maxIterations) {
      execution.logs.push({
        step_name: 'System Alert: Safety Limit Triggered',
        step_type: 'notification',
        status: 'failed',
        error_message: `Sent to Admin: "Workflow execution forcefully aborted. Exceeded your workspace's maximum safe limit of ${settings.maxIterations} automated routing steps."`,
        approver_id: 'System',
        started_at: new Date(),
        ended_at: new Date()
      });

      execution.status = 'failed';
      await execution.save();
      
      await sendFailureNotification(execution, 'Workflow exceeded maximum safe iterations and was stopped.');
      
      throw new Error(`Execution aborted: Exceeded max iterations of ${settings.maxIterations}.`);
    }

    const step = workflow.steps.find(s => s.id === currentStepId);
    if (!step) {
      execution.status = 'failed';
      await execution.save();
      await sendFailureNotification(execution, `Step "${currentStepId}" not found in workflow.`);
      throw new Error(`Step ID ${currentStepId} not found`);
    }

    const stepStartTime = new Date();
    
    if (step.step_type === 'approval') {
      const pendingLog = {
        step_name: step.name,
        step_type: step.step_type,
        evaluated_rules: [],
        selected_next_step: null,
        status: 'pending_approval', 
        started_at: stepStartTime,
        ended_at: null,
        approver_id: step.metadata?.assignee_email || null 
      };
      
      execution.logs.push(pendingLog);
      execution.status = 'in_progress'; 
      execution.current_step_id = currentStepId;
      await execution.save();
      
      return execution; 
    }

    const stepLog = {
      step_name: step.name,
      step_type: step.step_type,
      status: 'completed',
      started_at: stepStartTime,
      approver_id: 'System' 
    };

    try {
      if (step.step_type === 'notification') {
        let message = step.metadata?.template || 'Notification triggered.';

        if (execution.data) {
          Object.keys(execution.data).forEach(key => {
            const regex = new RegExp(`\\$${key}`, 'g');
            message = message.replace(regex, execution.data[key]);
          });
        }

        let recipientEmail = 'Unknown';
        if (step.metadata?.recipient_type === 'triggered_user') {
          recipientEmail = execution.triggered_by;
        } else if (step.metadata?.recipient) {
          recipientEmail = step.metadata.recipient;
        }

        // Add to MongoDB Notification Ledger if going to an Employee/User
        await Notification.create({
          recipient_email: recipientEmail,
          message: message,
          workflow_id: execution.workflow_id,
          execution_id: execution._id,
          is_read: false
        });

        console.log(`[Notification Sent] To: ${recipientEmail} | Message: ${message}`);
        stepLog.error_message = `Sent to ${recipientEmail}: "${message}"`; 
      }

      if (step.step_type === 'task') {
        if (step.metadata?.task_action === 'deduct_fund') {
          const amountKey = (step.metadata.deduct_variable || '').replace('$', '');
          const amountToDeduct = Number(execution.data[amountKey]) || 0;

          if (amountToDeduct > 0) {
            let fund = await Fund.findOne();
            if (!fund) {
              fund = await Fund.create({ balance: 94500, transactions: [] });
            }

            if (fund.balance >= amountToDeduct) {
              fund.balance -= amountToDeduct;
              
              // THE FIX: Push the transaction to the history array!
              fund.transactions.push({
                type: 'debit',
                amount: amountToDeduct,
                description: `Auto-Deduction via Workflow: ${workflow.name}`,
                status: 'success'
              });
              
              await fund.save();
              console.log(`[Task] Deducted $${amountToDeduct}. New Balance: $${fund.balance}`);
              stepLog.error_message = `Transaction Success: Deducted $${amountToDeduct} from Company Wallet. Remaining Balance: $${fund.balance}`;
            } else {
              throw new Error(`Insufficient Company Funds. Tried to deduct $${amountToDeduct}, but balance is only $${fund.balance}.`);
            }
          } else {
            stepLog.error_message = `Transaction Skipped: Amount to deduct was 0 or invalid.`;
          }
        } else {
          console.log(`[Automated Task] Executing: ${step.name}`);
          stepLog.error_message = `Instructions applied: ${step.metadata?.instructions || 'None'}`;
        }
      }

      const { ruleMatched, nextStepId, evaluated_rules } = evaluateRules(step, execution.data);

      stepLog.evaluated_rules = evaluated_rules;
      stepLog.selected_next_step = ruleMatched ? nextStepId : null;
      stepLog.ended_at = new Date();

      if (!ruleMatched && (step.rules && step.rules.length > 0)) {
        if (settings.defaultRuleBehavior === 'fail') {
          stepLog.status = 'failed';
          stepLog.error_message = 'No matching rules found and no DEFAULT rule provided.';
          execution.logs.push(stepLog);
          execution.status = 'failed';
          await execution.save();
          
          await sendFailureNotification(execution, 'No matching rules found in workflow step.');
          
          if (settings.notifyOnFail) console.log(`[Alert] Sent failure email to Admin.`);
          throw new Error(`Execution failed at step ${step.name}: No matching rules found.`);
        } else {
          stepLog.status = 'completed';
          stepLog.error_message = 'No rules matched. Workspace configured to Stop Gracefully.';
          execution.logs.push(stepLog);
          currentStepId = null;
          execution.current_step_id = null;
          break;
        }
      }

      execution.logs.push(stepLog);
      currentStepId = nextStepId;
      execution.current_step_id = nextStepId; 

    } catch (error) {
       stepLog.status = 'failed';
       stepLog.error_message = error.message;
       execution.logs.push(stepLog);
       execution.status = 'failed';
       await execution.save();
       
       await sendFailureNotification(execution, error.message);
       
       if (settings.notifyOnFail) console.log(`[Alert] Sent failure email to Admin regarding step error.`);
       throw error;
    }
  }

  execution.status = 'completed';
  execution.current_step_id = null;
  execution.ended_at = new Date();
  await execution.save();
  
  if (settings.notifyOnComplete) console.log(`[Alert] Sent completion email to initiator.`);
  
  return execution;
};

module.exports = { runWorkflowEngine, evaluateRules };