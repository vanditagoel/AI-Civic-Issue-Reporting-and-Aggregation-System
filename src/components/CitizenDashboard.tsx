import React from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { ConsolidatedIssue, Notification, Report, User } from '../types/index.ts';

interface CitizenDashboardProps {
  currentUser: User;
  reports: Report[];
  issues: ConsolidatedIssue[];
  notifications: Notification[];
  onOpenReportModal: () => void;
  onOpenIssue: (issue: ConsolidatedIssue) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  currentUser,
  reports,
  issues,
  notifications,
  onOpenReportModal,
  onOpenIssue,
}) => {
  const myReports = reports.filter(
    (r) => r.citizenId === currentUser.id || r.citizenEmail === currentUser.email
  );

  const localIssues = issues.filter(
    (i) => i.ward.includes('Ward 4') || i.ward === currentUser.ward
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="font-mono text-[10px] font-semibold uppercase text-[#1B4D3E] bg-[#E8EFEA] px-2 py-0.5 rounded">
            RESOLVED
          </span>
        );
      case 'ASSOCIATED':
        return (
          <span className="font-mono text-[10px] font-semibold uppercase text-[#0369A1] bg-[#F0F9FF] px-2 py-0.5 rounded">
            CLUSTERED INTO WORK ORDER
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="font-mono text-[10px] font-semibold uppercase text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded">
            UNDER TRIAGE
          </span>
        );
      default:
        return (
          <span className="font-mono text-[10px] font-semibold uppercase text-[#525854] bg-[#F4F2EC] px-2 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 text-[#191C1B]">
      {/* Citizen Ledger Header */}
      <div className="border-b border-[#E7E5DF] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#1B4D3E] font-semibold">
                Citizen Contributor Ledger
              </span>
              <span className="text-[#A8A29E]">&bull;</span>
              <span className="font-mono text-[10px] text-[#706D66]">{currentUser.ward}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#191C1B]">
              Field Activity &bull; {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#525854]">
              Track your individual street reports and monitor nearby municipal maintenance dockets in real time.
            </p>
          </div>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>File New Defect Notice</span>
          </button>
        </div>
      </div>

      {/* Main Grid: My Reports (7 cols) + Local Ward Activity (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: My Reports Ledger */}
        <div className="lg:col-span-7 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                Personal Dispatch Register
              </span>
              <h2 className="font-serif font-bold text-lg text-[#191C1B]">
                My Submitted Civic Reports
              </h2>
            </div>
            <span className="font-mono text-xs text-[#1B4D3E] font-bold bg-[#E8EFEA] px-2 py-0.5 rounded">
              {myReports.length} notices on file
            </span>
          </div>

          <div className="divide-y divide-[#E7E5DF]">
            {myReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#858A85] space-y-2">
                <p>You have not submitted any civic reports yet.</p>
                <button
                  onClick={onOpenReportModal}
                  className="text-[#1B4D3E] underline font-semibold"
                >
                  File your first report on your street
                </button>
              </div>
            ) : (
              myReports.map((report) => {
                const linkedIssue = report.consolidatedIssueId
                  ? issues.find((i) => i.id === report.consolidatedIssueId)
                  : null;

                return (
                  <div key={report.id} className="py-4 space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1B4D3E]">{report.id}</span>
                        {getStatusBadge(report.status)}
                        <span className="text-[11px] text-[#706D66] font-medium bg-[#F4F2EC] px-2 py-0.5 rounded">
                          {report.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#858A85]">
                        {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#191C1B]">{report.title}</h3>

                    <p className="text-xs text-[#525854] leading-relaxed line-clamp-2">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#706D66] pt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" />
                      <span>{report.address}</span>
                    </div>

                    {/* Associated Issue Callout */}
                    {linkedIssue && (
                      <div className="mt-2 p-3 rounded-lg border border-[#D6D3CB] bg-[#F7F5EF] flex items-center justify-between text-xs">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold block">
                            Aggregated Municipal Docket #{linkedIssue.id}
                          </span>
                          <span className="font-serif font-bold text-sm text-[#191C1B] line-clamp-1">
                            {linkedIssue.title}
                          </span>
                          <span className="font-mono text-[10px] text-[#1B4D3E]">
                            Priority {linkedIssue.priorityTier} &bull; {linkedIssue.reportsCount} citizen notices aggregated
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenIssue(linkedIssue)}
                          className="px-3 py-1.5 rounded bg-white hover:bg-[#EAE6DC] text-[#191C1B] font-semibold text-xs border border-[#D6D3CB] flex-shrink-0 transition-colors"
                        >
                          View Docket
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Ward 4 Active Maintenance Dockets */}
        <div className="lg:col-span-5 rounded-xl border border-[#D6D3CB] bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E7E5DF] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#706D66]">
                Geographic Ward Monitor
              </span>
              <h2 className="font-serif font-bold text-lg text-[#191C1B]">
                Active Work in Ward 4
              </h2>
            </div>
            <span className="text-xs font-mono text-[#1B4D3E] font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1B4D3E] animate-pulse" />
              Live
            </span>
          </div>

          <div className="divide-y divide-[#E7E5DF]">
            {localIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onOpenIssue(issue)}
                className="py-3 hover:bg-[#FAF9F5] px-2 rounded-lg cursor-pointer transition-colors space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1B4D3E]">{issue.id}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      issue.priorityTier === 'P1_CRITICAL'
                        ? 'bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40'
                        : 'bg-[#FFFBEB] text-[#B45309] border border-[#FBBF24]/40'
                    }`}
                  >
                    {issue.priorityTier}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-sm text-[#191C1B] group-hover:text-[#1B4D3E] transition-colors line-clamp-1">
                  {issue.title}
                </h4>

                <div className="text-xs text-[#706D66] flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#1B4D3E]" />
                  <span className="truncate">{issue.address}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#858A85] pt-0.5">
                  <span>Assigned: {issue.assignedDepartment.split(' ')[0]}...</span>
                  <span className="text-[#1B4D3E] font-medium">{issue.reportsCount} notices</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
