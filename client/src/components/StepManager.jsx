// client/src/components/StepManager.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Bell, Settings, GitBranch, Play, ArrowDown, MoreVertical, User, Mail, DollarSign, FileText, X } from 'lucide-react';
import api from '../utils/axios';
import Button from './Button';
import Badge from './Badge';
import Modal from './Modal';
import TextInput from './TextInput';
import Select from './Select';
import RuleEditor from './RuleEditor';

export default function StepManager({ steps = [], onChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [activeStepForRules, setActiveStepForRules] = useState(null);
  
  const [editingStep, setEditingStep] = useState({
    id: null, 
    name: '', 
    step_type: 'task', 
    metadata: { 
      assignee_email: '', 
      template: '', 
      recipient_type: 'triggered_user', 
      recipient: '', 
      task_action: 'standard', 
      deduct_variable: '',
      instructions: ''
    }, 
    rules: []
  });

  const [teamOptions, setTeamOptions] = useState([]);

  const stepTypeOptions = [
    { label: 'Task (Automated/Manual)', value: 'task' },
    { label: 'Approval (Requires User)', value: 'approval' },
    { label: 'Notification (Alert/Email)', value: 'notification' }
  ];

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get('/auth/users');
        const users = response.data.data;
        const formattedOptions = users.map(u => ({
          label: `${u.name} (${u.role})`,
          value: u.email
        }));
        setTeamOptions(formattedOptions);
      } catch (error) {
        console.error("Failed to load staff list", error);
      }
    };
    fetchTeam();
  }, []);

  const getStepIcon = (type) => {
    switch(type) {
      case 'approval': return { icon: CheckCircle, color: 'success', text: 'Approval', bg: 'bg-green-100', border: 'border-green-400', icon: 'text-green-600' };
      case 'notification': return { icon: Bell, color: 'info', text: 'Notification', bg: 'bg-blue-100', border: 'border-blue-400', icon: 'text-blue-600' };
      default: return { icon: Settings, color: 'default', text: 'Task', bg: 'bg-gray-100', border: 'border-gray-400', icon: 'text-gray-600' };
    }
  };

  const openModal = (step = null) => {
    if (step) {
      setEditingStep(step);
    } else {
      setEditingStep({ 
        id: Math.random().toString(36).substring(7), 
        name: '', 
        step_type: 'task', 
        metadata: { 
          assignee_email: '', 
          template: '', 
          recipient_type: 'triggered_user', 
          recipient: '', 
          task_action: 'standard', 
          deduct_variable: '',
          instructions: ''
        }, 
        rules: [] 
      });
    }
    setIsModalOpen(true);
  };

  const saveStep = () => {
    if (!editingStep.name.trim()) return;
    let newSteps = [...steps];
    const existingIndex = steps.findIndex(s => s.id === editingStep.id);
    
    if (existingIndex >= 0) {
      newSteps[existingIndex] = editingStep;
    } else {
      newSteps.push({ ...editingStep, order: steps.length + 1 });
    }
    onChange(newSteps);
    setIsModalOpen(false);
  };

  const deleteStep = (idToRemove) => {
    const newSteps = steps.filter(s => s.id !== idToRemove).map((s, index) => ({ ...s, order: index + 1 }));
    onChange(newSteps);
  };

  const openRuleEditor = (step) => {
    setActiveStepForRules(step);
    setIsRuleModalOpen(true);
  };

  const saveRulesForStep = (updatedRules) => {
    const newSteps = steps.map(s => s.id === activeStepForRules.id ? { ...s, rules: updatedRules } : s);
    onChange(newSteps);
    setIsRuleModalOpen(false);
    setActiveStepForRules(null);
  };

  return (
    <div className="space-y-6">
      {/* Visual Flow Builder Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#58bfa1] to-teal-600 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Workflow Flow</h3>
            <p className="text-sm text-gray-500">{steps.length} step{steps.length !== 1 ? 's' : ''} in this workflow</p>
          </div>
        </div>
        <Button variant="solid" color="primary" onClick={() => openModal()} className="px-4">
          <Plus className="w-4 h-4 mr-2" /> Add Step
        </Button>
      </div>

      {/* Visual Flow Builder Canvas */}
      {steps.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
            <ArrowDown className="w-10 h-10 text-gray-400" />
          </div>
          <p className="mb-2 text-lg font-semibold text-gray-700">Start building your workflow</p>
          <p className="mb-6 text-sm text-gray-500 max-w-md mx-auto">Add your first step to create an automated workflow. Each step can be an approval, notification, or task.</p>
          <Button variant="solid" color="primary" onClick={() => openModal()} className="px-6">
            <Plus className="w-4 h-4 mr-2" /> Add First Step
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Flow Container */}
          <div className="space-y-0">
            {steps.map((step, index) => {
              const stepUI = getStepIcon(step.step_type);
              const IconComponent = stepUI.icon;
              const ruleCount = step.rules ? step.rules.length : 0;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="relative">
                  {/* Start Node */}
                  {index === 0 && (
                    <div className="flex justify-center mb-4">
                      <div className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium shadow-lg">
                        Start
                      </div>
                    </div>
                  )}
                  
                  {/* Arrow Connector */}
                  {index > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-[#58bfa1]"></div>
                    </div>
                  )}
                  
                  {/* Step Node */}
                  <div className={`relative bg-white rounded-2xl border-2 ${stepUI.border} shadow-lg overflow-hidden hover:shadow-xl transition-shadow`}>
                    {/* Node Header */}
                    <div className={`${stepUI.bg} px-5 py-4 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <IconComponent className={`w-5 h-5 ${stepUI.icon}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">Step {index + 1}</span>
                            <Badge text={stepUI.text} status={stepUI.color} />
                          </div>
                          <h4 className="font-semibold text-gray-900">{step.name}</h4>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openRuleEditor(step)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          {ruleCount > 0 ? `${ruleCount} Rules` : 'Rules'}
                        </button>
                        <button 
                          onClick={() => openModal(step)}
                          className="p-2 text-gray-600 hover:text-[#58bfa1] hover:bg-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteStep(step.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Node Body - Step Details */}
                    <div className="p-5 bg-white">
                      {step.step_type === 'approval' && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm bg-green-50 px-4 py-2.5 rounded-xl border border-green-100 flex-1">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">Assigned to:</span>
                            <span className="font-semibold text-gray-900">{step.metadata?.assignee_email || 'Not assigned'}</span>
                          </div>
                        </div>
                      )}
                      
                      {step.step_type === 'notification' && (
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-600">To:</span>
                            <span className="font-semibold text-gray-900">
                              {step.metadata?.recipient_type === 'triggered_user' ? 'Triggered User' : 
                               step.metadata?.recipient || 'Not set'}
                            </span>
                          </div>
                          {step.metadata?.template && (
                            <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                              <span className="truncate text-gray-600">{step.metadata.template}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {step.step_type === 'task' && step.metadata?.task_action === 'deduct_fund' && (
                        <div className="flex items-center gap-2 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-gray-600">Wallet Deduction:</span>
                          <span className="font-mono font-semibold text-emerald-700">{step.metadata?.deduct_variable || 'amount'}</span>
                        </div>
                      )}
                      
                      {step.step_type === 'task' && step.metadata?.instructions && (
                        <div className="flex items-start gap-2 text-sm bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
                          <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                          <span className="text-gray-600 line-clamp-2">{step.metadata.instructions}</span>
                        </div>
                      )}
                      
                      {/* Routing Rules Indicator */}
                      {ruleCount > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                            <GitBranch className="w-3.5 h-3.5" />
                            {ruleCount} conditional routing rule{ruleCount > 1 ? 's' : ''} configured
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* End Arrow */}
                  {!isLast && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-[#58bfa1] to-gray-300"></div>
                    </div>
                  )}
                  
                  {/* End Node */}
                  {isLast && (
                    <div className="flex justify-center mt-2">
                      <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border-2 border-dashed border-gray-300">
                        End
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Add Step Button in Flow */}
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => openModal()} 
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-[#58bfa1] rounded-xl text-sm font-medium text-gray-500 hover:text-[#58bfa1] transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add another step
            </button>
          </div>
        </div>
      )}

      {/* Step Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingStep.name ? "Edit Step" : "Add New Step"}
        size="lg"
        footer={
          <>
            <Button variant="text" color="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="solid" color="primary" onClick={saveStep}>Save Step</Button>
          </>
        }
      >
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <TextInput 
              label="Step Name" 
              placeholder="e.g., Manager Approval" 
              required 
              value={editingStep.name} 
              onChange={(e) => setEditingStep({...editingStep, name: e.target.value})} 
            />
            <Select 
              label="Step Type" 
              options={stepTypeOptions} 
              value={editingStep.step_type} 
              onChange={(val) => setEditingStep({...editingStep, step_type: val})} 
            />
          </div>
          
          {editingStep.step_type === 'approval' && (
            <div className="p-5 bg-green-50 border border-green-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <CheckCircle className="w-5 h-5" />
                Approval Configuration
              </div>
              <Select 
                label="Assign To Staff Member" 
                options={teamOptions} 
                value={editingStep.metadata?.assignee_email} 
                onChange={(val) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, assignee_email: val }})} 
                placeholder="Select a staff member..."
              />
            </div>
          )}
          
          {editingStep.step_type === 'notification' && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-blue-800 font-semibold">
                <Bell className="w-5 h-5" />
                Notification Configuration
              </div>
              <Select 
                label="Recipient Type" 
                options={[
                  { label: 'Triggered User (The Employee)', value: 'triggered_user' },
                  { label: 'Specific Staff Member', value: 'staff' },
                  { label: 'External Email Address', value: 'email' }
                ]}
                value={editingStep.metadata?.recipient_type || 'triggered_user'} 
                onChange={(val) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, recipient_type: val, recipient: '' }})} 
              />

              {editingStep.metadata?.recipient_type === 'staff' && (
                <Select 
                  label="Select Staff Member" 
                  options={teamOptions} 
                  value={editingStep.metadata?.recipient || ''} 
                  onChange={(val) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, recipient: val }})} 
                  placeholder="Select recipient..."
                />
              )}

              {editingStep.metadata?.recipient_type === 'email' && (
                <TextInput 
                  label="Email Address" 
                  placeholder="finance@company.com" 
                  value={editingStep.metadata?.recipient || ''} 
                  onChange={(e) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, recipient: e.target.value }})} 
                />
              )}

              <TextInput 
                label="Message Template" 
                placeholder="Use $fieldname for variables" 
                value={editingStep.metadata?.template || ''} 
                onChange={(e) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, template: e.target.value }})} 
              />
            </div>
          )}

          {editingStep.step_type === 'task' && (
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <Settings className="w-5 h-5" />
                Task Configuration
              </div>
              <Select 
                label="Task Action Type" 
                options={[
                  { label: 'Standard Automation / Script', value: 'standard' },
                  { label: 'Deduct from Company Wallet', value: 'deduct_fund' }
                ]}
                value={editingStep.metadata?.task_action || 'standard'} 
                onChange={(val) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, task_action: val }})} 
              />

              {editingStep.metadata?.task_action === 'deduct_fund' ? (
                <TextInput 
                  label="Amount Variable Name" 
                  placeholder="e.g., amount" 
                  value={editingStep.metadata?.deduct_variable || ''} 
                  onChange={(e) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, deduct_variable: e.target.value }})} 
                />
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions / Script</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the automated action..."
                    value={editingStep.metadata?.instructions || ''}
                    onChange={(e) => setEditingStep({...editingStep, metadata: { ...editingStep.metadata, instructions: e.target.value }})}
                    className="w-full px-4 py-3 border border-gray-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#58bfa1]/20 focus:border-[#58bfa1] transition-all resize-none bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Rule Editor Modal */}
      <Modal 
        isOpen={isRuleModalOpen} 
        onClose={() => setIsRuleModalOpen(false)} 
        title={`Routing Rules: ${activeStepForRules?.name}`}
        size="lg"
      >
        {activeStepForRules && (
          <RuleEditor 
            step={activeStepForRules} 
            allSteps={steps} 
            onSave={saveRulesForStep} 
            onCancel={() => setIsRuleModalOpen(false)} 
          />
        )}
      </Modal>
    </div>
  );
}
