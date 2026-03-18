// client/src/pages/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Settings2, Save } from 'lucide-react';
import { useAlert } from '../../context/AlertContext'; // <-- NEW: Import custom alert
import api from '../../utils/axios';

export default function Settings() {
  const { showAlert } = useAlert(); // <-- NEW: Initialize the alert hook
  
  const [form, setForm] = useState({
    workspaceName: 'HaloFlow Workspace',
    maxIterations: 50,
    retryLimit: 3,
    defaultRuleBehavior: 'fail',
    notifyOnFail: true,
    notifyOnComplete: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/settings');
      if (response.data && response.data.data) {
        setForm(response.data.data);
      }
    } catch (error) {
      showAlert('danger', 'Failed to load workspace settings.'); // <-- Replaced toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.put('/settings', form);
      showAlert('success', 'Workspace settings saved and applied to engine.'); // <-- Replaced toast
    } catch (error) {
      showAlert('danger', 'Failed to save settings.'); // <-- Replaced toast
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, description, children }) => (
    <div className="py-5 border-b border-gray-100 last:border-0 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="sm:w-72 shrink-0">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Settings2 className="w-6 h-6 text-[#58bfa1]" />
          </div>
          Workspace Settings
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">Configure your workspace preferences and workflow execution limits.</p>
      </div>

      {/* Workspace Settings */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Workspace Details</h2>
        </div>
        <div className="px-6 bg-white">
          <Field label="Workspace Name" description="Displayed across all portals.">
            <input
              type="text"
              value={form.workspaceName}
              onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all"
            />
          </Field>
        </div>
      </div>

      {/* Execution Limits */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Execution Limits</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Control safety limits for the workflow engine.</p>
        </div>
        <div className="px-6 bg-white">
          <Field label="Max Loop Iterations" description="Maximum times a loop step can execute before force-stopping. Prevents infinite loops.">
            <input
              type="number"
              min="1"
              max="1000"
              value={form.maxIterations}
              onChange={(e) => setForm({ ...form, maxIterations: parseInt(e.target.value) || 1 })}
              className="w-full sm:w-32 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all"
            />
          </Field>
          <Field label="Auto-Retry Limit" description="Number of automatic retries for failed steps before the execution fails permanently.">
            <input
              type="number"
              min="0"
              max="10"
              value={form.retryLimit}
              onChange={(e) => setForm({ ...form, retryLimit: parseInt(e.target.value) || 0 })}
              className="w-full sm:w-32 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all"
            />
          </Field>
          <Field label="Default Rule Failure Behavior" description="What happens when a conditional rule has no matching branch.">
            <select
              value={form.defaultRuleBehavior}
              onChange={(e) => setForm({ ...form, defaultRuleBehavior: e.target.value })}
              className="w-full sm:w-48 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all bg-white"
            >
              <option value="fail">Fail the execution</option>
              <option value="skip">Complete & Stop gracefully</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="px-6 bg-white">
          <Field label="Notify on Failure" description="Send an email alert when any execution fails.">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, notifyOnFail: !form.notifyOnFail })}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.notifyOnFail ? 'bg-[#58bfa1]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${form.notifyOnFail ? 'translate-x-7' : 'translate-x-1'}`}></span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{form.notifyOnFail ? 'Enabled' : 'Disabled'}</span>
            </label>
          </Field>
          <Field label="Notify on Completion" description="Send an email alert when an execution completes successfully.">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, notifyOnComplete: !form.notifyOnComplete })}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.notifyOnComplete ? 'bg-[#58bfa1]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${form.notifyOnComplete ? 'translate-x-7' : 'translate-x-1'}`}></span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{form.notifyOnComplete ? 'Enabled' : 'Disabled'}</span>
            </label>
          </Field>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#58bfa1] rounded-lg text-white text-sm font-bold hover:bg-teal-600 transition-colors shadow-sm hover:shadow disabled:opacity-70"
        >
          <Save className="w-4 h-4" /> 
          {isSaving ? 'Applying to Engine...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}