import React, { useState } from 'react';
import {
  AlertTriangle,
  GitMerge,
  Split,
  Trash2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  MapPin,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ReviewQueueItem } from '../types/index.ts';

interface ReviewQueueViewProps {
  queueItems: ReviewQueueItem[];
  onResolve: (id: string, decision: 'MERGE' | 'CREATE_NEW' | 'DISMISS', notes: string) => void;
  onOpenIssue: (issueId: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  queueItems,
  onResolve,
  onOpenIssue,
}) => {
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(
    queueItems.find((q) => q.status === 'PENDING') || queueItems[0] || null
  );
  const [officerNotes, setOfficerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingItems = queueItems.filter((q) => q.status === 'PENDING');

  const handleDecision = async (decision: 'MERGE' | 'CREATE_NEW' | 'DISMISS') => {
    if (!selectedItem) return;
    setIsProcessing(true);
    await onResolve(selectedItem.id, decision, officerNotes || `Officer action: ${decision}`);
    setIsProcessing(false);
    setOfficerNotes('');
    const remaining = pendingItems.filter((q) => q.id !== selectedItem.id);
    setSelectedItem(remaining[0] || null);
  };

  return (
    <div className="space-y-8 text-[#191C1B]">
      {/* Header */}
      <div className="border-b border-[#E7E5DF] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B45309]">
              Human-in-the-Loop Supervision
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191C1B] mt-1">
              Municipal Triage Desk
            </h1>
            <p className="text-xs sm:text-sm text-[#525854] mt-1.5 max-w-2xl leading-relaxed">
              When the Recurrence Agent detects spatial proximity and semantic overlap between 50% and 75% similarity, automated clustering is paused for an officer's verification.
            </p>
          </div>
          <span className="font-mono text-xs text-[#B45309] bg-[#FFFBEB] px-3 py-1.5 rounded border border-[#FBBF24]/40 font-bold">
            {pendingItems.length} Ambiguous Cases Pending
          </span>
        </div>
      </div>

      {pendingItems.length === 0 ? (
        <div className="rounded-xl border border-[#D6D3CB] bg-white p-12 text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8EFEA] text-[#1B4D3E] mb-1">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#191C1B]">
            All Triage Cases Resolved
          </h3>
          <p className="text-xs text-[#525854] max-w-md mx-auto">
            The municipal review desk is clear. The multi-agent pipeline is operating autonomously with zero pending escalations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Queue List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D66] block px-1">
              Pending Docket Items
            </span>
            {pendingItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1B4D3E] bg-white text-[#191C1B] shadow-xs'
                      : 'border-[#D6D3CB] bg-[#F7F5EF] text-[#525854] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-xs font-bold text-[#1B4D3E]">{item.id}</span>
                    <span className="font-mono text-[10px] text-[#B45309] font-bold">
                      {Math.round(item.recurrenceConfidence * 100)}% Match
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#191C1B] line-clamp-1">{item.report.title}</h4>
                  <p className="text-[#706D66] text-[11px] mt-1 line-clamp-2">{item.recurrenceReasoning}</p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Comparative Case File (8 cols) */}
          {selectedItem && (
            <div className="lg:col-span-8 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E5DF]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                    Docket File #{selectedItem.id}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-[#191C1B]">
                    Comparative Spatial &amp; Defect Audit
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#B45309] font-bold bg-[#FFFBEB] px-2.5 py-1 rounded border border-[#FBBF24]/40">
                  Similarity Index: {Math.round(selectedItem.recurrenceConfidence * 100)}%
                </span>
              </div>

              {/* Side-by-side cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Incoming Citizen Report */}
                <div className="p-4 rounded-lg border border-[#D6D3CB] bg-[#FAF9F5] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#1B4D3E] uppercase text-[10px]">
                      Incoming Report #{selectedItem.report.id}
                    </span>
                    <span className="text-[10px] font-mono text-[#706D66]">Citizen Filing</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#191C1B]">{selectedItem.report.title}</h4>
                  <p className="text-xs text-[#525854] leading-relaxed">{selectedItem.report.description}</p>
                  <div className="pt-2 text-[11px] text-[#706D66] space-y-0.5 border-t border-[#E7E5DF]">
                    <div>Location: <strong className="text-[#191C1B]">{selectedItem.report.address}</strong></div>
                    <div>Ward: <strong className="text-[#191C1B]">{selectedItem.report.ward}</strong></div>
                    <div>Reporter: <strong className="text-[#191C1B]">{selectedItem.report.citizenName}</strong></div>
                  </div>
                </div>

                {/* Existing Candidate Consolidated Issue */}
                <div className="p-4 rounded-lg border border-[#D6D3CB] bg-[#FAF9F5] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#525854] uppercase text-[10px]">
                      Candidate Issue #{selectedItem.candidateIssue.id}
                    </span>
                    <span className="text-[10px] font-mono text-[#706D66]">Active Ticket</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#191C1B]">{selectedItem.candidateIssue.title}</h4>
                  <p className="text-xs text-[#525854] leading-relaxed">{selectedItem.candidateIssue.summary}</p>
                  <div className="pt-2 text-[11px] text-[#706D66] space-y-0.5 border-t border-[#E7E5DF]">
                    <div>Location: <strong className="text-[#191C1B]">{selectedItem.candidateIssue.address}</strong></div>
                    <div>Current Cluster: <strong className="text-[#191C1B]">{selectedItem.candidateIssue.reportsCount} citizen reports</strong></div>
                    <div>Priority: <strong className="text-[#1B4D3E]">{selectedItem.candidateIssue.priorityTier} ({selectedItem.candidateIssue.priorityScore}/100)</strong></div>
                  </div>
                </div>
              </div>

              {/* AI Reasoning Banner */}
              <div className="p-4 rounded-lg border border-[#FBBF24]/50 bg-[#FFFBEB] text-xs text-[#92400E] space-y-1">
                <span className="font-mono font-bold uppercase text-[10px] tracking-wider block text-[#B45309]">
                  Recurrence Agent Ambiguity Diagnostic:
                </span>
                <p className="leading-relaxed text-[#78350F]">{selectedItem.recurrenceReasoning}</p>
              </div>

              {/* Officer Decision Form */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#191C1B]">
                  Officer Triage Justification
                </label>
                <input
                  type="text"
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Record verification note (e.g., Confirmed same puddle runoff from 9th Ave water main)..."
                  className="w-full rounded-md border border-[#D6D3CB] bg-white px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('MERGE')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] text-white font-semibold text-xs transition-colors"
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                    <span>Approve Merge to #{selectedItem.candidateIssue.id}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('CREATE_NEW')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-md bg-[#F4F2EC] hover:bg-[#EAE6DC] text-[#191C1B] border border-[#D6D3CB] font-semibold text-xs transition-colors"
                  >
                    <Split className="h-3.5 w-3.5" />
                    <span>Create Independent Issue</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('DISMISS')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-md bg-[#FDF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#F87171]/40 font-semibold text-xs transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Dismiss Notice</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
