import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Bell,
  Plus,
  BookOpen,
  UserCheck,
  Building2,
  RotateCcw,
  Compass,
  FileText,
  AlertTriangle,
  Cpu,
  BarChart3,
} from 'lucide-react';
import { Notification, UserRole } from '../types/index.ts';

interface NavbarProps {
  currentRole: UserRole;
  onToggleRole: (newRole: UserRole) => void;
  onOpenReportModal: () => void;
  onOpenDocsModal: () => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onResetDemo: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onToggleRole,
  onOpenReportModal,
  onOpenDocsModal,
  notifications,
  onMarkNotificationRead,
  onResetDemo,
  activeView,
  setActiveView,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E5DF] bg-[#FAF9F5]/95 backdrop-blur-md text-[#191C1B]">
      {/* Top Editorial Notice Bar */}
      <div className="border-b border-[#E7E5DF]/70 bg-[#F4F2EC] px-4 py-1 text-[11px] text-[#636864] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono uppercase tracking-widest text-[10px] font-semibold text-[#1B4D3E]">
            Metropolitan Civic Register
          </span>
          <span className="hidden sm:inline text-[#B5B2A8]">&bull;</span>
          <span className="hidden sm:inline">District Field Operations &amp; Autonomous Issue Aggregation</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-[#1B4D3E] font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1B4D3E] animate-pulse" />
            4-Agent Engine Active
          </span>
          <span className="text-[#B5B2A8]">&bull;</span>
          <button
            onClick={onResetDemo}
            className="hover:text-[#191C1B] underline transition-colors"
            title="Reset to default seed cases"
          >
            Reset Field Data
          </button>
        </div>
      </div>

      {/* Main Header Masthead */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Masthead */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('landing')}
            className="flex items-baseline gap-2 text-left focus:outline-none group"
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-[#191C1B] group-hover:text-[#1B4D3E] transition-colors">
              CivicLens
            </span>
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-widest text-[#706D66] border-l border-[#D6D3CB] pl-2">
              Vol. 2026 / Ed. 4
            </span>
          </button>
        </div>

        {/* Center: Editorial Section Nav */}
        <nav className="hidden lg:flex items-center gap-1 font-sans text-xs">
          <button
            onClick={() => setActiveView('landing')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'landing'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('issues')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'issues'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            Issue Explorer
          </button>
          <button
            onClick={() => setActiveView('citizen-dashboard')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'citizen-dashboard'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            Citizen Ledger
          </button>
          <button
            onClick={() => setActiveView('admin-dashboard')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'admin-dashboard'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            Operations Desk
          </button>
          <button
            onClick={() => setActiveView('review-queue')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'review-queue'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            Triage Desk
          </button>
          <button
            onClick={() => setActiveView('ai-monitor')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'ai-monitor'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            AI Pipeline
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'analytics'
                ? 'font-semibold text-[#1B4D3E] bg-[#EBE8E0]'
                : 'text-[#5A605B] hover:text-[#191C1B]'
            }`}
          >
            Analytics
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Docs modal launcher */}
          <button
            onClick={onOpenDocsModal}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#D6D3CB] bg-[#F5F3EC] px-2.5 py-1.5 text-xs font-medium text-[#444845] hover:border-[#1B4D3E] hover:text-[#191C1B] transition-colors"
            title="Inspect Django REST & PostgreSQL Technical Specifications"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#1B4D3E]" />
            <span className="font-mono text-[11px]">Stack Specs</span>
          </button>

          {/* Role switcher toggle */}
          <div className="flex items-center rounded-lg bg-[#EFECE4] p-0.5 border border-[#D6D3CB]">
            <button
              onClick={() => onToggleRole('CITIZEN')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentRole === 'CITIZEN'
                  ? 'bg-white text-[#191C1B] shadow-xs font-semibold'
                  : 'text-[#636864] hover:text-[#191C1B]'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Citizen</span>
            </button>
            <button
              onClick={() => onToggleRole('ADMIN')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentRole === 'ADMIN'
                  ? 'bg-[#1B4D3E] text-white shadow-xs font-semibold'
                  : 'text-[#636864] hover:text-[#191C1B]'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Officer</span>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative rounded-md border border-[#D6D3CB] bg-[#F5F3EC] p-2 text-[#444845] hover:text-[#191C1B] hover:border-[#1B4D3E] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B45309] text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#D6D3CB] bg-[#FCFBF7] p-3 shadow-xl z-50 text-[#191C1B]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E7E5DF]">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-[#191C1B]">
                      Field Notifications
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#706D66]">{notifications.length} logged</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#858A85]">
                      No active notices in journal.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.isRead
                            ? 'border-[#E7E5DF] bg-[#FAF9F5] text-[#706D66]'
                            : 'border-[#1B4D3E]/40 bg-[#F2F7F4] text-[#191C1B]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-[#191C1B]">{n.title}</span>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[#1B4D3E] flex-shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-[#444845] leading-relaxed">{n.message}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#858A85]">
                          <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {n.issueId && <span className="font-bold text-[#1B4D3E]">{n.issueId}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>File Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
