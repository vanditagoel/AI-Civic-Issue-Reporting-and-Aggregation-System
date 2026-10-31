import React from 'react';
import {
  ArrowRight,
  MapPin,
  Layers,
  ShieldAlert,
  Sparkles,
  Compass,
  FileText,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ConsolidatedIssue, DashboardStats, UserRole } from '../types/index.ts';

interface LandingViewProps {
  stats: DashboardStats;
  issues?: ConsolidatedIssue[];
  onSelectRole: (role: UserRole) => void;
  onOpenReportModal: () => void;
  onNavigate: (view: string) => void;
  onOpenIssue?: (issue: ConsolidatedIssue) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  stats,
  issues = [],
  onSelectRole,
  onOpenReportModal,
  onNavigate,
  onOpenIssue,
}) => {
  const recentIssues = issues.slice(0, 4);

  return (
    <div className="space-y-16 pb-16 text-[#191C1B]">
      {/* Editorial Front Page Header / Masthead Lead */}
      <section className="pt-4 border-b border-[#E7E5DF] pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Headline & Deck (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 border-y border-[#D6D3CB] py-1 text-[11px] font-mono uppercase tracking-widest text-[#1B4D3E]">
              <span>Field Dispatch</span>
              <span className="text-[#A8A29E]">&bull;</span>
              <span>Autonomous Civic Ingestion</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#191C1B] leading-[1.08]">
              Making municipal defects visible, accountable, and{' '}
              <span className="italic font-normal text-[#1B4D3E]">deterministically prioritized.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#525854] leading-relaxed max-w-xl font-sans">
              CivicLens transforms isolated, noisy neighborhood complaints into consolidated work orders. A transparent 4-agent machine pipeline evaluates physical hazard severity, spatial clustering, and community recurrence to eliminate duplicate municipal dispatches.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-2 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] px-5 py-3 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                <span>Report an Issue on Your Street</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onNavigate('issues')}
                className="flex items-center gap-2 rounded-md border border-[#D6D3CB] bg-[#F5F3EC] hover:bg-[#ECE8DF] px-5 py-3 text-xs font-semibold text-[#191C1B] transition-colors"
              >
                <span>Explore Active Issues</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Civic Ledger Snapshot (5 cols) */}
          <div className="lg:col-span-5 bg-[#F4F2EC] rounded-xl border border-[#D6D3CB] p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6D3CB]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#706D66]">
                  Registry Index
                </span>
                <h3 className="font-serif font-bold text-lg text-[#191C1B]">
                  Live Municipal Field Status
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#E5E2D8] px-2 py-0.5 rounded text-[#1B4D3E] font-medium">
                Live API
              </span>
            </div>

            {/* Metric Rows */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-baseline justify-between py-1.5 border-b border-[#E7E5DF]">
                <span className="text-[#525854] font-sans">Total Ingested Reports:</span>
                <span className="text-lg font-bold text-[#191C1B]">{stats.totalReports}</span>
              </div>

              <div className="flex items-baseline justify-between py-1.5 border-b border-[#E7E5DF]">
                <span className="text-[#525854] font-sans">Active Consolidated Tickets:</span>
                <span className="text-lg font-bold text-[#1B4D3E]">{stats.consolidatedIssues}</span>
              </div>

              <div className="flex items-baseline justify-between py-1.5 border-b border-[#E7E5DF]">
                <span className="text-[#525854] font-sans">Recurrence Cluster Multiplier:</span>
                <span className="text-lg font-bold text-[#191C1B]">{stats.aggregationRatio}x</span>
              </div>

              <div className="flex items-baseline justify-between py-1.5 border-b border-[#E7E5DF]">
                <span className="text-[#525854] font-sans">P1 Critical Emergencies:</span>
                <span className="text-lg font-bold text-[#B45309]">{stats.activeCriticalP1}</span>
              </div>

              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-[#525854] font-sans">Average Municipal Turnaround:</span>
                <span className="text-base font-semibold text-[#191C1B]">{stats.averageResolutionDays} days</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D6D3CB] flex items-center justify-between text-[11px] text-[#706D66]">
              <span>Coverage: 7 Wards</span>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className="font-medium text-[#1B4D3E] hover:underline flex items-center gap-1"
              >
                <span>Operations Desk</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Recently Reported Issues (Editorial List) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#E7E5DF]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D66]">
              Active Registry
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#191C1B]">
              Recent Municipal Dispatches
            </h2>
          </div>
          <button
            onClick={() => onNavigate('issues')}
            className="text-xs font-semibold text-[#1B4D3E] hover:underline flex items-center gap-1"
          >
            <span>View All {stats.consolidatedIssues} Consolidated Issues</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="border border-[#D6D3CB] rounded-xl bg-white divide-y divide-[#E7E5DF] overflow-hidden">
          {recentIssues.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#858A85]">
              No active issues recorded in registry.
            </div>
          ) : (
            recentIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onOpenIssue && onOpenIssue(issue)}
                className="p-4 sm:p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1B4D3E] bg-[#E8EFEA] px-2 py-0.5 rounded">
                      {issue.id}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        issue.priorityTier === 'P1_CRITICAL'
                          ? 'bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40'
                          : issue.priorityTier === 'P2_HIGH'
                          ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FBBF24]/40'
                          : 'bg-[#F4F2EC] text-[#525854]'
                      }`}
                    >
                      {issue.priorityTier.replace('_', ' ')} &bull; {issue.priorityScore}/100
                    </span>
                    <span className="text-[11px] font-medium text-[#706D66] bg-[#F4F2EC] px-2 py-0.5 rounded">
                      {issue.category}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#191C1B] group-hover:text-[#1B4D3E] transition-colors">
                    {issue.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#636864]">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                      <span>{issue.address}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-[#1B4D3E]">
                      <Layers className="h-3 w-3" />
                      <span>{issue.reportsCount} citizen notices aggregated</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-[#858A85] block">Status</span>
                    <span className="text-xs font-semibold text-[#191C1B]">
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#A8A29E] group-hover:text-[#191C1B] transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 3: The 4-Agent Pipeline Field Dossier */}
      <section className="space-y-6 pt-4 border-t border-[#E7E5DF]">
        <div className="max-w-2xl">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D66]">
            Architectural Methodology
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#191C1B] mt-1">
            How CivicLens Operates
          </h2>
          <p className="text-xs sm:text-sm text-[#525854] mt-2 leading-relaxed">
            Instead of routing raw complaints directly into a backlog where duplicates drown urgent hazards, reports pass sequentially through four purpose-built Gemini agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Agent 1 */}
          <div className="p-5 rounded-xl border border-[#D6D3CB] bg-white space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E7E5DF] pb-2">
              <span className="font-mono text-xs font-bold text-[#1B4D3E]">Stage 01</span>
              <span className="text-[10px] font-mono uppercase text-[#706D66]">NLP Intake</span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#191C1B]">The Listener Agent</h3>
            <p className="text-xs text-[#525854] leading-relaxed">
              Extracts objective facts from emotional complaint text. Normalizes titles to municipal work-order standards, identifies 3–6 searchable tags, and detects immediate hazard indicators.
            </p>
          </div>

          {/* Agent 2 */}
          <div className="p-5 rounded-xl border border-[#D6D3CB] bg-white space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E7E5DF] pb-2">
              <span className="font-mono text-xs font-bold text-[#1B4D3E]">Stage 02</span>
              <span className="text-[10px] font-mono uppercase text-[#706D66]">Deduplication</span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#191C1B]">The Recurrence Agent</h3>
            <p className="text-xs text-[#525854] leading-relaxed">
              Analyzes spatial proximity and defect similarity against active issues. Clusters reports describing the same defect, or flags ambiguous matches to the municipal Review Desk.
            </p>
          </div>

          {/* Agent 3 */}
          <div className="p-5 rounded-xl border border-[#D6D3CB] bg-white space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E7E5DF] pb-2">
              <span className="font-mono text-xs font-bold text-[#1B4D3E]">Stage 03</span>
              <span className="text-[10px] font-mono uppercase text-[#706D66]">Risk Index</span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#191C1B]">The Severity Auditor</h3>
            <p className="text-xs text-[#525854] leading-relaxed">
              Calculates multidimensional risk: pedestrian and vehicular hazard (1–10), structural degradation, proximity to schools or hospitals, and environmental contamination.
            </p>
          </div>

          {/* Agent 4 */}
          <div className="p-5 rounded-xl border border-[#D6D3CB] bg-white space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E7E5DF] pb-2">
              <span className="font-mono text-xs font-bold text-[#1B4D3E]">Stage 04</span>
              <span className="text-[10px] font-mono uppercase text-[#706D66]">Deterministic SLA</span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#191C1B]">The Priority Dispatcher</h3>
            <p className="text-xs text-[#525854] leading-relaxed">
              Enforces transparent deterministic mathematical scoring combining 45% Severity, 25% Recurrence volume, 15% Ward sensitivity, and 15% Aging into an authoritative 1–100 score.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Community Impact & Closing Call */}
      <section className="bg-[#1B4D3E] text-white rounded-2xl p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3E5D0]">
            Collective Accountability
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal leading-tight">
            Every citizen report compounds the collective urgency of the issue.
          </h2>
          <p className="text-xs sm:text-sm text-[#D3EBE2] leading-relaxed">
            In standard 311 systems, repeated calls for the same pothole or water leak get buried or marked duplicate without escalating priority. In CivicLens, the recurrence multiplier guarantees that recurring citizen notices elevate the operational score and accelerate crew deployment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={onOpenReportModal}
            className="rounded-md bg-white hover:bg-[#F2F7F4] text-[#1B4D3E] font-semibold text-xs px-5 py-3 transition-colors shadow-xs"
          >
            File a Field Report Now
          </button>
          <button
            onClick={() => onNavigate('citizen-dashboard')}
            className="rounded-md border border-white/30 hover:bg-white/10 text-white font-medium text-xs px-5 py-3 transition-colors"
          >
            Open My Citizen Ledger
          </button>
        </div>
      </section>
    </div>
  );
};
