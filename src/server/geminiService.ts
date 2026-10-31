import { GoogleGenAI, Type } from '@google/genai';
import {
  AIAgentLog,
  CivicCategory,
  ConsolidatedIssue,
  ListenerAgentOutput,
  PriorityAgentOutput,
  RecurrenceAgentOutput,
  Report,
  SeverityAgentOutput,
} from '../types/index.ts';

// Server-side initialization per @google/genai guidance
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export const agentLogs: AIAgentLog[] = [];

function recordLog(log: Omit<AIAgentLog, 'id' | 'timestamp'>) {
  const newLog: AIAgentLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  agentLogs.unshift(newLog);
  // Keep last 150 logs in memory
  if (agentLogs.length > 150) {
    agentLogs.pop();
  }
  return newLog;
}

// -------------------------------------------------------------
// 1. LISTENER AGENT
// Analyzes submitted reports and returns structured classifications,
// normalized problem descriptions, keywords, summaries, and confidence.
// -------------------------------------------------------------
export async function runListenerAgent(reportData: {
  rawTitle: string;
  rawDescription: string;
  category?: string;
  address: string;
  citizenUrgency?: string;
}): Promise<ListenerAgentOutput> {
  const startTime = Date.now();
  const ai = getGenAI();

  const prompt = `You are the Listener Agent in CivicLens, an AI municipal issue aggregation system.
A citizen has submitted a civic problem report.
Analyze the report text and extract standardized, objective, and structured municipal classification.

User Input:
- Raw Title: "${reportData.rawTitle}"
- Raw Description: "${reportData.rawDescription}"
- User-Selected Category: "${reportData.category || 'Unknown'}"
- Address/Location: "${reportData.address}"
- User-Stated Urgency: "${reportData.citizenUrgency || 'MEDIUM'}"

Guidelines:
1. Normalize the title to a professional, descriptive municipal work-order title (e.g., "Dangerous 8-inch Pothole near School Crosswalk").
2. Standardize the description into an objective, factual problem summary.
3. Classify into one of these exact categories:
   'Roads & Bridges', 'Sanitation & Solid Waste', 'Water & Drainage', 'Streetlights & Electrical', 'Public Safety & Hazards', 'Parks & Public Spaces', 'Traffic & Signage'.
4. Identify 3-6 searchable keywords.
5. Provide a 1-sentence executive summary for dispatchers.
6. Rate confidence score from 0.0 to 1.0.
7. Assess citizen sentiment (neutral, frustrated, urgent, constructive).
8. Detect specific hazard type (immediate_road_hazard, structural, hygiene_sanitation, electrical_fire, flooding, none).
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert municipal infrastructure intake auditor. Always output strictly valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              normalizedTitle: { type: Type.STRING },
              normalizedDescription: { type: Type.STRING },
              category: {
                type: Type.STRING,
                description: 'One of the exact 7 municipal civic categories',
              },
              urgencySelfStated: {
                type: Type.STRING,
                enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
              },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              summary: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              sentiment: {
                type: Type.STRING,
                enum: ['neutral', 'frustrated', 'urgent', 'constructive'],
              },
              hazardType: {
                type: Type.STRING,
                enum: [
                  'immediate_road_hazard',
                  'structural',
                  'hygiene_sanitation',
                  'electrical_fire',
                  'flooding',
                  'none',
                ],
              },
            },
            required: [
              'normalizedTitle',
              'normalizedDescription',
              'category',
              'keywords',
              'summary',
              'confidenceScore',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const output: ListenerAgentOutput = {
        normalizedTitle: parsed.normalizedTitle || reportData.rawTitle,
        normalizedDescription: parsed.normalizedDescription || reportData.rawDescription,
        category: (parsed.category as CivicCategory) || (reportData.category as CivicCategory) || 'Roads & Bridges',
        urgencySelfStated: (parsed.urgencySelfStated as any) || 'MEDIUM',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : ['civic-issue'],
        summary: parsed.summary || parsed.normalizedTitle,
        confidenceScore: parsed.confidenceScore ?? 0.92,
        sentiment: parsed.sentiment || 'frustrated',
        hazardType: parsed.hazardType || 'none',
      };

      recordLog({
        agentName: 'Listener Agent',
        model: 'gemini-3.8-flash',
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
        promptSummary: `Intake analysis for: "${reportData.rawTitle}"`,
        structuredResult: output,
        tokenEstimate: 420,
      });

      return output;
    } catch (err: any) {
      console.warn('Listener Agent Gemini error, falling back to heuristic:', err?.message);
    }
  }

  // Safe heuristic fallback if Gemini is offline or unkeyed
  const lower = (reportData.rawTitle + ' ' + reportData.rawDescription).toLowerCase();
  let detectedCategory: CivicCategory = (reportData.category as CivicCategory) || 'Roads & Bridges';
  let hazardType: ListenerAgentOutput['hazardType'] = 'none';

  if (lower.includes('water') || lower.includes('drain') || lower.includes('leak') || lower.includes('flood')) {
    detectedCategory = 'Water & Drainage';
    hazardType = 'flooding';
  } else if (lower.includes('trash') || lower.includes('garbage') || lower.includes('waste') || lower.includes('dump')) {
    detectedCategory = 'Sanitation & Solid Waste';
    hazardType = 'hygiene_sanitation';
  } else if (lower.includes('light') || lower.includes('lamp') || lower.includes('wire') || lower.includes('electric') || lower.includes('dark')) {
    detectedCategory = 'Streetlights & Electrical';
    hazardType = 'electrical_fire';
  } else if (lower.includes('pothole') || lower.includes('crack') || lower.includes('pavement') || lower.includes('asphalt') || lower.includes('road')) {
    detectedCategory = 'Roads & Bridges';
    hazardType = 'immediate_road_hazard';
  } else if (lower.includes('hazard') || lower.includes('danger') || lower.includes('collapse') || lower.includes('broken')) {
    detectedCategory = 'Public Safety & Hazards';
    hazardType = 'structural';
  }

  const fallbackOutput: ListenerAgentOutput = {
    normalizedTitle: reportData.rawTitle.trim().replace(/^./, (c) => c.toUpperCase()),
    normalizedDescription: reportData.rawDescription.trim(),
    category: detectedCategory,
    urgencySelfStated: (reportData.citizenUrgency as any) || 'MEDIUM',
    keywords: [detectedCategory.toLowerCase().split(' ')[0], 'civic-report', 'municipal-intake'],
    summary: `Citizen reported ${detectedCategory.toLowerCase()} issue at ${reportData.address}.`,
    confidenceScore: 0.86,
    sentiment: lower.includes('urgent') || lower.includes('dangerous') ? 'urgent' : 'frustrated',
    hazardType,
  };

  recordLog({
    agentName: 'Listener Agent',
    model: ai ? 'gemini-3.8-flash (fallback)' : 'gemini-heuristic-engine',
    status: 'FALLBACK',
    durationMs: Date.now() - startTime,
    promptSummary: `Fallback intake for: "${reportData.rawTitle}"`,
    structuredResult: fallbackOutput,
    tokenEstimate: 120,
  });

  return fallbackOutput;
}

// -------------------------------------------------------------
// 2. RECURRENCE AGENT
// Compares report against candidate consolidated issues and recommends
// matching existing issue, creating new issue, or requesting human review.
// -------------------------------------------------------------
export async function runRecurrenceAgent(
  report: {
    title: string;
    description: string;
    category: CivicCategory;
    address: string;
    ward: string;
    coordinates?: { lat: number; lng: number };
  },
  candidateIssues: ConsolidatedIssue[]
): Promise<RecurrenceAgentOutput> {
  const startTime = Date.now();
  const ai = getGenAI();

  // Filter candidates roughly by ward or category
  const filteredCandidates = candidateIssues.filter(
    (issue) =>
      issue.category === report.category ||
      issue.ward === report.ward ||
      candidateIssues.length <= 5
  ).slice(0, 5);

  if (filteredCandidates.length === 0) {
    const output: RecurrenceAgentOutput = {
      decision: 'CREATE_NEW',
      matchedIssueId: null,
      confidence: 0.95,
      reasoning: 'No existing consolidated issues found in this category or ward. Recommended to create a new issue.',
      similarityScore: 0.05,
    };
    recordLog({
      agentName: 'Recurrence Agent',
      model: 'gemini-heuristic-engine',
      status: 'SUCCESS',
      durationMs: Date.now() - startTime,
      promptSummary: `Candidate comparison (0 candidates) for: "${report.title}"`,
      structuredResult: output,
      tokenEstimate: 50,
    });
    return output;
  }

  const prompt = `You are the Recurrence Agent in CivicLens.
Determine whether a newly submitted citizen report is describing the EXACT same physical municipal defect or issue as one of the existing consolidated issues, or if it represents an independent new incident.

New Report:
- Title: "${report.title}"
- Description: "${report.description}"
- Category: "${report.category}"
- Address/Location: "${report.address}"
- Ward: "${report.ward}"

Existing Active Consolidated Issues (Candidates):
${filteredCandidates
  .map(
    (c, i) => `[Candidate ${i + 1}] ID: ${c.id}
  Title: "${c.title}"
  Summary: "${c.summary}"
  Category: "${c.category}"
  Location: "${c.address}" (${c.ward})
  Current Report Count: ${c.reportsCount}`
  )
  .join('\n\n')}

Instructions:
1. Compare physical location, spatial proximity, and defect descriptions.
2. If it is beyond reasonable doubt the SAME defect (e.g. same pothole on 5th Ave, same water pipe break, same garbage dump), choose "MATCH_EXISTING" and provide candidate ID.
3. If it is distinctly different or at a distant location, choose "CREATE_NEW".
4. If it is in the same vicinity or similar symptom but ambiguous (e.g., another streetlight on the same street, another leak nearby), choose "NEEDS_REVIEW" so municipal officers make the final call in the Review Queue.
5. Provide similarityScore between 0.0 and 1.0, and detailed reasoning.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert geospatial and text similarity deduplication agent for city infrastructure. Return strictly valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: {
                type: Type.STRING,
                enum: ['MATCH_EXISTING', 'CREATE_NEW', 'NEEDS_REVIEW'],
              },
              matchedIssueId: {
                type: Type.STRING,
                description: 'Issue ID if MATCH_EXISTING or suggested candidate for review, else null',
              },
              confidence: { type: Type.NUMBER },
              similarityScore: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
            },
            required: ['decision', 'confidence', 'similarityScore', 'reasoning'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const output: RecurrenceAgentOutput = {
        decision: parsed.decision || 'CREATE_NEW',
        matchedIssueId: parsed.matchedIssueId || null,
        confidence: parsed.confidence ?? 0.88,
        similarityScore: parsed.similarityScore ?? 0.5,
        reasoning: parsed.reasoning || 'AI evaluated candidate proximity and semantic description similarity.',
      };

      recordLog({
        agentName: 'Recurrence Agent',
        model: 'gemini-3.8-flash',
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
        promptSummary: `Evaluated ${filteredCandidates.length} candidate issues for report "${report.title}"`,
        structuredResult: output,
        tokenEstimate: 680,
      });

      return output;
    } catch (err: any) {
      console.warn('Recurrence Agent Gemini error, falling back to heuristic:', err?.message);
    }
  }

  // Heuristic similarity fallback
  let bestMatch: ConsolidatedIssue | null = null;
  let bestScore = 0;

  for (const candidate of filteredCandidates) {
    let score = 0;
    if (candidate.category === report.category) score += 0.35;
    if (candidate.ward === report.ward) score += 0.25;

    const repWords = new Set((report.title + ' ' + report.address).toLowerCase().split(/\s+/));
    const candWords = (candidate.title + ' ' + candidate.address).toLowerCase().split(/\s+/);
    let common = 0;
    for (const w of candWords) {
      if (w.length > 3 && repWords.has(w)) common++;
    }
    score += Math.min(0.4, common * 0.1);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  let decision: RecurrenceAgentOutput['decision'] = 'CREATE_NEW';
  let matchedId: string | null = null;
  let reasoning = 'No sufficiently close match found among existing issues.';

  if (bestScore >= 0.72 && bestMatch) {
    decision = 'MATCH_EXISTING';
    matchedId = bestMatch.id;
    reasoning = `High keyword, category, and location overlap with existing issue "${bestMatch.title}" (${bestMatch.id}).`;
  } else if (bestScore >= 0.48 && bestMatch) {
    decision = 'NEEDS_REVIEW';
    matchedId = bestMatch.id;
    reasoning = `Moderate proximity and topical overlap with issue "${bestMatch.title}" (${bestMatch.id}). Routed to municipal Review Queue for officer verification.`;
  }

  const fallbackOutput: RecurrenceAgentOutput = {
    decision,
    matchedIssueId: matchedId,
    confidence: 0.82,
    similarityScore: Math.round(bestScore * 100) / 100,
    reasoning,
  };

  recordLog({
    agentName: 'Recurrence Agent',
    model: ai ? 'gemini-3.8-flash (fallback)' : 'gemini-heuristic-engine',
    status: 'FALLBACK',
    durationMs: Date.now() - startTime,
    promptSummary: `Fallback recurrence check against ${filteredCandidates.length} candidates for "${report.title}"`,
    structuredResult: fallbackOutput,
    tokenEstimate: 210,
  });

  return fallbackOutput;
}

// -------------------------------------------------------------
// 3. SEVERITY AGENT
// Assesses potential seriousness of an issue using evidence from reports
// -------------------------------------------------------------
export async function runSeverityAgent(issueContext: {
  title: string;
  category: CivicCategory;
  description: string;
  address: string;
  ward: string;
  reportsCount: number;
  reportedHazards?: string[];
}): Promise<SeverityAgentOutput> {
  const startTime = Date.now();
  const ai = getGenAI();

  const prompt = `You are the Severity Agent in CivicLens.
Assess the physical severity, danger, and systemic risk of this municipal civic issue based on accumulated evidence.

Issue Information:
- Title: "${issueContext.title}"
- Category: "${issueContext.category}"
- Details: "${issueContext.description}"
- Location: "${issueContext.address}" (${issueContext.ward})
- Accumulated Citizen Reports: ${issueContext.reportsCount}
- Reported Hazard Indicators: ${issueContext.reportedHazards?.join(', ') || 'None noted'}

Evaluate:
1. Public Safety Risk (1 to 10): Risk of injury, accident, collision, fire, contamination.
2. Infrastructure Damage Risk (1 to 10): Risk of escalating structural or utility destruction.
3. Vulnerable Population Impact (true/false): Proximity or hazard to children, elderly, disabled, hospital patients, school routes.
4. Economic or Traffic Disruption (1 to 10): Transit blockage, business disruption.
5. Environmental Hazard (true/false): Sewage, chemical, water waste, hazardous runoff.
6. Overall Base Severity Score (1 to 100).
7. Severity Level: LOW, MEDIUM, HIGH, or CRITICAL.
8. 2-4 key bullet risks and concise justification.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a certified municipal risk management inspector. Output strictly valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severityLevel: {
                type: Type.STRING,
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              },
              publicSafetyRisk: { type: Type.INTEGER },
              infrastructureDamageRisk: { type: Type.INTEGER },
              vulnerablePopulationImpact: { type: Type.BOOLEAN },
              economicOrTrafficDisruption: { type: Type.INTEGER },
              environmentalHazard: { type: Type.BOOLEAN },
              severityScore: { type: Type.INTEGER },
              keyRisks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              justification: { type: Type.STRING },
            },
            required: [
              'severityLevel',
              'publicSafetyRisk',
              'infrastructureDamageRisk',
              'severityScore',
              'keyRisks',
              'justification',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const output: SeverityAgentOutput = {
        severityLevel: parsed.severityLevel || 'MEDIUM',
        publicSafetyRisk: parsed.publicSafetyRisk ?? 5,
        infrastructureDamageRisk: parsed.infrastructureDamageRisk ?? 5,
        vulnerablePopulationImpact: Boolean(parsed.vulnerablePopulationImpact),
        economicOrTrafficDisruption: parsed.economicOrTrafficDisruption ?? 4,
        environmentalHazard: Boolean(parsed.environmentalHazard),
        severityScore: Math.min(100, Math.max(1, parsed.severityScore ?? 50)),
        keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : ['General municipal maintenance defect'],
        justification: parsed.justification || 'Evaluated based on reported civic defect and potential impact.',
      };

      recordLog({
        agentName: 'Severity Agent',
        model: 'gemini-3.8-flash',
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
        promptSummary: `Severity evaluation for "${issueContext.title}" (reports: ${issueContext.reportsCount})`,
        structuredResult: output,
        tokenEstimate: 510,
      });

      return output;
    } catch (err: any) {
      console.warn('Severity Agent Gemini error, falling back to heuristic:', err?.message);
    }
  }

  // Heuristic fallback
  const text = (issueContext.title + ' ' + issueContext.description).toLowerCase();
  let baseScore = 45;
  let safety = 4;
  let infra = 4;
  let vuln = false;
  let env = false;

  if (text.includes('urgent') || text.includes('danger') || text.includes('accident') || text.includes('fire')) {
    baseScore += 30;
    safety += 4;
  }
  if (text.includes('school') || text.includes('hospital') || text.includes('child') || text.includes('elderly')) {
    baseScore += 15;
    vuln = true;
  }
  if (text.includes('sewage') || text.includes('waste') || text.includes('toxic') || text.includes('chemical') || text.includes('flood')) {
    baseScore += 20;
    env = true;
    infra += 3;
  }
  if (issueContext.reportsCount >= 5) {
    baseScore += 10;
  }

  const finalScore = Math.min(98, Math.max(15, baseScore));
  let level: SeverityAgentOutput['severityLevel'] = 'MEDIUM';
  if (finalScore >= 80) level = 'CRITICAL';
  else if (finalScore >= 60) level = 'HIGH';
  else if (finalScore < 35) level = 'LOW';

  const fallbackOutput: SeverityAgentOutput = {
    severityLevel: level,
    publicSafetyRisk: Math.min(10, safety),
    infrastructureDamageRisk: Math.min(10, infra),
    vulnerablePopulationImpact: vuln,
    economicOrTrafficDisruption: 5,
    environmentalHazard: env,
    severityScore: finalScore,
    keyRisks: [
      `${issueContext.category} deterioration`,
      vuln ? 'Impact on high-vulnerability zone' : 'Public convenience impact',
      safety > 6 ? 'Heightened vehicular/pedestrian hazard' : 'Routine municipal defect',
    ],
    justification: `Assessed as ${level} severity due to reported characteristics, defect type, and ${issueContext.reportsCount} citizen notice(s).`,
  };

  recordLog({
    agentName: 'Severity Agent',
    model: ai ? 'gemini-3.8-flash (fallback)' : 'gemini-heuristic-engine',
    status: 'FALLBACK',
    durationMs: Date.now() - startTime,
    promptSummary: `Fallback severity for "${issueContext.title}"`,
    structuredResult: fallbackOutput,
    tokenEstimate: 160,
  });

  return fallbackOutput;
}

// -------------------------------------------------------------
// 4. PRIORITY AGENT
// Provides qualitative priority recommendation, dispatch urgency, and explanation
// while the deterministic scoring formula calculates the numeric priority.
// -------------------------------------------------------------
export async function runPriorityAgent(
  issue: {
    title: string;
    category: CivicCategory;
    summary: string;
    ward: string;
    reportsCount: number;
    severityScore: number;
    severityLevel: string;
  },
  calculatedNumericScore: number
): Promise<PriorityAgentOutput> {
  const startTime = Date.now();
  const ai = getGenAI();

  const prompt = `You are the Priority Agent in CivicLens.
Given the calculated deterministic priority score of ${calculatedNumericScore}/100 and the severity assessment, formulate a municipal dispatch recommendation and departmental assignment.

Issue:
- Title: "${issue.title}"
- Category: "${issue.category}"
- Ward: "${issue.ward}"
- Reports Count: ${issue.reportsCount}
- Base Severity Score: ${issue.severityScore}/100 (${issue.severityLevel})
- Authoritative Priority Score: ${calculatedNumericScore}/100

Assign:
1. Priority Tier: P1_CRITICAL (Score >=80), P2_HIGH (Score 62-79), P3_MEDIUM (Score 40-61), P4_LOW (Score <40).
2. Recommended Action: e.g. "Dispatch emergency road repair crew with asphalt cold-patch trailer."
3. Dispatch Urgency: 'IMMEDIATE_2H' | 'WITHIN_24H' | 'WITHIN_72H' | 'SCHEDULED'.
4. Department: e.g., 'Department of Transportation & Roads', 'Water Supply & Sewerage Board', 'Waste Management & Sanitation', 'Public Lighting & Energy', 'Emergency Infrastructure Services'.
5. Concise explanation for city triage officers.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an authoritative city operations dispatcher. Output strictly valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priorityTier: {
                type: Type.STRING,
                enum: ['P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW'],
              },
              recommendedAction: { type: Type.STRING },
              dispatchUrgency: {
                type: Type.STRING,
                enum: ['IMMEDIATE_2H', 'WITHIN_24H', 'WITHIN_72H', 'SCHEDULED'],
              },
              explanation: { type: Type.STRING },
              suggestedDepartment: { type: Type.STRING },
            },
            required: [
              'priorityTier',
              'recommendedAction',
              'dispatchUrgency',
              'explanation',
              'suggestedDepartment',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const output: PriorityAgentOutput = {
        priorityTier: parsed.priorityTier || (calculatedNumericScore >= 80 ? 'P1_CRITICAL' : calculatedNumericScore >= 62 ? 'P2_HIGH' : calculatedNumericScore >= 40 ? 'P3_MEDIUM' : 'P4_LOW'),
        recommendedAction: parsed.recommendedAction || 'Schedule operational work crew for site inspection and remediation.',
        dispatchUrgency: parsed.dispatchUrgency || (calculatedNumericScore >= 80 ? 'IMMEDIATE_2H' : calculatedNumericScore >= 62 ? 'WITHIN_24H' : 'WITHIN_72H'),
        explanation: parsed.explanation || `Priority determined by combined score of ${calculatedNumericScore}/100.`,
        suggestedDepartment: parsed.suggestedDepartment || getDefaultDepartment(issue.category),
      };

      recordLog({
        agentName: 'Priority Agent',
        model: 'gemini-3.8-flash',
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
        promptSummary: `Priority dispatch recommendation for "${issue.title}" (Score: ${calculatedNumericScore})`,
        structuredResult: output,
        tokenEstimate: 450,
      });

      return output;
    } catch (err: any) {
      console.warn('Priority Agent Gemini error, falling back to heuristic:', err?.message);
    }
  }

  // Heuristic fallback
  let tier: PriorityAgentOutput['priorityTier'] = 'P4_LOW';
  let urgency: PriorityAgentOutput['dispatchUrgency'] = 'SCHEDULED';
  if (calculatedNumericScore >= 80) {
    tier = 'P1_CRITICAL';
    urgency = 'IMMEDIATE_2H';
  } else if (calculatedNumericScore >= 62) {
    tier = 'P2_HIGH';
    urgency = 'WITHIN_24H';
  } else if (calculatedNumericScore >= 40) {
    tier = 'P3_MEDIUM';
    urgency = 'WITHIN_72H';
  }

  const dept = getDefaultDepartment(issue.category);
  const fallbackOutput: PriorityAgentOutput = {
    priorityTier: tier,
    recommendedAction:
      tier === 'P1_CRITICAL'
        ? 'Deploy rapid-response municipal crew for emergency hazard containment.'
        : tier === 'P2_HIGH'
        ? 'Queue priority work order for next shift dispatch within 24 hours.'
        : 'Assign standard work ticket to field maintenance queue.',
    dispatchUrgency: urgency,
    explanation: `Authoritative score ${calculatedNumericScore}/100 triggers ${tier} classification. Immediate notification routed to ${dept}.`,
    suggestedDepartment: dept,
  };

  recordLog({
    agentName: 'Priority Agent',
    model: ai ? 'gemini-3.8-flash (fallback)' : 'gemini-heuristic-engine',
    status: 'FALLBACK',
    durationMs: Date.now() - startTime,
    promptSummary: `Fallback priority assignment for "${issue.title}" (Score: ${calculatedNumericScore})`,
    structuredResult: fallbackOutput,
    tokenEstimate: 140,
  });

  return fallbackOutput;
}

export function getDefaultDepartment(category: CivicCategory): string {
  switch (category) {
    case 'Roads & Bridges':
      return 'Department of Transportation & Roads';
    case 'Sanitation & Solid Waste':
      return 'Waste Management & Sanitation';
    case 'Water & Drainage':
      return 'Water Supply & Sewerage Board';
    case 'Streetlights & Electrical':
      return 'Public Lighting & Energy Grid';
    case 'Public Safety & Hazards':
      return 'Emergency Infrastructure Services';
    case 'Parks & Public Spaces':
      return 'Parks & Recreation Department';
    case 'Traffic & Signage':
      return 'Traffic Management Bureau';
    default:
      return 'Municipal Public Works';
  }
}
