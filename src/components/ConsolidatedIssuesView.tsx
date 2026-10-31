import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  Flame,
  AlertTriangle,
  Building,
  CheckCircle2,
  List,
  LayoutGrid,
} from 'lucide-react';
import { CivicCategory, ConsolidatedIssue, IssueStatus, PriorityTier } from '../types/index.ts';

interface ConsolidatedIssuesViewProps {
  issues: ConsolidatedIssue[];
  onOpenIssue: (issue: ConsolidatedIssue) => void;
}

export const ConsolidatedIssuesView: React.FC<ConsolidatedIssuesViewProps> = ({
  issues,
  onOpenIssue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'recency' | 'reports'>('priority');

  const filteredIssues = issues.filter((issue) => {
    if (selectedTier !== 'ALL' && issue.priorityTier !== selectedTier) return false;
    if (selectedCategory !== 'ALL' && issue.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && issue.status !== selectedStatus) return false;
    if (selectedWard !== 'ALL' && !issue.ward.includes(selectedWard)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        issue.id.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort
  filteredIssues.sort((a, b) => {
    if (sortBy === 'priority') return b.priorityScore - a.priorityScore;
    if (sortBy === 'reports') return b.reportsCount - a.reportsCount;
    return new Date(b.lastReportedAt).getTime() - new Date(a.lastReportedAt).getTime();
  });

  const getTierBadge = (tier: PriorityTier, score: number) => {
    switch (tier) {
      case 'P1_CRITICAL':
        return (
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40">
            P1 CRITICAL [{score}]
          </span>
        );
      case 'P2_HIGH':
        return (
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FBBF24]/40">
            P2 HIGH [{score}]
          </span>
        );
      case 'P3_MEDIUM':
        return (
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047]/40">
            P3 MEDIUM [{score}]
          </span>
        );
      default:
        return (
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4F2EC] text-[#525854] border border-[#D6D3CB]">
            P4 LOW [{score}]
          </span>
        );
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="text-[10px] font-mono uppercase font-semibold text-[#1B4D3E] bg-[#E8EFEA] px-2 py-0.5 rounded">
            RESOLVED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="text-[10px] font-mono uppercase font-semibold text-[#0369A1] bg-[#F0F9FF] px-2 py-0.5 rounded">
            IN PROGRESS
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="text-[10px] font-mono uppercase font-semibold text-[#6D28D9] bg-[#F5F3FF] px-2 py-0.5 rounded">
            ASSIGNED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase font-semibold text-[#525854] bg-[#F4F2EC] px-2 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 text-[#191C1B]">
      {/* Header */}
      <div className="border-b border-[#E7E5DF] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D66]">
              Urban Audit Explorer
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191C1B] mt-1">
              Consolidated Civic Issues
            </h1>
            <p className="text-xs sm:text-sm text-[#525854] mt-1.5 max-w-2xl leading-relaxed">
              Every row below represents an active consolidated civic defect synthesized from community reporting. Ranked deterministically by authoritative priority score (1–100).
            </p>
          </div>
          <span className="font-mono text-xs text-[#706D66] bg-[#F4F2EC] px-3 py-1.5 rounded border border-[#D6D3CB]">
            {filteredIssues.length} tickets cataloged
          </span>
        </div>
      </div>

      {/* Filter and Query Panel */}
      <div className="bg-[#F7F5EF] border border-[#D6D3CB] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#858A85]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by defect, street, ID, or keyword..."
              className="w-full rounded-md border border-[#D6D3CB] bg-white pl-9 pr-3.5 py-2 text-xs text-[#191C1B] placeholder-[#858A85] focus:border-[#1B4D3E] focus:outline-none"
            />
          </div>

          {/* Priority Tier */}
          <div className="md:col-span-2">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full rounded-md border border-[#D6D3CB] bg-white px-2.5 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none font-sans"
            >
              <option value="ALL">All Priorities</option>
              <option value="P1_CRITICAL">P1 Critical (&ge;80)</option>
              <option value="P2_HIGH">P2 High (62–79)</option>
              <option value="P3_MEDIUM">P3 Medium (40–61)</option>
              <option value="P4_LOW">P4 Low (&lt;40)</option>
            </select>
          </div>

          {/* Category */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-[#D6D3CB] bg-white px-2.5 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none font-sans"
            >
              <option value="ALL">All Categories</option>
              <option value="Roads & Bridges">Roads &amp; Bridges</option>
              <option value="Water & Drainage">Water &amp; Drainage</option>
              <option value="Sanitation & Solid Waste">Sanitation &amp; Waste</option>
              <option value="Streetlights & Electrical">Streetlights &amp; Power</option>
              <option value="Public Safety & Hazards">Public Safety &amp; Hazards</option>
              <option value="Parks & Public Spaces">Parks &amp; Public Spaces</option>
              <option value="Traffic & Signage">Traffic &amp; Signage</option>
            </select>
          </div>

          {/* Sort */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-md border border-[#D6D3CB] bg-white px-2.5 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none font-sans"
            >
              <option value="priority">Sort: Priority High</option>
              <option value="reports">Sort: Most Reports</option>
              <option value="recency">Sort: Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured Ledger List */}
      <div className="border border-[#D6D3CB] rounded-xl bg-white divide-y divide-[#E7E5DF] overflow-hidden shadow-xs">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#858A85] space-y-2">
            <p>No issues matching selected search parameters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTier('ALL');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-[#1B4D3E] underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onOpenIssue(issue)}
              className="p-4 sm:p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Column: ID, Priority, Title, Summary */}
              <div className="space-y-1.5 flex-1 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1B4D3E] bg-[#E8EFEA] px-2 py-0.5 rounded">
                    {issue.id}
                  </span>
                  {getTierBadge(issue.priorityTier, issue.priorityScore)}
                  <span className="text-[11px] font-medium text-[#706D66] bg-[#F4F2EC] px-2 py-0.5 rounded">
                    {issue.category}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base sm:text-lg text-[#191C1B] group-hover:text-[#1B4D3E] transition-colors">
                  {issue.title}
                </h3>

                <p className="text-xs text-[#525854] leading-relaxed line-clamp-1 max-w-3xl">
                  {issue.summary || issue.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#636864] pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                    <span>{issue.address}</span>
                  </span>
                  <span className="text-[#A8A29E]">&bull;</span>
                  <span>{issue.ward}</span>
                  <span className="text-[#A8A29E]">&bull;</span>
                  <span className="font-mono text-[11px] font-semibold text-[#1B4D3E]">
                    {issue.reportsCount} citizen reports aggregated
                  </span>
                </div>
              </div>

              {/* Right Column: Status & Department */}
              <div className="flex items-center gap-5 self-end md:self-center flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#E7E5DF] w-full md:w-auto justify-between md:justify-end">
                <div className="text-left md:text-right space-y-0.5">
                  <div className="flex items-center md:justify-end gap-1.5">
                    {getStatusBadge(issue.status)}
                  </div>
                  <div className="text-[11px] text-[#706D66] font-sans">
                    {issue.assignedDepartment.split(' ')[0]}...
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#A8A29E] group-hover:text-[#191C1B] transition-colors flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
