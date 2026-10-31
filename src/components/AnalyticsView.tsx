import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  MapPin,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import { ConsolidatedIssue, DashboardStats } from '../types/index.ts';

interface AnalyticsViewProps {
  stats: DashboardStats;
  issues: ConsolidatedIssue[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, issues }) => {
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(issues, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'civiclens_municipal_issues.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = 'ID,Title,Category,Ward,PriorityScore,PriorityTier,Status,ReportsCount\n';
    const rows = issues
      .map(
        (i) =>
          `"${i.id}","${i.title.replace(/"/g, '""')}","${i.category}","${i.ward}",${i.priorityScore},"${i.priorityTier}","${i.status}",${i.reportsCount}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'civiclens_issues_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8 text-[#191C1B]">
      {/* Header */}
      <div className="border-b border-[#E7E5DF] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#1B4D3E] font-semibold">
              Urban Research &bull; Municipal Council Briefing
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191C1B] mt-1">
              Civic Intelligence &amp; Ingestion Indices
            </h1>
            <p className="text-xs sm:text-sm text-[#525854] mt-1.5 max-w-2xl leading-relaxed">
              Evaluating multi-agent deduplication savings, geographic vulnerability indices, and resolution efficiency across all 7 municipal wards.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-md border border-[#D6D3CB] bg-[#F5F3EC] px-3 py-1.5 text-xs font-semibold text-[#191C1B] hover:bg-[#ECE8DF] transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#1B4D3E]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ward Heatmap & Deduplication Efficiency Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ward Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                Geographic Risk Index
              </span>
              <h3 className="font-serif font-bold text-lg text-[#191C1B]">
                Average Priority Score by Ward
              </h3>
            </div>
            <span className="font-mono text-xs text-[#706D66]">7 Districts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.wardHeatmap} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="ward" stroke="#706D66" fontSize={10} angle={-15} textAnchor="end" tickLine={false} />
                <YAxis stroke="#706D66" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF9F5',
                    borderColor: '#D6D3CB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#191C1B',
                  }}
                />
                <Bar dataKey="avgPriorityScore" name="Avg Priority Score" fill="#1B4D3E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deduplication Cost-Savings (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4 shadow-xs">
          <div className="border-b border-[#E7E5DF] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
              Operational Efficiency
            </span>
            <h3 className="font-serif font-bold text-lg text-[#191C1B]">
              Deduplication Multiplier: {stats.aggregationRatio}x
            </h3>
          </div>

          <p className="text-xs text-[#525854] leading-relaxed">
            By correlating spatial coordinates and problem descriptions across the city, the <strong>Recurrence Agent</strong> prevented redundant municipal truck rolls.
          </p>

          <div className="space-y-2 pt-2 border-t border-[#E7E5DF] font-mono text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#E7E5DF]/60">
              <span className="text-[#706D66] font-sans">Citizen Filings Ingested:</span>
              <span className="font-bold text-[#191C1B]">{stats.totalReports}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#E7E5DF]/60">
              <span className="text-[#706D66] font-sans">Consolidated Work Dockets:</span>
              <span className="font-bold text-[#1B4D3E]">{stats.consolidatedIssues}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#706D66] font-sans">Redundant Trips Averted:</span>
              <span className="font-bold text-[#1B4D3E]">
                {stats.totalReports - stats.consolidatedIssues} dispatches
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
