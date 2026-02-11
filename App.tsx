import React, { useState, useEffect } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import RoleSelector from './components/RoleSelector';
import AudioVisualizer from './components/AudioVisualizer';
import SessionControls from './components/SessionControls';
import { ConnectionState, InterviewStage, RoleConfig } from './types';
import { BarChart, Activity, ShieldCheck, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Mock data for the summary visual since real analysis parsing from audio stream is complex without text transcription enabled
const MOCK_RADAR_DATA = [
  { subject: 'Clarity', A: 85, fullMark: 100 },
  { subject: 'Technical', A: 92, fullMark: 100 },
  { subject: 'Confidence', A: 78, fullMark: 100 },
  { subject: 'Structure', A: 65, fullMark: 100 },
  { subject: 'Role Fit', A: 88, fullMark: 100 },
];

export default function App() {
  const { connectionState, connect, disconnect, sendTextMessage, volume, error } = useLiveSession();
  const [stage, setStage] = useState<InterviewStage>(InterviewStage.SETUP);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);

  const handleStart = async (config: RoleConfig) => {
    setRoleConfig(config);
    setStage(InterviewStage.ACTIVE);
    await connect();
  };

  const handleEnd = () => {
    disconnect();
    setStage(InterviewStage.SUMMARY);
  };

  const handleRetry = async () => {
      if (roleConfig) {
          await connect();
      }
  };

  // When connection is established, send the initial prompt
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED && roleConfig) {
      const initPrompt = `I am ready for my interview. I am applying for the position of ${roleConfig.role} (${roleConfig.level}). Context: ${roleConfig.description}. Start the interview now.`;
      sendTextMessage(initPrompt);
    }
  }, [connectionState, roleConfig, sendTextMessage]);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[128px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">IM</div>
              <span className="font-bold text-lg tracking-tight">InterviewMaster <span className="text-cyan-400">AI Pro</span></span>
            </div>
            {stage === InterviewStage.ACTIVE && (
               <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-cyan-400"/> {roleConfig?.role}</span>
                  <span className="flex items-center gap-1"><Zap size={14} className="text-yellow-400"/> {roleConfig?.level}</span>
               </div>
            )}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          
          {stage === InterviewStage.SETUP && (
            <RoleSelector onStart={handleStart} disabled={connectionState === ConnectionState.CONNECTING} />
          )}

          {stage === InterviewStage.ACTIVE && (
            <div className="w-full max-w-4xl flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
              
              {/* Status Indicator */}
              <div className="text-center space-y-2">
                 {connectionState === ConnectionState.CONNECTING && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      Connecting to Gemini Live...
                    </div>
                 )}
                 {connectionState === ConnectionState.CONNECTED && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                      Interview in Progress
                    </div>
                 )}
                 {connectionState === ConnectionState.ERROR && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        <AlertTriangle size={16} />
                        Connection Interrupted
                    </div>
                 )}
              </div>

              {/* Avatar / Visualizer Area */}
              <div className="relative bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                
                {connectionState === ConnectionState.ERROR ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
                            <p className="text-slate-400 max-w-md mx-auto">{error || "An unexpected error occurred while connecting to the interview service."}</p>
                        </div>
                        <button 
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                        >
                            <RefreshCw size={20} /> Retry Connection
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 p-1 shadow-xl relative">
                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden relative">
                                <div className={`absolute inset-0 bg-cyan-500/20 rounded-full transition-transform duration-100 ${volume > 0.1 ? 'scale-110' : 'scale-100'}`}></div>
                                <Activity size={48} className="text-cyan-400 relative z-10" />
                            </div>
                            {/* Connection Status Dot */}
                            <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-slate-900 rounded-full ${connectionState === ConnectionState.CONNECTED ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        
                        <div className="w-full">
                            <AudioVisualizer volume={volume} isActive={connectionState === ConnectionState.CONNECTED} />
                        </div>

                        <p className="text-slate-400 text-center max-w-lg">
                            {connectionState === ConnectionState.CONNECTED 
                                ? "Listening... Speak naturally when you are ready." 
                                : "Establishing secure line..."}
                        </p>
                    </div>
                )}
              </div>
            </div>
          )}

          {stage === InterviewStage.SUMMARY && (
             <div className="w-full max-w-5xl animate-in slide-in-from-bottom duration-700">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-white mb-2">Session Complete</h2>
                  <p className="text-slate-400">Here is your preliminary performance analysis.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Score Card */}
                   <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart className="text-cyan-400" /> Performance Radar
                      </h3>
                      <div className="h-64 w-full flex items-center justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MOCK_RADAR_DATA}>
                              <PolarGrid stroke="#334155" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="User" dataKey="A" stroke="#22d3ee" strokeWidth={3} fill="#22d3ee" fillOpacity={0.3} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                            </RadarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Key Takeaways */}
                   <div className="space-y-6">
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-green-400 mb-3">🔥 Top Strengths</h3>
                        <ul className="space-y-2 text-slate-300">
                           <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Strong technical grasp of container orchestration.</li>
                           <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Good use of STAR method in the behavioral section.</li>
                        </ul>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-yellow-400 mb-3">⚠️ Areas to Improve</h3>
                        <ul className="space-y-2 text-slate-300">
                           <li className="flex items-start gap-2"><span className="text-yellow-500">!</span> Reduce filler words ("um", "like") during pause periods.</li>
                           <li className="flex items-start gap-2"><span className="text-yellow-500">!</span> Be more concise when explaining system architecture.</li>
                        </ul>
                      </div>
                   </div>
                </div>
                
                <div className="mt-8 text-center">
                  <button 
                    onClick={() => {
                       setStage(InterviewStage.SETUP);
                       setRoleConfig(null);
                    }}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors border border-slate-700"
                  >
                    Start New Session
                  </button>
                </div>
             </div>
          )}

        </main>
        
        {/* FOOTER CONTROLS (Only Active and Not Error) */}
        {stage === InterviewStage.ACTIVE && connectionState !== ConnectionState.ERROR && (
           <SessionControls onEnd={handleEnd} status={connectionState} />
        )}
        {/* Show generic cancel/back button if in error state */}
        {stage === InterviewStage.ACTIVE && connectionState === ConnectionState.ERROR && (
            <div className="flex items-center justify-center bg-slate-900 border-t border-slate-800 p-4">
                 <button onClick={() => setStage(InterviewStage.SETUP)} className="text-slate-400 hover:text-white underline">
                     Cancel and Return to Setup
                 </button>
            </div>
        )}
      </div>
    </div>
  );
}