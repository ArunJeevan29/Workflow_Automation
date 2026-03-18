// client/src/pages/ExecuteWorkflow.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, Clock, XCircle, ChevronRight, FileText, Code2, RefreshCw, XSquare, Check, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

import Button from '../components/Button';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import Badge from '../components/Badge';

export default function ExecuteWorkflow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { confirmAction } = useConfirm();

  const [workflow, setWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [executionStatus, setExecutionStatus] = useState('idle');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [triggeredBy, setTriggeredBy] = useState('');
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);

      // ATTEMPT 1: Is this an Execution ID?
      try {
        const execResponse = await api.get(`/executions/${id}`);
        const executionData = execResponse.data.data;

        if (executionData) {
          setIsReadOnly(true); 
          setTriggeredBy(executionData.triggered_by);
          
          let fullWorkflow = null;
          try {
            const wfId = typeof executionData.workflow_id === 'object' ? executionData.workflow_id._id : executionData.workflow_id;
            const wfResponse = await api.get(`/workflows/${wfId}`);
            fullWorkflow = wfResponse.data.data;
          } catch (e) {
            console.warn("Could not fetch full workflow blueprint for translations.");
          }

          setWorkflow({
            name: executionData.workflow_id?.name || fullWorkflow?.name || 'Deleted Workflow',
            version: executionData.workflow_version || 1,
            input_schema: fullWorkflow?.input_schema || executionData.data || {}
          });
          setFormData(executionData.data || {}); 

          const getStepName = (stepId) => {
            if (!stepId) return null;
            if (fullWorkflow && fullWorkflow.steps) {
              const step = fullWorkflow.steps.find(s => s.id === stepId);
              if (step) return step.name;
            }
            return stepId; 
          };

          const mappedLogs = (executionData.logs || []).map(log => {
            let nextStepText = 'End of Workflow';
            if (log.status === 'pending_approval' || log.status === 'pending') {
              nextStepText = 'Awaiting Approval';
            } else if (log.selected_next_step) {
              nextStepText = getStepName(log.selected_next_step); 
            }

            return {
              stepName: log.step_name,
              status: getStatusLabel(log.status),
              badgeType: getStatusBadgeType(log.status),
              duration: getDuration(log.started_at, log.ended_at),
              nextStep: nextStepText,
              approver: log.approver_id || 'System',
              evaluatedRules: log.evaluated_rules || [],
              errorMessage: log.error_message,
              timestamp: log.started_at
            };
          });

          setExecutionLogs(mappedLogs);
          setExecutionStatus(executionData.status);
          setIsLoading(false);
          return; 
        }
      } catch (execError) {
        // Not an execution, proceed
      }

      // ATTEMPT 2: It must be a Workflow ID!
      const wfResponse = await api.get(`/workflows/${id}`);
      const workflowData = wfResponse.data.data;
      setWorkflow(workflowData);
      
      const initialData = {};
      const schema = workflowData.input_schema || workflowData.schema || {};
      
      if (Array.isArray(schema)) {
        schema.forEach(field => { initialData[field.name] = ''; });
      } else {
        Object.keys(schema).forEach(key => { initialData[key] = ''; });
      }
      setFormData(initialData);

    } catch (error) {
      showAlert('danger', 'Failed to load data.');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRetry = async () => {
    try {
      setIsExecuting(true);
      const response = await api.post(`/executions/${id}/retry`);
      
      // THE FIX: Strict payload validation
      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Retry failed.');
      }
      
      showAlert('success', 'Retrying failed step...');
      fetchDetails();
    } catch (error) {
      showAlert('danger', error.response?.data?.message || error.message || 'Failed to retry execution');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirmAction({
      title: 'Cancel Workflow',
      message: 'Are you sure you want to cancel this workflow? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Cancel Workflow'
    });
    if (!confirmed) return;
    try {
      setIsExecuting(true);
      const response = await api.post(`/executions/${id}/cancel`);
      
      // THE FIX: Strict payload validation
      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Cancelation failed.');
      }

      showAlert('success', 'Workflow execution canceled');
      fetchDetails();
    } catch (error) {
      showAlert('danger', error.response?.data?.message || error.message || 'Failed to cancel execution');
    } finally {
      setIsExecuting(false);
    }
  };

  const renderField = (name, config, isArrayField = false) => {
    const label = name.replace(/_/g, ' ');
    const required = isArrayField ? config.required : config.required;
    const allowedValues = isArrayField ? (config.allowed_values || []) : (config.allowed_values || []);

    if (allowedValues.length > 0) {
      const options = allowedValues.map(v => ({ label: v, value: v }));
      return (
        <Select
          key={name}
          label={label}
          required={required}
          options={options}
          value={formData[name]}
          onChange={(val) => handleInputChange(name, val)}
        />
      );
    }

    return (
      <TextInput
        key={name}
        label={label}
        required={required}
        type={config.type === 'number' ? 'number' : 'text'}
        value={formData[name]}
        onChange={(e) => handleInputChange(name, e.target.value)}
      />
    );
  };

  const getStatusLabel = (status) => {
    if (status === 'completed') return 'Completed';
    if (status === 'pending_approval' || status === 'pending') return 'Awaiting Approval';
    if (status === 'failed') return 'Failed';
    if (status === 'canceled') return 'Canceled';
    return 'Pending';
  };

  const getStatusBadgeType = (status) => {
    if (status === 'completed') return 'success';
    if (status === 'pending_approval' || status === 'pending') return 'warning';
    if (status === 'failed' || status === 'canceled') return 'error';
    return 'warning';
  };

  const getDuration = (start, end) => {
    if (!start || !end) return 'Processing...';
    const seconds = Math.floor((new Date(end) - new Date(start)) / 1000);
    return `${seconds}s`;
  };

  const startExecution = async () => {
    setIsExecuting(true);
    setExecutionStatus('running');
    setExecutionLogs([]);

    try {
      const response = await api.post(`/workflows/${id}/execute`, {
        data: formData,
        triggered_by: user.email
      });

      // THE FIX: Check if the backend returned a logical error hidden inside a 200 OK
      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Engine execution failed.');
      }
      
      // THE FIX: Check if the Execution ID payload is actually present before navigating
      if (!response.data?.data?._id) {
        throw new Error('System aborted the workflow execution.');
      }

      // If we pass both checks, it is completely safe to show the success toast!
      showAlert('success', 'Workflow triggered successfully!');
      navigate(`/execute/${response.data.data._id}`, { replace: true });
      window.location.reload(); 
    } catch (error) {
      // Prioritize the actual backend error message over a generic one
      const errorMessage = error.response?.data?.message || error.message || 'Execution failed due to a system error.';
      
      showAlert('danger', errorMessage);
      setExecutionStatus('failed');
      
      setExecutionLogs([{
        stepName: 'System Engine Alert',
        status: 'Failed',
        badgeType: 'error',
        duration: '0s',
        nextStep: 'Execution Terminated',
        approver: 'System',
        errorMessage: errorMessage,
        timestamp: new Date().toISOString()
      }]);
      
      setIsExecuting(false);
      setExpandedStep(0); 
    }
  };

  if (isLoading || !workflow) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading workflow...</p>
        </div>
      </div>
    );
  }

  const schema = workflow.input_schema || workflow.schema || {};
  
  // Permission Logic
  const canRetry = user.role === 'Admin' && executionStatus === 'failed';
  
  const canCancel = 
    (user.role === 'Admin' && ['pending', 'in_progress', 'failed'].includes(executionStatus)) || 
    (user.email === triggeredBy && ['pending', 'in_progress'].includes(executionStatus));

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
    
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3 flex-wrap capitalize">
              {isReadOnly ? 'Execution:' : 'Execute:'} {workflow.name}
              <Badge text={`v${workflow.version || 1}`} status="info" />
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {isReadOnly ? 'Historical input data and timeline for this execution.' : 'Submit the form to trigger the backend engine.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={fetchDetails} 
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {canCancel && (
            <Button variant="outline" color="error" onClick={handleCancel} disabled={isExecuting} icon={XSquare}>
              Cancel Workflow
            </Button>
          )}
          {canRetry && (
            <Button variant="solid" color="primary" onClick={handleRetry} disabled={isExecuting} loading={isExecuting} icon={RefreshCw} className="bg-[#58bfa1] hover:bg-teal-600">
              Retry Failed Step
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Form Input */}
        <div className="lg:col-span-5">
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#58bfa1]" /> 
              Input Data
            </h2>
            
            <div className="space-y-5">
              {isReadOnly ? (
                Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 font-medium rounded-lg shadow-inner">
                      {value?.toString() || '--'}
                    </div>
                  </div>
                ))
              ) : (
                Array.isArray(schema)
                ? schema.map(field => renderField(field.name, field, true))
                : Object.entries(schema).map(([key, config]) => renderField(key, config, false))
              )}
            </div>

            {!isReadOnly && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <Button 
                  variant="solid" 
                  color="primary" 
                  className="w-full justify-center py-3 bg-[#58bfa1] hover:bg-teal-600 shadow-sm hover:shadow" 
                  onClick={startExecution} 
                  disabled={isExecuting || executionStatus === 'failed'}
                  loading={isExecuting}
                  icon={Play}
                >
                  {isExecuting ? 'Processing Engine...' : 'Start Workflow Engine'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Execution Timeline */}
        <div className="lg:col-span-7">
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Execution Timeline</h2>
              {(isReadOnly || executionStatus === 'failed') && (
                <Badge 
                  text={executionStatus.toUpperCase()} 
                  status={getStatusBadgeType(executionStatus)} 
                />
              )}
            </div>
            
            {executionStatus === 'idle' ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl">
                <Clock className="w-12 h-12 mb-3 opacity-20 text-[#58bfa1]" />
                <p className="font-semibold text-gray-500">Waiting for trigger...</p>
                <p className="text-xs mt-1">Submit the form to start the timeline.</p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                
                {executionLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`relative flex gap-4 transition-all duration-300 ${
                      expandedStep === index ? 'bg-gray-50/80 rounded-xl p-2 -mx-2' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-sm border border-white ${
                      log.badgeType === 'success' ? 'bg-emerald-100' : 
                      log.badgeType === 'warning' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      {log.badgeType === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : log.badgeType === 'warning' ? (
                        <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className={`p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer ${log.badgeType === 'error' ? 'border-red-100' : 'border-gray-200'}`}
                        onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className={`text-sm font-bold ${log.badgeType === 'error' ? 'text-red-700' : 'text-gray-900'}`}>
                              Step {index + 1}: {log.stepName}
                            </h3>
                            <p className="text-xs font-medium text-gray-400 mt-0.5">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                            </p>
                          </div>
                          <Badge text={log.status} status={log.badgeType} />
                        </div>

                        {/* Expanded content */}
                        {expandedStep === index && (
                          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            {log.errorMessage && (
                              <div className={`p-3 text-sm font-medium rounded-lg shadow-inner ${
                                log.status === 'Failed' || log.status === 'failed'
                                ? 'bg-red-50/80 text-red-700 border border-red-100' 
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}>
                                <div className="flex items-start gap-2.5">
                                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span className="leading-relaxed">{log.errorMessage}</span>
                                </div>
                              </div>
                            )}

                            {log.evaluatedRules && log.evaluatedRules.length > 0 && (
                              <div className="bg-gray-50 p-3 border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                  <Code2 className="w-3.5 h-3.5" /> 
                                  Rules Evaluated
                                </div>
                                <div className="space-y-2">
                                  {log.evaluatedRules.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs font-mono bg-white p-2.5 border border-gray-200 rounded-lg shadow-sm">
                                      <span className="text-gray-700 truncate flex-1" title={r.rule}>
                                        {r.rule || 'DEFAULT FALLBACK'}
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span className="text-gray-400">→</span>
                                        <span className={`font-semibold px-2 py-0.5 rounded ${
                                          r.result 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}>
                                          {r.result ? 'TRUE' : 'FALSE'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 border border-gray-100 rounded-lg">
                              <div>
                                <span className="text-gray-400 font-semibold uppercase tracking-wider block mb-1">Assigned To</span>
                                <span className="font-bold text-gray-700">{log.approver}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-semibold uppercase tracking-wider block mb-1">Duration</span>
                                <span className="font-bold text-gray-700">{log.duration}</span>
                              </div>
                              <div className="col-span-2 pt-3 mt-1 border-t border-gray-200">
                                <span className="text-gray-400 font-semibold uppercase tracking-wider">Next Action:</span>
                                <span className="font-bold text-gray-900 ml-2 inline-flex items-center gap-1">
                                  {log.nextStep} 
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Status Messages */}
                {(executionStatus === 'in_progress' || executionStatus === 'pending') && (
                  <div className="ml-14 p-4 bg-amber-50 border border-amber-100 text-sm font-semibold text-amber-800 flex gap-3 items-center rounded-xl shadow-sm">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></div>
                    Engine Paused — Awaiting user approval or manual task completion.
                  </div>
                )}
                {executionStatus === 'canceled' && (
                  <div className="ml-14 p-4 bg-red-50 border border-red-100 text-sm font-semibold text-red-800 flex gap-3 items-center rounded-xl shadow-sm">
                    <XSquare className="w-5 h-5" />
                    Execution was forcefully canceled.
                  </div>
                )}
                {executionStatus === 'completed' && (
                  <div className="ml-14 p-4 bg-emerald-50 border border-emerald-100 text-sm font-semibold text-emerald-800 flex gap-3 items-center rounded-xl shadow-sm">
                    <Check className="w-5 h-5" />
                    Engine execution completed successfully.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}