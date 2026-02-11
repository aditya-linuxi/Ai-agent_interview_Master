import React, { useState } from 'react';
import { RoleConfig } from '../types';
import { Briefcase, Code, Server, Terminal } from 'lucide-react';

interface RoleSelectorProps {
  onStart: (config: RoleConfig) => void;
  disabled: boolean;
}

const ROLES = [
  { id: 'linux', title: 'Linux Administrator', icon: <Terminal size={24} />, desc: 'System hardening, kernel tuning, bash scripting.' },
  { id: 'devops', title: 'DevOps Engineer', icon: <Server size={24} />, desc: 'CI/CD, Kubernetes, Terraform, AWS/GCP.' },
  { id: 'frontend', title: 'Senior Frontend', icon: <Code size={24} />, desc: 'React, Performance, System Design, Accessibility.' },
  { id: 'manager', title: 'Engineering Manager', icon: <Briefcase size={24} />, desc: 'Leadership, Conflict Resolution, Strategy.' },
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ onStart, disabled }) => {
  const [selectedRole, setSelectedRole] = useState(ROLES[1]);
  const [level, setLevel] = useState('Senior');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
          InterviewMaster AI Pro
        </h1>
        <p className="text-slate-400 text-lg">
          World-class executive coaching. Real-time voice feedback. Mastery guaranteed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r)}
            className={`p-6 rounded-xl border transition-all duration-200 flex items-start text-left gap-4
              ${selectedRole.id === r.id 
                ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }`}
          >
            <div className={`p-3 rounded-lg ${selectedRole.id === r.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
              {r.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{r.title}</h3>
              <p className="text-slate-400 text-sm">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="w-full md:w-1/2">
          <label className="block text-slate-400 text-sm font-semibold mb-2">Experience Level</label>
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            <option>Junior</option>
            <option>Mid-Level</option>
            <option>Senior</option>
            <option>Staff/Principal</option>
            <option>Executive (CTO/VP)</option>
          </select>
        </div>
        <button
          onClick={() => onStart({ role: selectedRole.title, level, description: selectedRole.desc })}
          disabled={disabled}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
        >
          {disabled ? 'Initializing...' : 'Start Interview Session'}
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;
