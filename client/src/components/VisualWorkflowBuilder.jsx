// client/src/components/VisualWorkflowBuilder.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Play, Save, Trash2, CheckCircle, Bell, Settings, GitBranch, User, Mail, DollarSign, FileText, ArrowRight } from 'lucide-react';
import api from '../utils/axios';
import { useConfirm } from '../context/ConfirmContext';
import Button from './Button';
import Modal from './Modal';
import TextInput from './TextInput';
import Select from './Select';
import Badge from './Badge';
import RuleEditor from './RuleEditor';

// Custom Edge Component with Label
const RuleEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  animated,
  style,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isDefault = data?.condition === 'DEFAULT';
  const conditionText = data?.condition || 'Next Step';

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#58bfa1' : (isDefault ? '#9ca3af' : '#3b82f6'),
          strokeDasharray: isDefault ? '5,5' : 'none',
        }}
        className={animated ? 'animate-pulse' : ''}
        markerEnd={{ 
          type: MarkerType.ArrowClosed, 
          color: selected ? '#58bfa1' : (isDefault ? '#9ca3af' : '#3b82f6') 
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-md ${
              selected 
                ? 'bg-[#58bfa1] text-white' 
                : isDefault 
                  ? 'bg-gray-200 text-gray-600' 
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            {conditionText}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const edgeTypes = {
  rule: RuleEdge,
};

// Custom Node Component with the beautiful template
const WorkflowNode = ({ data, selected }) => {
  const step = data;
  const stepType = step?.stepType || step?.step_type || 'task';
  
  // Get icon and styling based on step type
  const getStepUI = (type) => {
    switch(type) {
      case 'approval': 
        return { 
          icon: CheckCircle, 
          color: 'success', 
          text: 'Approval', 
          bg: 'bg-green-100', 
          border: 'border-green-400',
          headerBg: 'bg-green-50',
          iconColor: 'text-green-600'
        };
      case 'notification': 
        return { 
          icon: Bell, 
          color: 'info', 
          text: 'Notification', 
          bg: 'bg-blue-100', 
          border: 'border-blue-400',
          headerBg: 'bg-blue-50',
          iconColor: 'text-blue-600'
        };
      default: 
        return { 
          icon: Settings, 
          color: 'default', 
          text: 'Task', 
          bg: 'bg-gray-100', 
          border: 'border-gray-400',
          headerBg: 'bg-gray-50',
          iconColor: 'text-gray-600'
        };
    }
  };

  const stepUI = getStepUI(stepType);
  const IconComponent = stepUI.icon;
  const ruleCount = step?.rules ? step.rules.length : 0;

  // Handle stop propagation on buttons
  const handleButtonClick = (e, callback) => {
    e.stopPropagation();
    if (callback) callback();
  };

  return (
    <div 
      className={`rounded-2xl border-2 ${selected ? 'border-[#58bfa1] shadow-xl ring-2 ring-[#58bfa1] ring-offset-2' : stepUI.border} shadow-lg overflow-hidden bg-white min-w-[320px] max-w-[380px]`}
    >
      {/* Input Handle (for all except first) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-4! h-4! bg-white! border-3! border-gray-400! hover:border-[#58bfa1]! transition-colors" 
      />
      
      {/* Node Header - Same as StepManager */}
      <div className={`${stepUI.headerBg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <IconComponent className={`w-5 h-5 ${stepUI.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Step {step?.order || 1}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                stepType === 'approval' ? 'bg-green-200 text-green-700' :
                stepType === 'notification' ? 'bg-blue-200 text-blue-700' :
                'bg-gray-200 text-gray-600'
              }`}>
                {stepUI.text}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900">{step?.label || step?.name || 'Untitled Step'}</h4>
          </div>
        </div>
        
        {/* Action Buttons - Working! */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={(e) => handleButtonClick(e, () => step?.onRules?.(step?.id))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            {ruleCount > 0 ? `${ruleCount} Rules` : 'Rules'}
          </button>
          <button 
            type="button"
            onClick={(e) => handleButtonClick(e, () => step?.onEdit?.(step?.id))}
            className="p-2 text-gray-600 hover:text-[#58bfa1] hover:bg-white rounded-lg transition-colors"
            title="Edit"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={(e) => handleButtonClick(e, () => step?.onDelete?.(step?.id))}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Node Body - Step Details - Same as StepManager */}
      <div className="p-5 bg-white">
        {/* Approval: Show assignee */}
        {stepType === 'approval' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-green-50 px-4 py-2.5 rounded-xl border border-green-100 flex-1">
              <User className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Assigned to:</span>
              <span className="font-semibold text-gray-900">{step?.metadata?.assignee_email || step?.assignee_email || 'Not assigned'}</span>
            </div>
          </div>
        )}
        
        {/* Notification: Show recipient and template */}
        {stepType === 'notification' && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">To:</span>
              <span className="font-semibold text-gray-900">
                {step?.metadata?.recipient_type === 'triggered_user' ? 'Triggered User' : 
                 step?.metadata?.recipient || step?.recipient || 'Not set'}
              </span>
            </div>
            {(step?.metadata?.template || step?.template) && (
              <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate text-gray-600">{step?.metadata?.template || step?.template}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Task: Show wallet deduction */}
        {stepType === 'task' && (step?.metadata?.task_action === 'deduct_fund' || step?.task_action === 'deduct_fund') && (
          <div className="flex items-center gap-2 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-gray-600">Wallet Deduction:</span>
            <span className="font-mono font-semibold text-emerald-700">{step?.metadata?.deduct_variable || step?.deduct_variable || 'amount'}</span>
          </div>
        )}
        
        {/* Task: Show instructions */}
        {stepType === 'task' && (step?.metadata?.instructions || step?.instructions) && (
          <div className="flex items-start gap-2 text-sm bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
            <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <span className="text-gray-600 line-clamp-2">{step?.metadata?.instructions || step?.instructions}</span>
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

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-4! h-4! bg-white! border-3! border-gray-400! hover:border-[#58bfa1]! transition-colors" 
      />
    </div>
  );
};

const nodeTypes = {
  workflow: WorkflowNode,
};

function WorkflowCanvas({ steps, onChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
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
  const { confirmAction } = useConfirm();

  const stepTypeOptions = [
    { label: 'Task (Automated/Manual)', value: 'task' },
    { label: 'Approval (Requires User)', value: 'approval' },
    { label: 'Notification (Alert/Email)', value: 'notification' }
  ];

  // Fetch team members
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

  // Create node click handlers
  const handleNodeSelect = useCallback((nodeId) => {
    console.log('Node selected:', nodeId);
    const step = steps.find(s => s.id === nodeId);
    if (step) {
      setSelectedNodeId(nodeId);
      setEditingStep(step);
      setIsModalOpen(true);
    }
  }, [steps]);

  const handleEdit = useCallback((nodeId) => {
    console.log('Edit clicked:', nodeId);
    const step = steps.find(s => s.id === nodeId);
    if (step) {
      setSelectedNodeId(nodeId);
      setEditingStep(step);
      setIsModalOpen(true);
    }
  }, [steps]);

  const handleDelete = useCallback((nodeId) => {
    console.log('Delete clicked:', nodeId);
    // Use functional update to avoid dependency on 'edges'
    setEdges((prevEdges) => prevEdges.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    const newSteps = steps.filter(s => s.id !== nodeId).map((s, index) => ({ ...s, order: index + 1 }));
    onChange(newSteps);
    setIsModalOpen(false);
    setSelectedNodeId(null);
  }, [steps, onChange, setEdges]); // Removed 'edges' from dependencies

  const handleRules = useCallback((nodeId) => {
    console.log('Rules clicked:', nodeId);
    const step = steps.find(s => s.id === nodeId);
    if (step) {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null); // Clear edge selection when opening from node
      setEditingStep(step);
      setIsRuleModalOpen(true);
    }
  }, [steps]);

  // Handle edge click - open rule editor for that specific rule
  const handleEdgeClick = useCallback((event, edge) => {
    console.log('Edge clicked:', edge);
    setSelectedEdgeId(edge.id);
    
    // Find the source step and the specific rule
    const sourceStepId = edge.source;
    const sourceStep = steps.find(s => s.id === sourceStepId);
    
    if (sourceStep && sourceStep.rules) {
      // Find the rule that corresponds to this edge
      const rule = sourceStep.rules.find(r => r.next_step === edge.target);
      if (rule) {
        setSelectedNodeId(sourceStepId);
        setEditingStep(sourceStep);
        setIsRuleModalOpen(true);
      }
    }
  }, [steps]);

  // Convert steps to nodes with callbacks
  useEffect(() => {
    if (steps && steps.length > 0) {
      // Calculate node positions - arrange in a grid-like pattern for better visibility
      const newNodes = steps.map((step, index) => {
        // Calculate position based on step index and existing connections
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = 100 + col * 350;
        const y = 100 + row * 300;
        
        return {
          id: step.id,
          type: 'workflow',
          position: { x, y },
          data: {
            ...step,
            label: step.name,
            stepType: step.step_type,
            order: index + 1,
            onSelect: handleNodeSelect,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onRules: handleRules,
          },
        };
      });
      setNodes(newNodes);

      // Create edges from rules - THIS IS THE CORE FEATURE
      const newEdges = [];
      const existingConnections = new Set(); // Track existing connections to prevent duplicates

      steps.forEach((step) => {
        if (step.rules && step.rules.length > 0) {
          step.rules.forEach((rule) => {
            if (rule.next_step && rule.next_step !== 'END') {
              // Create unique edge ID to prevent duplicates
              const edgeId = `rule-${step.id}-${rule.next_step}-${rule.condition}`;
              const connectionKey = `${step.id}-${rule.next_step}`;
              
              // Only add if this connection doesn't exist yet
              if (!existingConnections.has(connectionKey)) {
                existingConnections.add(connectionKey);
                
                const isDefault = rule.condition === 'DEFAULT';
                newEdges.push({
                  id: edgeId,
                  source: step.id,
                  target: rule.next_step,
                  type: 'rule',
                  data: {
                    condition: rule.condition,
                    ruleId: rule.id,
                    isDefault: isDefault,
                  },
                  animated: !isDefault,
                  style: { 
                    stroke: isDefault ? '#9ca3af' : '#3b82f6', 
                    strokeWidth: 2,
                  },
                  markerEnd: { 
                    type: MarkerType.ArrowClosed,
                    color: isDefault ? '#9ca3af' : '#3b82f6',
                  },
                  // Store rule info for click handling
                  label: rule.condition,
                });
              }
            }
          });
        } 
      });

      // Add sequential edges for steps without rules (default flow)
      steps.forEach((step, index) => {
        if ((!step.rules || step.rules.length === 0) && index < steps.length - 1) {
          const nextStep = steps[index + 1];
          const connectionKey = `${step.id}-${nextStep.id}`;
          
          if (!existingConnections.has(connectionKey)) {
            existingConnections.add(connectionKey);
            
            newEdges.push({
              id: `seq-${step.id}-${nextStep.id}`,
              source: step.id,
              target: nextStep.id,
              type: 'default',
              animated: false,
              style: { stroke: '#9ca3af', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed },
              data: { condition: 'DEFAULT', isDefault: true },
            });
          }
        }
      });

      setEdges(newEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [steps]); // Only depend on steps to avoid infinite loops from unstable callbacks

  // Connection handler - when user drags to connect nodes
  const onConnect = useCallback((params) => {
    // Check for duplicates
    const exists = edges.some(
      e => e.source === params.source && e.target === params.target
    );
    
    if (exists) {
      console.log('Connection already exists');
      return;
    }

    // Find source step to add a new rule
    const sourceStep = steps.find(s => s.id === params.source);
    const targetStep = steps.find(s => s.id === params.target);
    
    if (sourceStep) {
      // Add a default rule for this connection
      const newRule = {
        id: 'rule-' + Date.now(),
        condition: 'DEFAULT',
        priority: (sourceStep.rules?.length || 0) + 1,
        next_step: params.target,
      };
      
      const updatedRules = [...(sourceStep.rules || []), newRule];
      const newSteps = steps.map(s => 
        s.id === params.source ? { ...s, rules: updatedRules } : s
      );
      
      onChange(newSteps);
    }
  }, [steps, edges, onChange]);

  // Save step from modal
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
    setSelectedNodeId(null);
  };

  // Save rules from RuleEditor
  const saveRules = (updatedRules) => {
    let newSteps = [...steps];
    const index = steps.findIndex(s => s.id === selectedNodeId);
    if (index >= 0) {
      newSteps[index] = { ...steps[index], rules: updatedRules };
      onChange(newSteps);
    }
    setIsRuleModalOpen(false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const addNewStep = () => {
    const newStep = {
      id: 'step-' + Date.now(),
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
    };
    setSelectedNodeId(newStep.id);
    setEditingStep(newStep);
    setIsModalOpen(true);
  };

  // Delete edge on right click or double click
  const onEdgeDoubleClick = useCallback(async (event, edge) => {
    const confirmed = await confirmAction({
      title: 'Delete Connection',
      message: 'Are you sure you want to delete this connection?',
      type: 'danger',
      confirmText: 'Delete'
    });
    if (!confirmed) return;
    
    // Remove the rule associated with this edge
    const sourceStep = steps.find(s => s.id === edge.source);
    if (sourceStep && sourceStep.rules) {
      const updatedRules = sourceStep.rules.filter(r => r.next_step !== edge.target);
      const newSteps = steps.map(s => 
        s.id === edge.source ? { ...s, rules: updatedRules } : s
      );
      onChange(newSteps);
    }
  }, [steps, onChange, confirmAction]);

  return (
    <div className="h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={handleEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeClick={() => setSelectedEdgeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: '#9ca3af', strokeWidth: 2 },
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls className="!bg-white !border-gray-200 !shadow-lg" />
        <MiniMap 
          nodeColor={(node) => {
            const type = node.data?.stepType || node.data?.step_type;
            if (type === 'approval') return '#22c55e';
            if (type === 'notification') return '#3b82f6';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white !border-gray-200 !shadow-lg"
        />
        
        {/* Add Step Button */}
        <Panel position="top-right" className="!bg-transparent">
          <Button variant="solid" color="primary" onClick={addNewStep} className="shadow-lg">
            <Plus className="w-4 h-4 mr-2" /> Add Step
          </Button>
        </Panel>

        {/* Instructions Panel */}
        <Panel position="top-left" className="!bg-transparent">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 text-xs text-gray-600">
            <div className="font-semibold mb-1">How to use:</div>
            <div>• Drag from bottom handle to connect steps</div>
            <div>• Click edge to edit its rule</div>
            <div>• Double-click edge to delete</div>
            <div>• Use Rules button to add conditions</div>
          </div>
        </Panel>

        {/* Empty State */}
        {steps.length === 0 && (
          <Panel position="top" className="!bg-transparent">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Workflow</h3>
              <p className="text-sm text-gray-500 mb-4">Click "Add Step" to create your first workflow node</p>
              <Button variant="solid" color="primary" onClick={addNewStep}>
                <Plus className="w-4 h-4 mr-2" /> Add First Step
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* THE FIX: Changed to size="xl" and added min-w for the Edit Modal to widen it */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNodeId(null);
        }}
        title={editingStep.name ? `Edit: ${editingStep.name}` : "Add New Step"}
        size="xl" 
        footer={
          <>
            {selectedNodeId && steps.find(s => s.id === selectedNodeId) && (
              <Button 
                variant="text" 
                color="error" 
                onClick={() => handleDelete(selectedNodeId)}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button variant="text" color="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="solid" color="primary" onClick={saveStep}>
              <Save className="w-4 h-4 mr-2" /> Save Step
            </Button>
          </>
        }
      >
        <div className="space-y-5 pt-2 min-w-[500px] md:min-w-[600px]">
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

      {/* THE FIX: Changed to size="xl" and added min-w to widen the Rules Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        title={`Configure Rules: ${editingStep.name}`}
        size="xl"
      >
        <div className="min-w-[500px] md:min-w-[650px]">
          {selectedNodeId && (
            <RuleEditor
              step={editingStep}
              allSteps={steps}
              onSave={saveRules}
              onCancel={() => {
                setIsRuleModalOpen(false);
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function VisualWorkflowBuilder(props) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
}