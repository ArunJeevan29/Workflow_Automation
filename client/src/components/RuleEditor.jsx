// client/src/components/RuleEditor.jsx
import React, { useState, useEffect } from'react';
import { Plus, Trash2, GripVertical, AlertCircle } from'lucide-react';
import TextInput from'./TextInput';
import Select from'./Select';
import Button from'./Button';

export default function RuleEditor({ step, allSteps, onSave, onCancel }) {
 const [rules, setRules] = useState([]);
 const [draggedIndex, setDraggedIndex] = useState(null);

 useEffect(() => {
   let initialRules = step.rules ? [...step.rules] : [];
   
   if (!initialRules.some(r => r.condition ==='DEFAULT')) {
     initialRules.push({ id:'default-rule', condition:'DEFAULT', next_step:'' });
   }
   setRules(initialRules);
 }, [step]);

 const nextStepOptions = allSteps
   .filter(s => s.id !== step.id)
   .map(s => ({ label: s.name, value: s.id }));
 
 nextStepOptions.push({ label:'🛑 End Workflow', value:'END' });

 const addRule = () => {
   const newRule = { id: Math.random().toString(36).substring(7), condition:'', next_step:'' };
   const newRules = [...rules];
   newRules.splice(rules.length - 1, 0, newRule);
   setRules(newRules);
 };

 const updateRule = (index, key, value) => {
   const newRules = [...rules];
   newRules[index][key] = value;
   setRules(newRules);
 };

 const deleteRule = (index) => {
   const newRules = [...rules];
   newRules.splice(index, 1);
   setRules(newRules);
 };

 const handleDragStart = (e, index) => {
   setDraggedIndex(index);
   e.dataTransfer.effectAllowed ='move';
   e.dataTransfer.setData('text/html', e.target.parentNode);
   e.target.style.opacity ='0.5';
 };

 const handleDragEnter = (e, targetIndex) => {
   e.preventDefault();
   if (draggedIndex === null || draggedIndex === rules.length - 1 || targetIndex === rules.length - 1) return;
   
   if (draggedIndex !== targetIndex) {
     const newRules = [...rules];
     const draggedItem = newRules[draggedIndex];
     newRules.splice(draggedIndex, 1);
     newRules.splice(targetIndex, 0, draggedItem);
     setDraggedIndex(targetIndex);
     setRules(newRules);
   }
 };

 const handleDragEnd = (e) => {
   e.target.style.opacity ='1';
   setDraggedIndex(null);
 };

 return (
   <div className="space-y-4">
     <div className="p-3 mb-4 text-sm text-teal-800 bg-teal-50 border border-teal-100 flex items-start gap-2 rounded-lg">
       <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
       <p>Rules are evaluated in order of priority. The first condition that evaluates to <strong>true</strong> will trigger its Next Step. You can write conditions using variables from your Input Schema (e.g., <code>amount &gt; 100</code>).</p>
     </div>

     <div className="space-y-2">
       {/* Table Header */}
       <div className="flex gap-4 px-2 pb-2 text-xs font-semibold text-gray-500 uppercase">
         <div className="w-8 shrink-0"></div>
         <div className="w-12 shrink-0 text-center">Pri</div>
         <div className="flex-1">Condition</div>
         <div className="w-1/3 shrink-0">Next Step</div>
         <div className="w-8 shrink-0"></div>
       </div>

       {/* Rule List */}
       {rules.map((rule, index) => {
         const isDefault = rule.condition ==='DEFAULT';
         
         return (
           <div 
             key={rule.id}
             draggable={!isDefault}
             onDragStart={(e) => handleDragStart(e, index)}
             onDragEnter={(e) => handleDragEnter(e, index)}
             onDragEnd={handleDragEnd}
             onDragOver={(e) => e.preventDefault()}
             className={`flex flex-nowrap items-center gap-4 p-2 bg-white border transition-all rounded-lg
               ${isDefault ?'border-gray-200 bg-gray-50' :'border-gray-200 hover:border-[#58bfa1] cursor-grab active:cursor-grabbing'}
               ${draggedIndex === index ?'shadow-lg border-[#58bfa1] ring-1 ring-[#58bfa1]' :'shadow-sm'}`}
           >
             {/* Drag Handle */}
             <div className="w-8 shrink-0 flex justify-center text-gray-400">
               {!isDefault && <GripVertical className="w-4 h-4" />}
             </div>

             {/* Priority Badge */}
             <div className="w-12 shrink-0 flex justify-center">
               <span className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${isDefault ?'bg-gray-200 text-gray-600' :'bg-teal-100 text-[#58bfa1]'}`}>
                 {isDefault ?'*' : index + 1}
               </span>
             </div>

             {/* Condition Input */}
             {/* THE FIX: Used flex-1 so it dynamically fills the space just like the regular rows! */}
             <div className="flex-1 min-w-0"> 
               {isDefault ? (
                 <div className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg w-full text-center">
                   DEFAULT (Fallback)
                 </div>
               ) : (
                 <div className="w-full">
                   <TextInput 
                     placeholder="e.g., amount > 100 and risk == 'High'" 
                     value={rule.condition}
                     onChange={(e) => updateRule(index,'condition', e.target.value)}
                   />
                 </div>
               )}
             </div>

             {/* Next Step Select */}
             {/* THE FIX: Kept the width at exactly 1/3 shrink-0 to perfectly align with regular rows */}
             <div className="w-1/3 shrink-0">
               <Select 
                 options={nextStepOptions}
                 value={rule.next_step}
                 onChange={(val) => updateRule(index,'next_step', val)}
                 placeholder="Select..."
               />
             </div>

             {/* Delete Action Container (Kept for alignment even on DEFAULT) */}
             <div className="w-8 shrink-0 flex justify-center">
               {!isDefault && (
                 <button 
                   onClick={() => deleteRule(index)}
                   className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
             </div>
           </div>
         );
       })}
     </div>

     <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-100">
       <Button variant="text" color="primary" onClick={addRule}>
         <Plus className="w-4 h-4 mr-2" /> Add Rule
       </Button>
       <div className="flex gap-3">
         <Button variant="outline" color="primary" onClick={onCancel}>Cancel</Button>
         <Button variant="solid" color="primary" onClick={() => onSave(rules)}>Save Rules</Button>
       </div>
     </div>
   </div>
 );
}