/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ConsolidatedIssue,
  DashboardStats,
  Notification,
  Report,
  ReviewQueueItem,
  User,
  UserRole,
  IssueStatus,
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingView } from './components/LandingView.tsx';
import { CitizenDashboard } from './components/CitizenDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ConsolidatedIssuesView } from './components/ConsolidatedIssuesView.tsx';
import { ReviewQueueView } from './components/ReviewQueueView.tsx';
import { AIMonitorView } from './components/AIMonitorView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ReportSubmissionModal } from './components/ReportSubmissionModal.tsx';
import { IssueDetailModal } from './components/IssueDetailModal.tsx';
import { DjangoDocsModal } from './components/DjangoDocsModal.tsx';
import { AdminAuthModal } from './components/AdminAuthModal.tsx';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CITIZEN');
  const [activeView, setActiveView] = useState<string>('landing');

  // Application Data State
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-citizen-1',
    name: 'Vandita Goel',
    email: 'goelvandita777@gmail.com',
    role: 'CITIZEN',
    ward: 'Ward 4 (Central Hospital & Metro Corridor)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    consolidatedIssues: 0,
    aggregationRatio: 1,
    activeCriticalP1: 0,
    resolvedThisMonth: 0,
    averageResolutionDays: 1.8,
    aiProcessingSuccessRate: 99.4,
    reportsByCategory: [],
    issuesByPriority: [],
    dailyIngestionTrends: [],
    wardHeatmap: [],
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [issues, setIssues] = useState<ConsolidatedIssue[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [selectedIssueModal, setSelectedIssueModal] = useState<ConsolidatedIssue | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, reportsRes, issuesRes, queueRes, logsRes, notifsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/reports'),
        fetch('/api/issues'),
        fetch('/api/review-queue'),
        fetch('/api/ai/logs'),
        fetch('/api/notifications?userId=usr-citizen-1'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (issuesRes.ok) setIssues(await issuesRes.json());
      if (queueRes.ok) setReviewQueue(await queueRes.json());
      if (logsRes.ok) setAgentLogs(await logsRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
    } catch (err) {
      console.error('Error loading CivicLens data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Role toggle with automatic navigation to the appropriate home view
  const handleToggleRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'ADMIN') {
      setCurrentUser({
        id: 'usr-admin-1',
        name: 'Director Marcus Vance',
        email: 'admin.dispatch@civiclens.gov',
        role: 'ADMIN',
        ward: 'Ward 1 (Civic Center)',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      });
      // Direct user straight to Operations Desk
      setActiveView('admin-dashboard');
    } else {
      setCurrentUser({
        id: 'usr-citizen-1',
        name: 'Vandita Goel',
        email: 'goelvandita777@gmail.com',
        role: 'CITIZEN',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      });
      // Direct user straight to My Citizen Ledger
      setActiveView('citizen-dashboard');
    }
  };

  // Report submission callback
  const handleReportSubmitted = () => {
    fetchData();
  };

  // Update status
  const handleUpdateStatus = async (issueId: string, status: IssueStatus) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actorName: currentUser.name,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
        if (selectedIssueModal?.id === issueId) {
          setSelectedIssueModal(updated);
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update department
  const handleUpdateDepartment = async (issueId: string, assignedDepartment: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedDepartment,
          actorName: currentUser.name,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
        if (selectedIssueModal?.id === issueId) {
          setSelectedIssueModal(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment
  const handleAddComment = async (issueId: string, text: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: currentUser.name,
          role: currentRole,
          text,
          isInternal: true,
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId ? { ...i, comments: [...i.comments, comment] } : i
          )
        );
        if (selectedIssueModal?.id === issueId) {
          setSelectedIssueModal((prev) =>
            prev ? { ...prev, comments: [...prev.comments, comment] } : null
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Review Queue
  const handleResolveReviewQueue = async (
    id: string,
    decision: 'MERGE' | 'CREATE_NEW' | 'DISMISS',
    notes: string
  ) => {
    try {
      const res = await fetch(`/api/review-queue/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes,
          officerName: currentUser.name,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Notifications
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Reseed Demo Data
  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingReviewCount = reviewQueue.filter((q) => q.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191C1B] flex flex-col font-sans selection:bg-[#1B4D3E] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        currentUser={currentUser}
        onToggleRole={handleToggleRole}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenDocsModal={() => setIsDocsModalOpen(true)}
        onOpenAdminAuthModal={() => setIsAdminAuthModalOpen(true)}
        notifications={notifications}
        pendingReviewCount={pendingReviewCount}
        onMarkNotificationRead={handleMarkNotificationRead}
        onResetDemo={handleResetDemo}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B4D3E] border-t-transparent" />
              <p className="text-xs font-mono text-[#706D66]">Loading CivicLens Field Register...</p>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'landing' && (
              <LandingView
                stats={stats}
                issues={issues}
                onSelectRole={handleToggleRole}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onNavigate={setActiveView}
                onOpenIssue={(iss) => setSelectedIssueModal(iss)}
                onOpenAdminAuthModal={() => setIsAdminAuthModalOpen(true)}
              />
            )}

            {activeView === 'citizen-dashboard' && (
              <CitizenDashboard
                currentUser={currentUser}
                reports={reports}
                issues={issues}
                notifications={notifications}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenIssue={(iss) => setSelectedIssueModal(iss)}
              />
            )}

            {activeView === 'admin-dashboard' && (
              <AdminDashboard
                stats={stats}
                issues={issues}
                onOpenIssue={(iss) => setSelectedIssueModal(iss)}
                onOpenReviewQueue={() => setActiveView('review-queue')}
              />
            )}

            {activeView === 'issues' && (
              <ConsolidatedIssuesView
                issues={issues}
                onOpenIssue={(iss) => setSelectedIssueModal(iss)}
              />
            )}

            {activeView === 'review-queue' && (
              <ReviewQueueView
                queueItems={reviewQueue}
                onResolve={handleResolveReviewQueue}
                onOpenIssue={(issId) => {
                  const target = issues.find((i) => i.id === issId);
                  if (target) setSelectedIssueModal(target);
                }}
              />
            )}

            {activeView === 'ai-monitor' && (
              <AIMonitorView
                logs={agentLogs}
                onRefreshLogs={fetchData}
              />
            )}

            {activeView === 'analytics' && (
              <AnalyticsView
                stats={stats}
                issues={issues}
              />
            )}
          </>
        )}
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-[#E7E5DF] bg-[#F4F2EC] py-8 text-xs text-[#706D66]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-serif font-bold text-[#191C1B] text-sm">
              CivicLens Field Register
            </div>
            <p className="text-[11px] text-[#706D66]">
              Autonomous municipal issue aggregation &amp; deterministic hazard prioritization. Powered by Google Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {currentRole === 'CITIZEN' ? (
              <button
                onClick={() => setIsAdminAuthModalOpen(true)}
                className="text-[#1B4D3E] font-semibold underline hover:text-[#133E32]"
              >
                Officer Access Gate
              </button>
            ) : (
              <button
                onClick={() => handleToggleRole('CITIZEN')}
                className="text-[#525854] hover:underline"
              >
                Switch to Citizen View
              </button>
            )}
            <span className="text-[#D6D3CB]">&bull;</span>
            <button
              onClick={() => setIsDocsModalOpen(true)}
              className="hover:text-[#1B4D3E] underline transition-colors"
            >
              Stack Architecture Specs
            </button>
            <span className="text-[#D6D3CB]">&bull;</span>
            <button
              onClick={() => setActiveView('ai-monitor')}
              className="hover:text-[#1B4D3E] underline transition-colors"
            >
              Agent Telemetry Ledger
            </button>
            <span className="text-[#D6D3CB]">&bull;</span>
            <span>Vol. 2026</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ReportSubmissionModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        onReportSubmitted={handleReportSubmitted}
      />

      <IssueDetailModal
        issue={selectedIssueModal}
        onClose={() => setSelectedIssueModal(null)}
        currentRole={currentRole}
        onUpdateStatus={handleUpdateStatus}
        onUpdateDepartment={handleUpdateDepartment}
        onAddComment={handleAddComment}
      />

      <DjangoDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onLoginAsAdmin={() => handleToggleRole('ADMIN')}
      />
    </div>
  );
}
