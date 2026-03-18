// server/controllers/executionController.js
const Execution = require('../models/Execution');
const Workflow = require('../models/Workflow');
const Notification = require('../models/Notification'); 
const { runWorkflowEngine, evaluateRules } = require('../services/workflowEngine');

exports.startExecution = async (req, res, next) => {
  try {
    const { workflow_id } = req.params;
    const { data, triggered_by } = req.body; 

    const workflow = await Workflow.findById(workflow_id);
    if (!workflow) return res.status(404).json({ status: 'error', message: 'Workflow not found' });

    if (!workflow.steps || workflow.steps.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Workflow has no steps.' });
    }

    const safeData = (data && Object.keys(data).length > 0) ? data : { "system_note": "No input schema provided" };

    const execution = new Execution({
      workflow_id: workflow._id,
      workflow_version: workflow.version || 1,
      status: 'pending',
      data: safeData, 
      current_step_id: workflow.steps[0].id,
      triggered_by: triggered_by || 'Anonymous Admin',
      started_at: new Date(),
      logs: []
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
    const execution = await Execution.findById(req.params.id).populate('workflow_id', 'name');
    if (!execution) return res.status(404).json({ status: 'error', message: 'Not found' });
    res.status(200).json({ status: 'success', data: execution });
  } catch (error) { next(error); }
};

exports.cancelExecution = async (req, res, next) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) return res.status(404).json({ status: 'error', message: 'Not found' });
    
    if (['completed', 'canceled'].includes(execution.status)) {
      return res.status(400).json({ status: 'error', message: 'Execution cannot be canceled in its current state.' });
    }

    if (!execution.data || Object.keys(execution.data).length === 0) {
       execution.data = { "system_note": "No input schema provided" };
       execution.markModified('data');
    }

    execution.logs.push({
      step_name: 'Workflow Termination',
      step_type: 'task',
      status: 'failed',
      error_message: 'Execution was forcefully canceled by user/admin.',
      approver_id: 'System',
      started_at: new Date(),
      ended_at: new Date()
    });

    execution.status = 'canceled';
    execution.current_step_id = null;
    execution.ended_at = new Date();
    
    execution.markModified('logs');
    await execution.save();
    
    res.status(200).json({ status: 'success', data: execution });
  } catch (error) { next(error); }
};

exports.retryExecution = async (req, res, next) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution || execution.status !== 'failed') {
      return res.status(400).json({ status: 'error', message: 'Can only retry failed executions' });
    }

    if (!execution.data || Object.keys(execution.data).length === 0) {
       execution.data = { "system_note": "No input schema provided" };
       execution.markModified('data');
    }

    execution.retries = (execution.retries || 0) + 1;
    execution.status = 'pending';
    execution.ended_at = null; 
    
    if (execution.logs.length > 0 && execution.logs[execution.logs.length - 1].status === 'failed') {
       execution.logs.pop();
    }
    
    await execution.save();

    const finalExecutionState = await runWorkflowEngine(execution._id);
    res.status(200).json({ status: 'success', data: finalExecutionState });
  } catch (error) { next(error); }
};

exports.getAllExecutions = async (req, res, next) => {
  try {
    const executions = await Execution.find().populate('workflow_id', 'name').sort({ started_at: -1 });
    res.status(200).json({ status: 'success', data: executions });
  } catch (error) { next(error); }
};

exports.getStaffInbox = async (req, res, next) => {
  try {
    const { email } = req.query;
    const allExecutions = await Execution.find({ status: { $in: ['pending', 'in_progress'] } }).populate('workflow_id');
    const inbox = { approvals: [], tasks: [], notifications: [], history: [] };

    allExecutions.forEach(exe => {
      if (!exe.workflow_id || !exe.workflow_id.steps) return;
      const currentStep = exe.workflow_id.steps.find(s => s.id === exe.current_step_id);
        
      if (currentStep && currentStep.metadata?.assignee_email === email) {
        let extractedPriority = 'normal';
        if (exe.data && exe.data.priority) {
            extractedPriority = String(exe.data.priority).toLowerCase();
        }

        const taskData = {
          _id: exe._id, 
          workflowName: exe.workflow_id.name, 
          started_at: exe.started_at,
          triggered_by: exe.triggered_by, 
          data: exe.data, 
          stepName: currentStep.name,
          priority: extractedPriority
        };
        
        if (currentStep.step_type === 'approval') inbox.approvals.push(taskData);
        if (currentStep.step_type === 'task') inbox.tasks.push(taskData);
        if (currentStep.step_type === 'notification') inbox.notifications.push(taskData);
      }
    });

    const historyExecutions = await Execution.find().populate('workflow_id');
    historyExecutions.forEach(exe => {
      if (!exe.logs) return;
      exe.logs.forEach(log => {
        if (log.approver_id === email) {
          inbox.history.push({
            executionId: exe._id, 
            workflowName: exe.workflow_id?.name || 'Deleted Workflow',
            stepName: log.step_name, 
            action: log.status, 
            date: log.ended_at || log.started_at
          });
        }
      });
    });

    inbox.history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ status: 'success', data: inbox });
  } catch (error) { next(error); }
};

exports.respondToTask = async (req, res, next) => {
  try {
    const { action, email } = req.body;
    
    // THE FIX: We MUST populate the entire workflow_id here, not just the name, 
    // so the engine can read the rules for the next step!
    const execution = await Execution.findById(req.params.id).populate('workflow_id');
    if (!execution) return res.status(404).json({ status: 'error', message: 'Execution not found' });

    if (!execution.data || Object.keys(execution.data).length === 0) {
       execution.data = { "system_note": "No input schema provided" };
       execution.markModified('data');
    }

    const workflow = execution.workflow_id;
    // Added safety check to ensure steps exist before trying to find the current step
    const currentStep = (workflow && workflow.steps) ? workflow.steps.find(s => s.id === execution.current_step_id) : null;

    const lastLogIndex = execution.logs.length - 1;
    const isUpdatingLog = lastLogIndex >= 0 && execution.logs[lastLogIndex].step_type === 'approval';

    // If Manager Rejects
    if (action !== 'approve') {
      if (isUpdatingLog) {
        execution.logs[lastLogIndex].status = 'failed';
        execution.logs[lastLogIndex].approver_id = email;
        execution.logs[lastLogIndex].ended_at = new Date();
        execution.markModified('logs'); 
      }
      execution.status = 'failed';
      execution.current_step_id = null;
      execution.ended_at = new Date();
      await execution.save();
      
      await Notification.create({
        recipient_email: execution.triggered_by,
        message: `Your request "${workflow?.name || 'Workflow'}" was rejected by ${email}.`,
        workflow_id: execution.workflow_id._id,
        execution_id: execution._id,
        is_read: false
      });

      return res.status(200).json({ status: 'success', message: 'Task rejected.' });
    }

    let nextStepId = null;
    let evaluated_rules = [];
    
    if (currentStep) {
      const result = evaluateRules(currentStep, execution.data);
      nextStepId = result.ruleMatched ? result.nextStepId : null;
      evaluated_rules = result.evaluated_rules;
    }

    if (isUpdatingLog) {
      execution.logs[lastLogIndex].status = 'completed';
      execution.logs[lastLogIndex].approver_id = email;
      execution.logs[lastLogIndex].evaluated_rules = evaluated_rules;
      execution.logs[lastLogIndex].selected_next_step = nextStepId;
      execution.logs[lastLogIndex].ended_at = new Date();
      execution.markModified('logs'); 
    }

    execution.current_step_id = nextStepId;

    if (nextStepId) {
      execution.status = 'in_progress';
      await execution.save();
      const finalState = await runWorkflowEngine(execution._id);
      return res.status(200).json({ status: 'success', message: 'Routed to next step', data: finalState });
    } else {
      execution.status = 'completed';
      execution.current_step_id = null;
      execution.ended_at = new Date();
      await execution.save();
      return res.status(200).json({ status: 'success', message: 'Workflow complete', data: execution });
    }
  } catch (error) { next(error); }
};

exports.getStaffPerformance = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ status: 'error', message: 'Email required' });

    const allExecutions = await Execution.find({}, 'logs');

    let approved = 0;
    let rejected = 0;
    let totalResponseTimeMs = 0;
    let responseCount = 0;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        dateString: d.toDateString(),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        approved: 0,
        rejected: 0
      });
    }

    allExecutions.forEach(exe => {
      if (!exe.logs) return;
      
      exe.logs.forEach(log => {
        if (log.approver_id === email) {
          if (log.status === 'completed') approved++;
          if (log.status === 'failed' || log.status === 'rejected') rejected++;

          if (log.started_at && log.ended_at) {
            const timeDiff = new Date(log.ended_at) - new Date(log.started_at);
            totalResponseTimeMs += timeDiff;
            responseCount++;
          }

          const logDate = new Date(log.ended_at || log.started_at).toDateString();
          const dayMatch = last7Days.find(d => d.dateString === logDate);
          if (dayMatch) {
            if (log.status === 'completed') dayMatch.approved++;
            if (log.status === 'failed' || log.status === 'rejected') dayMatch.rejected++;
          }
        }
      });
    });

    let avgTimeHours = 0;
    if (responseCount > 0) {
      avgTimeHours = ((totalResponseTimeMs / responseCount) / (1000 * 60 * 60)).toFixed(1);
    }

    res.status(200).json({
      status: 'success',
      data: {
        approved,
        rejected,
        total: approved + rejected,
        avgTimeHours: Number(avgTimeHours),
        weeklyBreakdown: last7Days
      }
    });
  } catch (error) {
    next(error);
  }
};