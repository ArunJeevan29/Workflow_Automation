// client/src/pages/admin/Integrations.jsx
import React, { useState } from 'react';
import { Plug, Mail, Globe, ExternalLink, CheckCircle2 } from 'lucide-react';

const IntegrationCard = ({ icon: Icon, name, description, status, color }) => (
  <div className="bg-white border border-gray-200 shadow-sm p-6 flex flex-col gap-4 rounded-t-md hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`p-3 border ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {status === 'connected' ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
        </span>
      ) : (
        <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1">Not Connected</span>
      )}
    </div>
    <div>
      <h3 className="font-bold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <button className="mt-auto text-sm font-medium text-[#58bfa1] hover:underline flex items-center gap-1 self-start">
      {status === 'connected' ? 'Manage' : 'Configure'} <ExternalLink className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default function Integrations() {
  const integrations = [
    {
      icon: Mail,
      name: 'Email (SMTP)',
      description: 'Send automated notifications and alerts to staff members and employees via your SMTP server.',
      status: 'connected',
      color: 'text-blue-600 border-blue-100 bg-blue-50'
    },
    {
      icon: Globe,
      name: 'Webhooks',
      description: 'Trigger external HTTP endpoints when workflow events occur — compatible with Zapier, Make, and custom APIs.',
      status: 'not_connected',
      color: 'text-purple-600 border-purple-100 bg-purple-50'
    },
    {
      icon: Plug,
      name: 'Slack',
      description: 'Send real-time workflow execution alerts and approval notifications to your Slack channels.',
      status: 'not_connected',
      color: 'text-amber-600 border-amber-100 bg-amber-50'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Plug className="w-6 h-6 text-[#58bfa1]" /> Integrations
        </h1>
        <p className="mt-1 text-sm text-gray-500">Connect your workflow system with external tools and services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, i) => (
          <IntegrationCard key={i} {...integration} />
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-5 rounded-t-md">
        <h3 className="font-semibold text-blue-900 mb-1">Need a custom integration?</h3>
        <p className="text-sm text-blue-700">All workflow events are available via the REST API. Use the Webhooks integration to forward events to any endpoint.</p>
      </div>
    </div>
  );
}
