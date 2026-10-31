import { PriorityTier, SeverityLevel } from '../types/index.ts';

export interface ScoringFactors {
  severityScore: number; // 1 - 100 from Severity Agent
  reportsCount: number; // number of reports consolidated
  ward: string;
  category: string;
  firstReportedAt: string;
}

export interface PriorityScoreResult {
  numericScore: number; // 1 - 100
  tier: PriorityTier;
  factors: {
    baseSeverityContribution: number;
    recurrenceContribution: number;
    locationContribution: number;
    agingContribution: number;
  };
  explanation: string;
}

// Sensitive wards (schools, medical districts, dense transit hubs)
const SENSITIVE_WARDS: Record<string, number> = {
  'Ward 4 (Central Hospital & Metro Corridor)': 95,
  'Ward 2 (Downtown & School District)': 88,
  'Ward 7 (East Market & High-Density Residential)': 78,
  'Ward 1 (Civic Center)': 72,
  'Ward 5 (North Industrial Park)': 55,
  'Ward 3 (West Suburbs)': 45,
  'Ward 6 (Harbor & Logistics Hub)': 62,
};

export function calculateDeterministicPriority(factors: ScoringFactors): PriorityScoreResult {
  const { severityScore, reportsCount, ward, firstReportedAt } = factors;

  // 1. Base Severity (weight 45%)
  const clampedSeverity = Math.max(1, Math.min(100, severityScore));
  const severityContrib = clampedSeverity * 0.45;

  // 2. Recurrence / Collective Citizen Voice (weight 25%)
  let recurrenceScore = 20;
  if (reportsCount >= 10) recurrenceScore = 100;
  else if (reportsCount >= 7) recurrenceScore = 85;
  else if (reportsCount >= 4) recurrenceScore = 68;
  else if (reportsCount >= 2) recurrenceScore = 45;
  else recurrenceScore = 25;
  const recurrenceContrib = recurrenceScore * 0.25;

  // 3. Location / Ward Vulnerability (weight 15%)
  const locationScore = SENSITIVE_WARDS[ward] || 50;
  const locationContrib = locationScore * 0.15;

  // 4. Aging / SLA factor (weight 15%)
  const daysOld = Math.max(
    0,
    (Date.now() - new Date(firstReportedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  let agingScore = 20;
  if (daysOld >= 7) agingScore = 95;
  else if (daysOld >= 4) agingScore = 70;
  else if (daysOld >= 2) agingScore = 45;
  else if (daysOld >= 1) agingScore = 30;
  const agingContrib = agingScore * 0.15;

  // Total authoritative score [1 - 100]
  const rawTotal = severityContrib + recurrenceContrib + locationContrib + agingContrib;
  const numericScore = Math.round(Math.max(1, Math.min(100, rawTotal)));

  // Map to Priority Tier
  let tier: PriorityTier = 'P4_LOW';
  if (numericScore >= 80) {
    tier = 'P1_CRITICAL';
  } else if (numericScore >= 62) {
    tier = 'P2_HIGH';
  } else if (numericScore >= 40) {
    tier = 'P3_MEDIUM';
  } else {
    tier = 'P4_LOW';
  }

  const explanation = `Score ${numericScore}/100 [${tier}]: Derived from Severity (${Math.round(clampedSeverity)}/100, 45% wt), Recurrence (${reportsCount} reports, score ${recurrenceScore}, 25% wt), Location Sensitivity (${ward}, score ${locationScore}, 15% wt), and Aging (${daysOld.toFixed(1)} days elapsed, score ${agingScore}, 15% wt).`;

  return {
    numericScore,
    tier,
    factors: {
      baseSeverityContribution: Math.round(severityContrib),
      recurrenceContribution: Math.round(recurrenceContrib),
      locationContribution: Math.round(locationContrib),
      agingContribution: Math.round(agingContrib),
    },
    explanation,
  };
}

export function mapScoreToSeverityLevel(score: number): SeverityLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}
