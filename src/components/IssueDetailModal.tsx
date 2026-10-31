import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Clock,
  Layers,
  MapPin,
  Building,
  CheckCircle,
  AlertOctagon,
  Flame,
  Droplets,
  Send,
  MessageSquare,
  FileText,
  Activity,
  Sliders,
  Calendar,
  User,
} from 'lucide-react';
import { ConsolidatedIssue, IssueStatus, UserRole } from '../types/index.ts';

interface IssueDetailModalProps {
  issue: ConsolidatedIssue | null;
  onClose: () => void;
  currentRole: UserRole;
  onUpdateStatus: (issueId: string, status: IssueStatus) => void;
  onUpdateDepartment: (issueId: string, dept: string) => void;
  onAddComment: (issueId: string, text: string) => void;
}

const DEPARTMENTS = [
  'Department of Transportation & Roads',
  'Water Supply & Sewerage Board',
  'Waste Management & Sanitation',
  'Public Lighting & Energy Grid',
  'Emergency Infrastructure Services',
  'Parks & Recreation Department',
  'Traffic Management Bureau',
];

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  currentRole,
  onUpdateStatus,
  onUpdateDepartment,
  onAddComment,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'reports' | 'dispatch' | 'timeline'>('agents');
  const [commentText, setCommentText] = useState('');

  if (!issue) return null;

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(issue.id, commentText);
    setCommentText('');
  };

  const getTierBadge = (tier: string, score: number) => {
    switch (tier) {
      case 'P1_CRITICAL':
        return (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40">
            P1 CRITICAL &bull; {score}/100
          </span>
        );
      case 'P2_HIGH':
        return (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FBBF24]/40">
            P2 HIGH &bull; {score}/100
          </span>
        );
      case 'P3_MEDIUM':
        return (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047]/40">
            P3 MEDIUM &bull; {score}/100
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#F4F2EC] text-[#525854] border border-[#D6D3CB]">
            P4 LOW &bull; {score}/100
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191C1B]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#D6D3CB] bg-[#FAF9F5] shadow-2xl p-6 sm:p-8 text-[#191C1B] max-h-[92vh] overflow-y-auto">
        {/* Dossier Header */}
        <div className="flex items-start justify-between pb-5 border-b border-[#E7E5DF]">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#1B4D3E] bg-[#E8EFEA] px-2.5 py-0.5 rounded">
                DOCKET #{issue.id}
              </span>
              {getTierBadge(issue.priorityTier, issue.priorityScore)}
              <span className="text-[11px] font-mono uppercase font-semibold text-[#525854] bg-[#F4F2EC] px-2 py-0.5 rounded border border-[#E7E5DF]">
                {issue.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-[#706D66] font-medium">
                {issue.category}
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#191C1B] leading-tight">
              {issue.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#636864] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                <span>{issue.address} ({issue.ward})</span>
              </span>
              <span className="text-[#A8A29E]">&bull;</span>
              <span className="font-mono text-[11px] font-semibold text-[#1B4D3E]">
                {issue.reportsCount} citizen notices consolidated
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#706D66] hover:text-[#191C1B] hover:bg-[#EFECE4] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex border-b border-[#E7E5DF] gap-4 font-sans text-xs">
          <button
            onClick={() => setActiveTab('agents')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'agents'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            AI Agent Intelligence &amp; Formula
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'reports'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            Clustered Citizen Reports ({issue.reportsCount})
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'dispatch'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            Operations &amp; Work Order
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'timeline'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            Docket Timeline &amp; Notes
          </button>
        </div>

        {/* TAB 1: 4-Agent Intelligence & Formula */}
        {activeTab === 'agents' && (
          <div className="mt-6 space-y-6 text-xs">
            {/* Mathematical Formula Breakdown */}
            <div className="rounded-xl border border-[#D6D3CB] bg-[#F4F2EC] p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CB]">
                <span className="font-serif font-bold text-sm text-[#191C1B]">
                  Authoritative Deterministic Priority Formula (1–100)
                </span>
                <span className="font-mono font-bold text-[#1B4D3E]">
                  Calculated Score: {issue.priorityScore}/100 [{issue.priorityTier}]
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-[#E7E5DF]">
                  <div className="text-[10px] font-mono uppercase text-[#706D66] font-semibold">1. Severity (45% wt)</div>
                  <div className="text-base font-bold text-[#191C1B] mt-1 font-mono">{issue.severityScore} / 100</div>
                  <div className="text-[11px] text-[#1B4D3E] font-mono mt-0.5">+{Math.round(issue.severityScore * 0.45)} pts</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[#E7E5DF]">
                  <div className="text-[10px] font-mono uppercase text-[#706D66] font-semibold">2. Recurrence (25% wt)</div>
                  <div className="text-base font-bold text-[#191C1B] mt-1 font-mono">{issue.reportsCount} Reports</div>
                  <div className="text-[11px] text-[#1B4D3E] font-mono mt-0.5">
                    +{issue.reportsCount >= 5 ? 22 : issue.reportsCount >= 3 ? 17 : 11} pts
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[#E7E5DF]">
                  <div className="text-[10px] font-mono uppercase text-[#706D66] font-semibold">3. Ward Index (15% wt)</div>
                  <div className="text-base font-bold text-[#191C1B] mt-1 truncate">{issue.ward.split(' ')[0]}</div>
                  <div className="text-[11px] text-[#1B4D3E] font-mono mt-0.5">
                    +{issue.ward.includes('Hospital') ? 14 : 10} pts
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[#E7E5DF]">
                  <div className="text-[10px] font-mono uppercase text-[#706D66] font-semibold">4. Aging / SLA (15% wt)</div>
                  <div className="text-base font-bold text-[#191C1B] mt-1 font-mono">Active Ticket</div>
                  <div className="text-[11px] text-[#1B4D3E] font-mono mt-0.5">+{Math.round(issue.priorityScore * 0.15)} pts</div>
                </div>
              </div>
            </div>

            {/* AI Agent Dossier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent 1 */}
              <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
                <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-1.5">
                  <span className="font-mono text-[11px] font-bold text-[#1B4D3E]">Agent 01: The Listener</span>
                  <span className="text-[10px] font-mono text-[#706D66]">NLP Intake</span>
                </div>
                <p className="text-[#525854] leading-relaxed">
                  {issue.agentOutputs?.listenerSummary || issue.summary}
                </p>
                <div className="pt-2 text-[11px] font-sans text-[#706D66]">
                  <strong>Normalized Summary:</strong> {issue.description}
                </div>
              </div>

              {/* Agent 2 */}
              <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
                <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-1.5">
                  <span className="font-mono text-[11px] font-bold text-[#1B4D3E]">Agent 02: Recurrence Engine</span>
                  <span className="text-[10px] font-mono text-[#706D66]">Deduplication</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#706D66] font-sans">Clustered Notices:</span>
                    <span className="font-bold text-[#191C1B]">{issue.reportsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#706D66] font-sans">Report Velocity:</span>
                    <span className="font-bold text-[#191C1B]">{issue.recurrenceVelocity} reports/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#706D66] font-sans">Cluster Geofence:</span>
                    <span className="font-bold text-[#191C1B]">&lt; 150m proximity</span>
                  </div>
                </div>
              </div>

              {/* Agent 3 */}
              <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
                <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-1.5">
                  <span className="font-mono text-[11px] font-bold text-[#1B4D3E]">Agent 03: Severity Auditor</span>
                  <span className="text-[10px] font-mono text-[#706D66]">Risk Matrix</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#706D66] font-sans">Public Safety Risk:</span>
                    <span className="font-bold text-[#991B1B]">{issue.agentOutputs?.severityAssessment?.publicSafetyRisk || 7}/10</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#706D66] font-sans">Infrastructure Damage:</span>
                    <span className="font-bold text-[#991B1B]">{issue.agentOutputs?.severityAssessment?.infrastructureDamageRisk || 7}/10</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#706D66]">Vulnerable Zone:</span>
                    <span className="font-medium text-[#191C1B]">
                      {issue.agentOutputs?.severityAssessment?.vulnerablePopulationImpact ? 'Critical Proximity' : 'Standard'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] italic text-[#706D66] pt-1">
                  "{issue.agentOutputs?.severityAssessment?.justification || 'Evaluated based on direct hazard characteristics.'}"
                </p>
              </div>

              {/* Agent 4 */}
              <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-2">
                <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-1.5">
                  <span className="font-mono text-[11px] font-bold text-[#1B4D3E]">Agent 04: Priority Dispatcher</span>
                  <span className="text-[10px] font-mono text-[#706D66]">SLA Urgency</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#706D66]">Recommended Urgency:</span>
                    <span className="font-mono font-bold text-[#1B4D3E]">{issue.agentOutputs?.priorityAssessment?.dispatchUrgency || 'WITHIN_24H'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#706D66]">Assigned Department:</span>
                    <span className="font-medium text-[#191C1B]">{issue.assignedDepartment}</span>
                  </div>
                </div>
                <div className="p-2 bg-[#F4F2EC] rounded text-[11px] text-[#444845] mt-2">
                  <strong>Action Recommended:</strong> {issue.agentOutputs?.priorityAssessment?.recommendedAction || 'Deploy standard maintenance crew.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Clustered Citizen Reports */}
        {activeTab === 'reports' && (
          <div className="mt-6 space-y-4">
            <p className="text-xs text-[#525854]">
              The following {issue.reportsCount} individual community notices have been aggregated by the Recurrence Agent into this single master work ticket:
            </p>

            <div className="border border-[#D6D3CB] rounded-xl bg-white divide-y divide-[#E7E5DF] overflow-hidden">
              {issue.reports && issue.reports.length > 0 ? (
                issue.reports.map((rep) => (
                  <div key={rep.id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1B4D3E]">{rep.id}</span>
                        <span className="font-serif font-bold text-sm text-[#191C1B]">{rep.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#706D66]">
                        {new Date(rep.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-[#525854] leading-relaxed">{rep.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#706D66] pt-1">
                      <span>Reporter: <strong className="text-[#191C1B]">{rep.citizenName}</strong></span>
                      <span>Location: <strong className="text-[#191C1B]">{rep.address}</strong></span>
                      <span>Self-Urgency: <strong className="text-[#191C1B]">{rep.citizenUrgency}</strong></span>
                    </div>

                    {rep.photoUrl && (
                      <div className="pt-2">
                        <img
                          src={rep.photoUrl}
                          alt="Citizen evidence photo"
                          className="h-32 w-52 object-cover rounded-lg border border-[#D6D3CB]"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[#706D66]">
                  Notices linked: {issue.reportIds.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Operations & Work Order */}
        {activeTab === 'dispatch' && (
          <div className="mt-6 space-y-5 text-xs">
            <div className="p-5 rounded-xl border border-[#D6D3CB] bg-white space-y-4">
              <h3 className="font-serif font-bold text-base text-[#191C1B]">
                Municipal Work Order Dispatch Controls
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191C1B] mb-1.5">
                    Operational Status
                  </label>
                  <select
                    value={issue.status}
                    onChange={(e) => onUpdateStatus(issue.id, e.target.value as IssueStatus)}
                    className="w-full rounded-md border border-[#D6D3CB] bg-white px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
                  >
                    <option value="NEW">NEW - Intake Logged</option>
                    <option value="TRIAGED">TRIAGED - AI Priority Set</option>
                    <option value="ASSIGNED">ASSIGNED - Assigned to Dept</option>
                    <option value="IN_PROGRESS">IN_PROGRESS - Work Crew On Site</option>
                    <option value="RESOLVED">RESOLVED - Fixed &amp; Inspected</option>
                    <option value="CLOSED">CLOSED - Verified Complete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191C1B] mb-1.5">
                    Assigned Municipal Department
                  </label>
                  <select
                    value={issue.assignedDepartment}
                    onChange={(e) => onUpdateDepartment(issue.id, e.target.value)}
                    className="w-full rounded-md border border-[#D6D3CB] bg-white px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F2EC] text-[11px] text-[#525854]">
                Status updates trigger real-time notifications to all {issue.reportsCount} citizen reporters registered in this cluster.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Docket Timeline & Comments */}
        {activeTab === 'timeline' && (
          <div className="mt-6 space-y-6">
            <div>
              <h4 className="font-serif font-bold text-sm text-[#191C1B] mb-3">
                Docket Chronological Audit Log
              </h4>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {issue.timeline.map((act) => (
                  <div key={act.id} className="p-3 rounded-lg border border-[#E7E5DF] bg-white text-xs">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#706D66]">
                      <span className="font-bold text-[#1B4D3E]">{act.actor}</span>
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="font-semibold text-[#191C1B] mt-1">{act.action}</div>
                    <p className="text-[#525854] text-[11px] mt-0.5">{act.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E7E5DF] pt-4">
              <h4 className="font-serif font-bold text-sm text-[#191C1B] mb-3">
                Internal Dispatch Notes
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-3">
                {issue.comments.length === 0 ? (
                  <div className="text-xs text-[#858A85] italic py-2">No notes recorded in docket.</div>
                ) : (
                  issue.comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-white border border-[#E7E5DF] text-xs">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-[#191C1B]">{c.author}</span>
                        <span className="text-[#706D66]">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[#444845] mt-1 text-[11px]">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Record an officer observation or field update..."
                  className="flex-1 rounded-md border border-[#D6D3CB] bg-white px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] text-white font-semibold text-xs transition-colors"
                >
                  Record Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
