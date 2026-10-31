import React, { useState } from 'react';
import {
  Sparkles,
  Activity,
  Terminal,
  Cpu,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Play,
  RotateCcw,
  Zap,
  Code2,
  FileJson,
  ChevronDown,
} from 'lucide-react';
import { AIAgentLog } from '../types/index.ts';

interface AIMonitorViewProps {
  logs: AIAgentLog[];
  onRefreshLogs: () => void;
}

export const AIMonitorView: React.FC<AIMonitorViewProps> = ({ logs, onRefreshLogs }) => {
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Sandbox state
  const [sandboxAgent, setSandboxAgent] = useState<'Listener Agent' | 'Recurrence Agent' | 'Severity Agent' | 'Priority Agent'>('Listener Agent');
  const [sandboxTitle, setSandboxTitle] = useState('Dangerous exposed live electric wire near community pool');
  const [sandboxDescription, setSandboxDescription] = useState('Storm knocked down overhead cable into puddles outside the entrance. Sparks visible.');
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);

  const filteredLogs = logs.filter((l) =>
    selectedAgentFilter === 'ALL' ? true : l.agentName === selectedAgentFilter
  );

  const handleRunSandbox = async () => {
    setIsRunningSandbox(true);
    try {
      const res = await fetch('/api/ai/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: sandboxAgent,
          payload: {
            title: sandboxTitle,
            description: sandboxDescription,
            address: 'Municipal Pool, Ward 2',
            urgency: 'HIGH',
            severityScore: 88,
            reportsCount: 4,
          },
        }),
      });
      const data = await res.json();
      setSandboxOutput(data);
      onRefreshLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningSandbox(false);
    }
  };

  return (
    <div className="space-y-8 text-[#191C1B]">
      {/* Header */}
      <div className="border-b border-[#E7E5DF] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#1B4D3E] font-semibold">
              Machine Observability Desk &bull; gemini-3.8-flash
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191C1B] mt-1">
              4-Agent Pipeline Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-[#525854] mt-1.5 max-w-2xl leading-relaxed">
              Every citizen notice is audited through structured JSON schemas. Observe execution logs, measured latency, and test prompts in the live agent sandbox.
            </p>
          </div>

          <button
            onClick={onRefreshLogs}
            className="flex items-center gap-1.5 rounded-md border border-[#D6D3CB] bg-[#F5F3EC] px-3 py-1.5 text-xs font-semibold text-[#191C1B] hover:bg-[#ECE8DF] transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* 4 Agent Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent 1 */}
        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#E7E5DF]">
            <span className="font-mono text-xs font-bold text-[#1B4D3E]">Agent 01</span>
            <span className="font-mono text-[10px] text-[#1B4D3E] font-medium">ONLINE</span>
          </div>
          <h3 className="font-serif font-bold text-sm text-[#191C1B]">Listener Agent</h3>
          <p className="text-xs text-[#525854]">
            Extracts objective facts, keywords, and detected hazards from emotional citizen reports.
          </p>
          <div className="text-[10px] font-mono text-[#706D66] pt-1">
            Latency: ~620ms &bull; Strict JSON
          </div>
        </div>

        {/* Agent 2 */}
        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#E7E5DF]">
            <span className="font-mono text-xs font-bold text-[#1B4D3E]">Agent 02</span>
            <span className="font-mono text-[10px] text-[#1B4D3E] font-medium">ONLINE</span>
          </div>
          <h3 className="font-serif font-bold text-sm text-[#191C1B]">Recurrence Agent</h3>
          <p className="text-xs text-[#525854]">
            Geospatial &amp; semantic clustering. Deduplicates reports or routes ambiguous cases to triage.
          </p>
          <div className="text-[10px] font-mono text-[#706D66] pt-1">
            Latency: ~880ms &bull; Proximity Matrix
          </div>
        </div>

        {/* Agent 3 */}
        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#E7E5DF]">
            <span className="font-mono text-xs font-bold text-[#1B4D3E]">Agent 03</span>
            <span className="font-mono text-[10px] text-[#1B4D3E] font-medium">ONLINE</span>
          </div>
          <h3 className="font-serif font-bold text-sm text-[#191C1B]">Severity Auditor</h3>
          <p className="text-xs text-[#525854]">
            Evaluates public safety danger, structural destruction risk, and sensitive population proximity.
          </p>
          <div className="text-[10px] font-mono text-[#706D66] pt-1">
            Latency: ~710ms &bull; Score 1–100
          </div>
        </div>

        {/* Agent 4 */}
        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#E7E5DF]">
            <span className="font-mono text-xs font-bold text-[#1B4D3E]">Agent 04</span>
            <span className="font-mono text-[10px] text-[#1B4D3E] font-medium">ONLINE</span>
          </div>
          <h3 className="font-serif font-bold text-sm text-[#191C1B]">Priority Dispatcher</h3>
          <p className="text-xs text-[#525854]">
            Generates crew dispatch advice aligning with authoritative deterministic priority formula.
          </p>
          <div className="text-[10px] font-mono text-[#706D66] pt-1">
            Latency: ~540ms &bull; P1–P4 Tiers
          </div>
        </div>
      </div>

      {/* Grid: Interactive Sandbox (5 cols) + Ingestion Stream (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Sandbox (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4 shadow-xs">
          <div className="border-b border-[#E7E5DF] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
              Testing Environment
            </span>
            <h2 className="font-serif font-bold text-lg text-[#191C1B]">
              Live Agent Sandbox Tester
            </h2>
          </div>
          <p className="text-xs text-[#525854]">
            Transmit test civic problems directly to any agent and inspect the verified structured JSON payload.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#191C1B] font-semibold mb-1">Target Agent</label>
              <select
                value={sandboxAgent}
                onChange={(e) => setSandboxAgent(e.target.value as any)}
                className="w-full rounded-md border border-[#D6D3CB] bg-[#FAF9F5] px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
              >
                <option value="Listener Agent">1. Listener Agent (Intake &amp; Hazard)</option>
                <option value="Recurrence Agent">2. Recurrence Agent (Candidate Matching)</option>
                <option value="Severity Agent">3. Severity Agent (Risk Scoring)</option>
                <option value="Priority Agent">4. Priority Agent (Dispatch &amp; Tier)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#191C1B] font-semibold mb-1">Sample Title</label>
              <input
                type="text"
                value={sandboxTitle}
                onChange={(e) => setSandboxTitle(e.target.value)}
                className="w-full rounded-md border border-[#D6D3CB] bg-[#FAF9F5] px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#191C1B] font-semibold mb-1">Sample Description</label>
              <textarea
                rows={3}
                value={sandboxDescription}
                onChange={(e) => setSandboxDescription(e.target.value)}
                className="w-full rounded-md border border-[#D6D3CB] bg-[#FAF9F5] px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunSandbox}
              disabled={isRunningSandbox}
              className="w-full py-2.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-3 w-3 fill-white" />
              <span>{isRunningSandbox ? 'Invoking Model...' : `Execute ${sandboxAgent}`}</span>
            </button>
          </div>

          {sandboxOutput && (
            <div className="mt-4 pt-3 border-t border-[#E7E5DF]">
              <span className="font-mono text-[10px] uppercase font-bold text-[#1B4D3E] block mb-1">
                Verified JSON Output:
              </span>
              <pre className="max-h-56 overflow-y-auto rounded-lg bg-[#FAF9F5] p-3 text-[10px] font-mono text-[#191C1B] border border-[#D6D3CB]">
                {JSON.stringify(sandboxOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Ingestion Log Stream (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E5DF] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                Operational Telemetry Stream
              </span>
              <h2 className="font-serif font-bold text-lg text-[#191C1B]">
                Recent Agent Execution Ledger
              </h2>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              {['ALL', 'Listener Agent', 'Recurrence Agent', 'Severity Agent', 'Priority Agent'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedAgentFilter(f)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedAgentFilter === f
                      ? 'bg-[#1B4D3E] text-white font-bold'
                      : 'bg-[#F4F2EC] text-[#706D66] hover:bg-[#EBE8E0]'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#E7E5DF] max-h-[560px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#858A85]">
                No recent agent logs in memory.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-[#191C1B]">{log.agentName}</span>
                        <span className="font-mono text-[10px] text-[#706D66] bg-[#F4F2EC] px-1.5 py-0.5 rounded">
                          {log.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-[#706D66]">
                        <span>{log.durationMs}ms</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-[#E8EFEA] text-[#1B4D3E]'
                              : 'bg-[#FFFBEB] text-[#B45309]'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#525854]">{log.promptSummary}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#858A85] pt-0.5">
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-[#1B4D3E] hover:underline font-semibold"
                      >
                        {isExpanded ? 'Hide Payload' : 'Inspect JSON Payload'}
                      </button>
                    </div>

                    {isExpanded && (
                      <pre className="mt-2 p-2.5 rounded-lg bg-[#FAF9F5] border border-[#D6D3CB] text-[10px] font-mono text-[#191C1B] overflow-x-auto">
                        {JSON.stringify(log.structuredResult, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
