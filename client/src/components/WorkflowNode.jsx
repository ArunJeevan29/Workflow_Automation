// client/src/components/WorkflowNode.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle, Bell, Settings, User, Mail, DollarSign, FileText, Edit2, Trash2, GitBranch, X } from 'lucide-react';

const WorkflowNode = ({ data, selected }) => {
  const getNodeStyles = () => {
    switch (data.stepType) {
      case 'approval':
        return {
          bg: 'bg-green-50',
          border: 'border-green-400',
          icon: 'text-green-600',
          header: 'bg-green-100',
          accent: '#22c55e'
        };
      case 'notification':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          icon: 'text-blue-600',
          header: 'bg-blue-100',
          accent: '#3b82f6'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-400',
          icon: 'text-gray-600',
          header: 'bg-gray-100',
          accent: '#6b7280'
        };
    }
  };

  const styles = getNodeStyles();
  const Icon = data.stepType === 'approval' ? CheckCircle : data.stepType === 'notification' ? Bell : Settings;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onEdit) data.onEdit(data.id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onDelete) data.onDelete(data.id);
  };

  const handleRules = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onRules) data.onRules(data.id);
  };

  const handleCancelConnection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onCancelConnection) data.onCancelConnection(data.id);
  };

  return (
    <div className={`rounded-xl border-2 ${styles.border} ${selected ? 'shadow-lg ring-2 ring-[#58bfa1] ring-offset-2' : 'shadow-md'} bg-white overflow-hidden min-w-[280px] max-w-[320px]`}>
      {/* Input Handle */}
      {data.isStart !== true && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-4 !h-4 !bg-white !border-3 !border-gray-400 hover:!border-[#58bfa1] cursor-crosshair"
          style={{ backgroundColor: styles.accent }}
        />
      )}
      
      {/* Header */}
      <div className={`${styles.header} px-3 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${styles.icon}`} />
          <span className="text-xs font-bold text-gray-500 uppercase">{data.stepType}</span>
        </div>
        
        {/* Action Buttons - Larger and more visible */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRules}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-200 hover:bg-blue-300 rounded-lg transition-colors"
            title="Configure Routing Rules"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
          <button
            onClick={handleEdit}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            title="Edit Step"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-200 hover:bg-red-300 rounded-lg transition-colors"
            title="Delete Step"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{data.label}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
            data.stepType === 'approval' ? 'bg-green-200 text-green-700' :
            data.stepType === 'notification' ? 'bg-blue-200 text-blue-700' :
            'bg-gray-200 text-gray-600'
          }`}>
            Step {data.order}
          </span>
        </div>
        
        {/* Metadata Preview */}
        {data.stepType === 'approval' && data.metadata?.assignee_email && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg mb-2">
            <User className="w-3.5 h-3.5 text-green-600" />
            <span className="truncate">{data.metadata.assignee_email}</span>
          </div>
        )}
        
        {data.stepType === 'notification' && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg mb-2">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate">
              {data.metadata?.recipient_type === 'triggered_user' ? 'Triggered User' : 
               data.metadata?.recipient || 'Not set'}
            </span>
          </div>
        )}
        
        {data.stepType === 'task' && data.metadata?.task_action === 'deduct_fund' && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Wallet: {data.metadata?.deduct_variable || 'amount'}</span>
          </div>
        )}

        {data.stepType === 'task' && data.metadata?.instructions && (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg mb-2">
            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{data.metadata.instructions}</span>
          </div>
        )}

        {data.rules && data.rules.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {data.rules.length} routing rule{data.rules.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !bg-white !border-3 !border-gray-400 hover:!border-[#58bfa1] cursor-crosshair"
        style={{ backgroundColor: styles.accent }}
      />
    </div>
  );
};

export default memo(WorkflowNode);
