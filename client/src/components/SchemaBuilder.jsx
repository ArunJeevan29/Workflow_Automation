// client/src/components/SchemaBuilder.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Database, Type, Hash, ToggleLeft, GripVertical } from 'lucide-react';
import TextInput from './TextInput';
import Select from './Select';
import Toggle from './Toggle';
import Button from './Button';

export default function SchemaBuilder({ schema = {}, onChange }) {
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (schema) {
      const initialFields = Object.entries(schema).map(([key, config]) => ({
        id: Math.random().toString(36).substring(7),
        name: key,
        type: config.type || 'string',
        required: config.required || false,
        allowed_values: config.allowed_values ? config.allowed_values.join(',') : '' 
      }));
      setFields(initialFields);
    }
  }, []);

  const updateParent = (currentFields) => {
    const newSchema = {};
    currentFields.forEach(field => {
      if (field.name && field.name.trim()) {
        newSchema[field.name.trim()] = {
          type: field.type,
          required: field.required
        };
        
        if (field.allowed_values && field.allowed_values.trim()) {
          newSchema[field.name.trim()].allowed_values = field.allowed_values
            .split(',')
            .map(val => val.trim())
            .filter(val => val.length > 0);
        }
      }
    });
    onChange(newSchema);
  };

  const addField = (e) => {
    if (e) e.preventDefault();
    const newFields = [...fields, { 
      id: Math.random().toString(36).substring(7), 
      name: '', 
      type: 'string', 
      required: false, 
      allowed_values: '' 
    }];
    setFields(newFields);
    updateParent(newFields);
  };

  const removeField = (idToRemove) => {
    const newFields = fields.filter(f => f.id !== idToRemove);
    setFields(newFields);
    updateParent(newFields);
  };

  const updateField = (id, key, value) => {
    const newFields = fields.map(f => f.id === id ? { ...f, [key]: value } : f);
    setFields(newFields);
    updateParent(newFields);
  };

  const typeOptions = [
    { label: 'Text', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Dropdown', value: 'boolean' }
  ];

  const getTypeIcon = (type) => {
    switch(type) {
      case 'number': return Hash;
      case 'boolean': return ToggleLeft;
      default: return Type;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'number': return 'Number';
      case 'boolean': return 'Dropdown';
      default: return 'Text';
    }
  };

  return (
    <div className="space-y-4=">
      {fields.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl flex items-center justify-center">
            <Database className="w-7 h-7 text-[#58bfa1]" />
          </div>
          <p className="mb-1 text-base font-medium text-gray-700">No input fields defined</p>
          <p className="mb-5 text-sm text-gray-500">Add fields that users will fill when starting this workflow</p>
          <Button variant="solid" color="primary" onClick={addField} className="px-5">
            <Plus className="w-4 h-4 mr-2" />
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-13 gap-4 px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-3">Field Name</div>
            <div className="col-span-3">Data Type</div>
            <div className="col-span-4">Allowed Values</div>
            <div className="col-span-1">Required</div>
          </div>

          {fields.map((field, index) => {
            const TypeIcon = getTypeIcon(field.type);
            
            return (
              <div 
                key={field.id} 
                className="relative group bg-white border border-gray-200 rounded-xl p-4 transition-all hover:border-[#58bfa1] hover:shadow-lg"
              >
                {/* Drag Handle + Index */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#58bfa1] rounded-l-xl transition-colors"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-gray-100 group-hover:bg-[#58bfa1] text-gray-500 group-hover:text-white rounded-full text-xs font-bold transition-colors">
                  {index + 1}
                </div>
              
                {/* Delete Button */}
                <button 
                  onClick={() => removeField(field.id)}
                  className="absolute right-3 top-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                  title="Remove Field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Form Grid */}
                <div className="grid grid-cols-12 gap-4 items-center pl-8">
                  {/* Field Name */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="e.g., amount"
                      value={field.name}
                      onChange={(e) => updateField(field.id, 'name', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#58bfa1]/30 focus:bg-white transition-all"
                    />
                  </div>
                  
                  {/* Data Type - Compact Dropdown */}
                  <div className="col-span-3">
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, 'type', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#58bfa1]/30 focus:bg-white transition-all cursor-pointer"
                    >
                      {typeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Allowed Values */}
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Optional: comma-separated values"
                      value={field.allowed_values}
                      onChange={(e) => updateField(field.id, 'allowed_values', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#58bfa1]/30 focus:bg-white transition-all"
                    />
                  </div>
                  
                  {/* Required Toggle */}
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => updateField(field.id, 'required', !field.required)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${
                        field.required ? 'bg-[#58bfa1]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        field.required ? 'translate-x-4' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Field Button */}
          <button 
            onClick={addField} 
            className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-[#58bfa1] rounded-xl text-sm font-medium text-gray-500 hover:text-[#58bfa1] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add another field
          </button>
        </div>
      )}
    </div>
  );
}

