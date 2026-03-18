// client/src/pages/WorkflowEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, Settings, Database, Layers, Workflow, ChevronRight, Check } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import api from '../utils/axios';

import Button from '../components/Button';
import TextInput from '../components/TextInput';
import Toggle from '../components/Toggle';
import Badge from '../components/Badge';
import SchemaBuilder from '../components/SchemaBuilder';
import VisualWorkflowBuilder from '../components/VisualWorkflowBuilder';

const AccordionSection = ({ title, icon: Icon, isExpanded, onToggle, children, description, stepNumber, isComplete }) => (
  <div className={`bg-white border shadow-sm overflow-hidden mb-6 transition-all duration-200 ${isExpanded ? 'border-[#58bfa1] shadow-md' : 'border-gray-200'}`}>
    <button onClick={onToggle} className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors focus:outline-none">
      <div className="flex items-center gap-4 text-left">
        <div className={`p-2.5 border transition-colors ${isExpanded ? 'bg-[#58bfa1] text-white border-[#58bfa1]' : 'bg-teal-50 text-[#58bfa1] border-teal-100'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step {stepNumber}</span>
            {isComplete && <Check className="w-4 h-4 text-green-500" />}
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-none mt-0.5">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-1.5">{description}</p>}
        </div>
      </div>
      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
    <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="p-6 bg-gray-50/50 border-t border-gray-100">{children}</div>
    </div>
  </div>
);

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const isNew = !id || id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState({ general: true, schema: true, steps: true });

  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    is_active: true,
    input_schema: {},
    steps: []
  });

  useEffect(() => {
    if (!isNew) fetchWorkflowDetails();
  }, [id]);

  const fetchWorkflowDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/workflows/${id}`);
      setWorkflow(response.data.data);
    } catch (error) {
      showAlert('danger', 'Failed to load workflow.');
      navigate('/workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workflow.name.trim()) {
      showAlert('danger', 'Workflow Name is required.');
      setExpanded(prev => ({ ...prev, general: true }));
      return;
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      showAlert('danger', 'At least one workflow step is required.');
      setExpanded(prev => ({ ...prev, steps: true }));
      return;
    }

    const payload = {
      name: workflow.name,
      description: workflow.description,
      input_schema: workflow.input_schema,
      steps: workflow.steps,
      is_active: workflow.is_active
    };

    try {
      setIsSaving(true);
      if (isNew) {
        await api.post('/workflows', payload);
        showAlert('success', 'Workflow created successfully!');
      } else {
        await api.put(`/workflows/${id}`, payload);
        showAlert('success', `Workflow updated! Version ${workflow.version + 1} deployed.`);
      }
      navigate('/workflows');
    } catch (error) {
      console.error('Save error:', error);
      showAlert('danger', error.response?.data?.message || 'Save failed. Check console.');
    } finally {
      setIsSaving(false);
    }
  };

  const isGeneralComplete = workflow.name.trim().length > 0;
  const isSchemaComplete = Object.keys(workflow.input_schema || {}).length > 0;
  const isStepsComplete = workflow.steps && workflow.steps.length > 0;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Loading workflow...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/workflows" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg">
                <Workflow className="w-6 h-6 text-[#58bfa1]" />
              </div>
              {isNew ? 'Design New Blueprint' : 'Update Blueprint'}
            </h1>
            {!isNew && (
              <div className="flex items-center gap-2 mt-1">
                <Badge text={`Editing v${workflow.version}`} status="info" />
                <span className="text-sm text-gray-500">Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        <Button 
          variant="solid" 
          color="primary" 
          onClick={handleSave} 
          disabled={isSaving} 
          className="shadow-lg"
          icon={Save}
        >
          {isSaving ? 'Processing...' : (isNew ? 'Save Blueprint' : 'Deploy New Version')}
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
        {[
          { key: 'general', label: 'General', icon: Settings },
          { key: 'schema', label: 'Data Fields', icon: Database },
          { key: 'steps', label: 'Workflow Steps', icon: Layers }
        ].map((step, index) => {
          const isComplete = step.key === 'general' ? isGeneralComplete : step.key === 'schema' ? isSchemaComplete : isStepsComplete;
          const isCurrent = expanded[step.key];
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.key}>
              <button
                onClick={() => setExpanded({...expanded, [step.key]: !expanded[step.key]})}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isCurrent 
                    ? 'bg-white text-[#58bfa1] shadow-sm' 
                    : isComplete
                      ? 'text-green-600'
                      : 'text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.label}</span>
                {isComplete && !isCurrent && <Check className="w-4 h-4" />}
              </button>
              {index < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Accordion Sections */}
      <AccordionSection 
        title="General Information" 
        description="Name and description of the business process" 
        icon={Settings} 
        isExpanded={expanded.general} 
        stepNumber="1"
        isComplete={isGeneralComplete}
        onToggle={() => setExpanded({...expanded, general: !expanded.general})}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput 
            label="Blueprint Name" 
            placeholder="e.g., Textile Inventory Request" 
            required 
            value={workflow.name} 
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })} 
          />
          <TextInput 
            label="Description" 
            placeholder="Explain the purpose of this workflow..." 
            value={workflow.description || ''} 
            onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })} 
          />
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Active Status</p>
            <p className="text-xs text-gray-500 mt-0.5">Only active workflows can be discovered and executed</p>
          </div>
          <Toggle 
            label={workflow.is_active ? 'Active' : 'Inactive'}
            checked={workflow.is_active !== false}
            onChange={(val) => setWorkflow({ ...workflow, is_active: val })}
          />
        </div>
      </AccordionSection>

      <AccordionSection 
        title="Data Fields (Schema)" 
        description="The input fields the user must fill to start this process" 
        icon={Database} 
        isExpanded={expanded.schema} 
        stepNumber="2"
        isComplete={isSchemaComplete}
        onToggle={() => setExpanded({...expanded, schema: !expanded.schema})}
      >
        <SchemaBuilder 
          schema={workflow.input_schema} 
          onChange={(newSchema) => setWorkflow({ ...workflow, input_schema: newSchema })} 
        />
      </AccordionSection>

      <AccordionSection 
        title="Workflow Routing (Steps)" 
        description="Design the multi-step approval sequence" 
        icon={Layers} 
        isExpanded={expanded.steps} 
        stepNumber="3"
        isComplete={isStepsComplete}
        onToggle={() => setExpanded({...expanded, steps: !expanded.steps})}
      >
        <VisualWorkflowBuilder 
          steps={workflow.steps} 
          onChange={(newSteps) => setWorkflow({ ...workflow, steps: newSteps })} 
        />
      </AccordionSection>
    </div>
  );
}
