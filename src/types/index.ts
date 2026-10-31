export type UserRole = 'CITIZEN' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward: string;
  avatar?: string;
}

export type CivicCategory =
  | 'Roads & Bridges'
  | 'Sanitation & Solid Waste'
  | 'Water & Drainage'
  | 'Streetlights & Electrical'
  | 'Public Safety & Hazards'
  | 'Parks & Public Spaces'
  | 'Traffic & Signage';

export type ReportStatus =
  | 'PENDING_ANALYSIS'
  | 'PROCESSED'
  | 'ASSOCIATED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'REJECTED';

export type IssueStatus =
  | 'NEW'
  | 'TRIAGED'
  | 'IN_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type PriorityTier = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ListenerAgentOutput {
  normalizedTitle: string;
  normalizedDescription: string;
  category: CivicCategory;
  urgencySelfStated: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  keywords: string[];
  summary: string;
  confidenceScore: number; // 0.0 - 1.0
  sentiment: 'neutral' | 'frustrated' | 'urgent' | 'constructive';
  hazardType: 'immediate_road_hazard' | 'structural' | 'hygiene_sanitation' | 'electrical_fire' | 'flooding' | 'none';
}

export interface RecurrenceAgentOutput {
  decision: 'MATCH_EXISTING' | 'CREATE_NEW' | 'NEEDS_REVIEW';
  matchedIssueId: string | null;
  confidence: number;
  reasoning: string;
  similarityScore: number;
  candidateMatches?: Array<{
    issueId: string;
    issueTitle: string;
    similarity: number;
    reason: string;
  }>;
}

export interface SeverityAgentOutput {
  severityLevel: SeverityLevel;
  publicSafetyRisk: number; // 1-10
  infrastructureDamageRisk: number; // 1-10
  vulnerablePopulationImpact: boolean;
  economicOrTrafficDisruption: number; // 1-10
  environmentalHazard: boolean;
  severityScore: number; // 1-100
  keyRisks: string[];
  justification: string;
}

export interface PriorityAgentOutput {
  priorityTier: PriorityTier;
  recommendedAction: string;
  dispatchUrgency: 'IMMEDIATE_2H' | 'WITHIN_24H' | 'WITHIN_72H' | 'SCHEDULED';
  explanation: string;
  suggestedDepartment: string;
}

export interface Report {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  title: string;
  description: string;
  category: CivicCategory;
  address: string;
  ward: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  citizenUrgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: ReportStatus;
  consolidatedIssueId?: string | null;
  listenerOutput?: ListenerAgentOutput;
  recurrenceOutput?: RecurrenceAgentOutput;
  createdAt: string;
  updatedAt: string;
}

export interface IssueActivity {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  type: 'CREATION' | 'MERGE' | 'STATUS_CHANGE' | 'AI_REASSESSMENT' | 'COMMENT' | 'DISPATCH';
}

export interface IssueComment {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: string;
  isInternal: boolean;
}

export interface ConsolidatedIssue {
  id: string;
  title: string;
  category: CivicCategory;
  description: string;
  summary: string;
  address: string;
  ward: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: IssueStatus;
  priorityTier: PriorityTier;
  priorityScore: number; // 0 - 100 authoritative deterministic
  severityScore: number; // 0 - 100
  severityLevel: SeverityLevel;
  assignedDepartment: string;
  reportsCount: number;
  reportIds: string[];
  reports?: Report[];
  agentOutputs: {
    listenerSummary: string;
    severityAssessment: SeverityAgentOutput;
    priorityAssessment: PriorityAgentOutput;
    lastUpdated: string;
  };
  recurrenceVelocity: number; // reports/day
  firstReportedAt: string;
  lastReportedAt: string;
  estimatedResolutionDays?: number;
  timeline: IssueActivity[];
  comments: IssueComment[];
}

export interface ReviewQueueItem {
  id: string;
  reportId: string;
  report: Report;
  candidateIssueId: string;
  candidateIssue: ConsolidatedIssue;
  recurrenceConfidence: number;
  recurrenceReasoning: string;
  status: 'PENDING' | 'MERGED' | 'CREATED_NEW' | 'DISMISSED';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface AIAgentLog {
  id: string;
  timestamp: string;
  agentName: 'Listener Agent' | 'Recurrence Agent' | 'Severity Agent' | 'Priority Agent';
  reportId?: string;
  issueId?: string;
  model: string;
  status: 'SUCCESS' | 'FALLBACK' | 'ERROR';
  durationMs: number;
  promptSummary: string;
  structuredResult: any;
  tokenEstimate?: number;
}

export interface Notification {
  id: string;
  userId: string;
  reportId?: string;
  issueId?: string;
  title: string;
  message: string;
  type: 'STATUS_UPDATE' | 'MERGED' | 'RESOLVED' | 'ADMIN_ACTION';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  consolidatedIssues: number;
  aggregationRatio: number; // e.g. 3.4 reports per issue
  activeCriticalP1: number;
  resolvedThisMonth: number;
  averageResolutionDays: number;
  aiProcessingSuccessRate: number;
  reportsByCategory: Array<{ category: string; count: number }>;
  issuesByPriority: Array<{ tier: string; count: number; color: string }>;
  dailyIngestionTrends: Array<{ date: string; reports: number; merged: number }>;
  wardHeatmap: Array<{ ward: string; activeIssues: number; highPriority: number; avgPriorityScore: number }>;
}
