import React from 'react';
import {
  ShieldAlert,
  Flame,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Building,
  AlertTriangle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { ConsolidatedIssue, DashboardStats } from '../types/index.ts';

interface AdminDashboardProps {
  stats: DashboardStats;
  issues: ConsolidatedIssue[];
  onOpenIssue: (issue: ConsolidatedIssue) => void;
  onOpenReviewQueue: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  issues,
  onOpenIssue,
  onOpenReviewQueue,
}) => {
  const topIssues = issues.slice(0, 5);

  // Palette for chart cells (editorial colors)
  const priorityColors = ['#991B1B', '#B45309', '#D97706', '#525854'];

  return (
    <div className="space-y-8 text-[#191C1B]">
      {/* Operations Room Masthead */}
      <div className="border-b border-[#E7E5DF] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#1B4D3E] font-semibold">
                Operations Command &bull; City Dispatch Console
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191C1B] mt-1">
              Municipal Workload &amp; Triage Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#525854] mt-1.5 max-w-2xl leading-relaxed">
              Consolidated operational intelligence. Multi-agent machine pipeline correlates citizen incident dispatches, calculates structural damage severity, and enforces deterministic priority scoring.
            </p>
          </div>

          <button
            onClick={onOpenReviewQueue}
            className="flex items-center gap-2 rounded-md bg-[#FFFBEB] border border-[#FBBF24]/50 px-3.5 py-2 text-xs font-semibold text-[#B45309] hover:bg-[#FEF3C7] transition-colors self-start sm:self-auto"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Open Triage Desk</span>
          </button>
        </div>
      </div>

      {/* Asymmetrical Metric Ledger Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold block">
            Ingested Reports
          </span>
          <div className="font-mono text-2xl font-bold text-[#191C1B]">{stats.totalReports}</div>
          <span className="text-[10px] text-[#706D66] block">Citizen filings</span>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold block">
            Active Tickets
          </span>
          <div className="font-mono text-2xl font-bold text-[#1B4D3E]">{stats.consolidatedIssues}</div>
          <span className="text-[10px] text-[#706D66] block">Consolidated dockets</span>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold block">
            Cluster Ratio
          </span>
          <div className="font-mono text-2xl font-bold text-[#1B4D3E]">{stats.aggregationRatio}x</div>
          <span className="text-[10px] text-[#706D66] block">Reports per defect</span>
        </div>

        <div className="p-4 rounded-xl border border-[#F87171]/40 bg-[#FDF2F2] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#991B1B] font-semibold block">
            P1 Emergencies
          </span>
          <div className="font-mono text-2xl font-bold text-[#991B1B]">{stats.activeCriticalP1}</div>
          <span className="text-[10px] text-[#991B1B]/80 block">Level-1 response</span>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold block">
            Avg Turnaround
          </span>
          <div className="font-mono text-2xl font-bold text-[#191C1B]">{stats.averageResolutionDays}d</div>
          <span className="text-[10px] text-[#706D66] block">Resolution cycle</span>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-white space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold block">
            Agent SLA
          </span>
          <div className="font-mono text-2xl font-bold text-[#1B4D3E]">{stats.aiProcessingSuccessRate}%</div>
          <span className="text-[10px] text-[#706D66] block">gemini-3.8-flash</span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                7-Day Ingestion Velocity
              </span>
              <h3 className="font-serif font-bold text-lg text-[#191C1B]">
                Raw Citizen Notices vs. Deduplicated Work Orders
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[#1B4D3E] font-semibold bg-[#E8EFEA] px-2 py-0.5 rounded">
              Deduplication Rate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyIngestionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="editorialReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="editorialMerged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B45309" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#B45309" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#706D66" fontSize={11} tickLine={false} />
                <YAxis stroke="#706D66" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF9F5',
                    borderColor: '#D6D3CB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#191C1B',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reports"
                  name="Raw Reports Ingested"
                  stroke="#1B4D3E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#editorialReports)"
                />
                <Area
                  type="monotone"
                  dataKey="merged"
                  name="Deduplicated Work Tickets"
                  stroke="#B45309"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#editorialMerged)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Tier Donut Chart (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4">
          <div className="border-b border-[#E7E5DF] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
              Risk Allocation
            </span>
            <h3 className="font-serif font-bold text-lg text-[#191C1B]">
              Priority Tier Distribution
            </h3>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.issuesByPriority}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {stats.issuesByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={priorityColors[index % priorityColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF9F5',
                    borderColor: '#D6D3CB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-1 text-xs font-mono">
            {stats.issuesByPriority.map((item, idx) => (
              <div key={item.tier} className="flex items-center justify-between py-1 border-b border-[#E7E5DF]/60">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityColors[idx % priorityColors.length] }} />
                  <span className="text-[#525854] font-sans">{item.tier}:</span>
                </div>
                <span className="font-bold text-[#191C1B]">{item.count} tickets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Breakdown and Priority-Ranked Issue Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Bar Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4">
          <div className="border-b border-[#E7E5DF] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
              Domain Breakdown
            </span>
            <h3 className="font-serif font-bold text-lg text-[#191C1B]">
              Notices by Municipal Category
            </h3>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.reportsByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#706D66" fontSize={10} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#525854" fontSize={10} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF9F5',
                    borderColor: '#D6D3CB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#1B4D3E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority-Ranked Work Queue (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                Operational Dispatch Priority
              </span>
              <h3 className="font-serif font-bold text-lg text-[#191C1B]">
                Immediate Priority Queue
              </h3>
            </div>
            <span className="font-mono text-xs text-[#706D66]">Top 5 Active</span>
          </div>

          <div className="divide-y divide-[#E7E5DF]">
            {topIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onOpenIssue(issue)}
                className="py-3.5 hover:bg-[#FAF9F5] px-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1B4D3E]">{issue.id}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        issue.priorityTier === 'P1_CRITICAL'
                          ? 'bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40'
                          : issue.priorityTier === 'P2_HIGH'
                          ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FBBF24]/40'
                          : 'bg-[#F4F2EC] text-[#525854]'
                      }`}
                    >
                      Score {issue.priorityScore}/100
                    </span>
                    <span className="text-[11px] text-[#706D66]">{issue.category}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#191C1B] group-hover:text-[#1B4D3E] transition-colors line-clamp-1">
                    {issue.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#636864]">
                    <span>{issue.address}</span>
                    <span className="text-[#A8A29E]">&bull;</span>
                    <span className="font-mono text-[11px] font-medium text-[#1B4D3E]">
                      {issue.reportsCount} citizen notices
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#A8A29E] group-hover:text-[#191C1B] transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
