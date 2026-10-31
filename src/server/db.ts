import {
  CivicCategory,
  ConsolidatedIssue,
  DashboardStats,
  Notification,
  Report,
  ReviewQueueItem,
  User,
} from '../types/index.ts';
import {
  runListenerAgent,
  runRecurrenceAgent,
  runSeverityAgent,
  runPriorityAgent,
  getDefaultDepartment,
} from './geminiService.ts';
import { calculateDeterministicPriority } from './scoringEngine.ts';

// In-Memory Database with Transaction-like integrity
class CivicDatabase {
  public users: User[] = [];
  public reports: Report[] = [];
  public issues: ConsolidatedIssue[] = [];
  public reviewQueue: ReviewQueueItem[] = [];
  public notifications: Notification[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.users = [
      {
        id: 'usr-citizen-1',
        name: 'Vandita Goel',
        email: 'vandita@example.org',
        role: 'CITIZEN',
        ward: 'Ward 4 (Government Hospital & Alpha Road)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr-admin-1',
        name: 'Municipal Commissioner Rajesh Sharma',
        email: 'commissioner@gnida.gov.in',
        role: 'ADMIN',
        ward: 'Ward 1 (Pari Chowk & Authority Office)',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      },
    ];

    const now = new Date();
    const isoHoursAgo = (hours: number) =>
      new Date(now.getTime() - hours * 3600 * 1000).toISOString();

    // 1. Critical Water & Drainage Issue (5 merged reports)
    const issue1: ConsolidatedIssue = {
      id: 'ISS-101',
      title: 'Burst Water Pipeline Flooding Road Near Government Hospital',
      category: 'Water & Drainage',
      description:
        'An underground drinking-water pipeline has burst near the Government Hospital on Alpha Road, flooding the carriageway and making ambulance access difficult. The water is washing away soil beneath the road surface.',
      summary: 'Burst municipal water pipeline near Government Hospital, disrupting ambulance access.',
      address: 'Alpha Road, opposite Government Hospital, Greater Noida',
      ward: 'Ward 4 (Government Hospital & Alpha Road)',
      coordinates: { lat: 28.4744, lng: 77.5030 },
      status: 'IN_PROGRESS',
      priorityTier: 'P1_CRITICAL',
      priorityScore: 94,
      severityScore: 91,
      severityLevel: 'CRITICAL',
      assignedDepartment: 'Greater Noida Authority - Water Supply Department',
      reportsCount: 5,
      reportIds: ['REP-201', 'REP-202', 'REP-203', 'REP-204', 'REP-205'],
      agentOutputs: {
        listenerSummary:
          'Residents report road flooding and water gushing from a broken pipeline outside Government Hospital.',
        severityAssessment: {
          severityLevel: 'CRITICAL',
          publicSafetyRisk: 9,
          infrastructureDamageRisk: 9,
          vulnerablePopulationImpact: true,
          economicOrTrafficDisruption: 9,
          environmentalHazard: true,
          severityScore: 91,
          keyRisks: [
            'Ambulance delays at the Government Hospital entrance',
            'Risk of road subsidence due to soil erosion',
            'Large-scale loss of treated municipal water',
          ],
          justification:
            'Critical emergency due to direct interference with hospital ambulance transit and rapid sub-base erosion.',
        },
        priorityAssessment: {
          priorityTier: 'P1_CRITICAL',
          recommendedAction:
            'Isolate the damaged pipeline, arrange water tankers if needed, and divert traffic away from the flooded stretch.',
          dispatchUrgency: 'IMMEDIATE_2H',
          explanation:
            'Priority score 94/100 warrants immediate repair-team deployment and traffic management.',
          suggestedDepartment: 'Greater Noida Authority - Water Supply Department',
        },
        lastUpdated: isoHoursAgo(2),
      },
      recurrenceVelocity: 3.2,
      firstReportedAt: isoHoursAgo(38),
      lastReportedAt: isoHoursAgo(2),
      estimatedResolutionDays: 1,
      timeline: [
        {
          id: 'act-1',
          timestamp: isoHoursAgo(38),
          actor: 'Listener & Recurrence Agents',
          action: 'Initial Intake',
          details: 'Issue created from first citizen report REP-201.',
          type: 'CREATION',
        },
        {
          id: 'act-2',
          timestamp: isoHoursAgo(22),
          actor: 'Recurrence Agent',
          action: 'Automated Report Aggregation',
          details: 'Merged 3 identical geotagged reports. Recurrence multiplier elevated priority score to 88.',
          type: 'MERGE',
        },
        {
          id: 'act-3',
          timestamp: isoHoursAgo(6),
          actor: 'Priority Agent',
          action: 'Escalation to P1 Critical',
          details: 'Additional report cited ambulance blockage. Priority escalated to 94.',
          type: 'AI_REASSESSMENT',
        },
        {
          id: 'act-4',
          timestamp: isoHoursAgo(3),
          actor: 'Municipal Commissioner Rajesh Sharma',
          action: 'Work Crew Dispatched',
          details: 'The Authority\'s water supply repair team has been sent to the site.',
          type: 'DISPATCH',
        },
      ],
      comments: [
        {
          id: 'com-1',
          author: 'Water Supply Supervisor Amit Verma',
          role: 'ADMIN',
          text: 'The nearby valve has been closed and a temporary supply arrangement is being checked to minimise disruption to hospital water supply.',
          timestamp: isoHoursAgo(2),
          isInternal: true,
        },
      ],
    };

    // 2. High Priority Pothole Cluster (3 merged reports)
    const issue2: ConsolidatedIssue = {
      id: 'ISS-102',
      title: 'Deep Potholes on Jagat Farm Market Road',
      category: 'Roads & Bridges',
      description:
        'Three deep potholes have formed on the road beside Jagat Farm market, forcing two-wheelers and cars to swerve into traffic. Residents report tyre damage and congestion, especially during peak hours and after rain.',
      summary: 'Potholes near Jagat Farm market are damaging tyres and slowing traffic.',
      address: 'Jagat Farm Market Road, near the main entrance, Greater Noida',
      ward: 'Ward 2 (Jagat Farm Market & Schools)',
      coordinates: { lat: 28.4758, lng: 77.5045 },
      status: 'ASSIGNED',
      priorityTier: 'P2_HIGH',
      priorityScore: 78,
      severityScore: 72,
      severityLevel: 'HIGH',
      assignedDepartment: 'Greater Noida Authority - Civil & Road Maintenance Department',
      reportsCount: 4,
      reportIds: ['REP-206', 'REP-207', 'REP-208', 'REP-209'],
      agentOutputs: {
        listenerSummary: 'Residents report damaged tyres and two-wheeler riders swerving to avoid potholes.',
        severityAssessment: {
          severityLevel: 'HIGH',
          publicSafetyRisk: 8,
          infrastructureDamageRisk: 6,
          vulnerablePopulationImpact: true,
          economicOrTrafficDisruption: 7,
          environmentalHazard: false,
          severityScore: 72,
          keyRisks: [
            'Risk of two-wheeler crashes',
            'Tyre, wheel-rim and suspension damage',
            'Traffic congestion near the market during evening peak hours',
          ],
          justification: 'Located in school zone arterial, posing immediate hazard to smaller vehicles.',
        },
        priorityAssessment: {
          priorityTier: 'P2_HIGH',
          recommendedAction: 'Send a road-repair team to fill the potholes and place warning barricades as soon as possible.',
          dispatchUrgency: 'WITHIN_24H',
          explanation: 'High priority assigned due to multiple reports, vehicle damage and heavy market traffic.',
          suggestedDepartment: 'Greater Noida Authority - Civil & Road Maintenance Department',
        },
        lastUpdated: isoHoursAgo(8),
      },
      recurrenceVelocity: 1.8,
      firstReportedAt: isoHoursAgo(48),
      lastReportedAt: isoHoursAgo(8),
      estimatedResolutionDays: 2,
      timeline: [
        {
          id: 'act-21',
          timestamp: isoHoursAgo(48),
          actor: 'Listener Agent',
          action: 'Issue Created',
          details: 'Initial report filed by commuter.',
          type: 'CREATION',
        },
        {
          id: 'act-22',
          timestamp: isoHoursAgo(16),
          actor: 'Recurrence Agent',
          action: 'Merged 3 Reports',
          details: 'Photos verified identical defect cluster.',
          type: 'MERGE',
        },
      ],
      comments: [],
    };

    // 3. Medium Priority Streetlight failure
    const issue3: ConsolidatedIssue = {
      id: 'ISS-103',
      title: 'Streetlights Not Working Along Alpha-1 Residential Road',
      category: 'Streetlights & Electrical',
      description:
        'Four consecutive streetlights are not working along a residential road in Alpha-1, leaving the footpath and nearby bus-stop approach poorly lit after sunset.',
      summary: 'Four streetlights are out along an Alpha-1 residential road.',
      address: 'Alpha-1 Sector Road, near the local market, Greater Noida',
      ward: 'Ward 7 (Alpha-1 Residential Sector)',
      coordinates: { lat: 28.4685, lng: 77.5060 },
      status: 'TRIAGED',
      priorityTier: 'P3_MEDIUM',
      priorityScore: 54,
      severityScore: 48,
      severityLevel: 'MEDIUM',
      assignedDepartment: 'Greater Noida Authority - Electrical & Street Lighting Department',
      reportsCount: 2,
      reportIds: ['REP-210', 'REP-211'],
      agentOutputs: {
        listenerSummary: 'Residents are concerned about walking near the dark footpath and bus stop after sunset.',
        severityAssessment: {
          severityLevel: 'MEDIUM',
          publicSafetyRisk: 5,
          infrastructureDamageRisk: 3,
          vulnerablePopulationImpact: false,
          economicOrTrafficDisruption: 2,
          environmentalHazard: false,
          severityScore: 48,
          keyRisks: ['Pedestrians may trip on the poorly lit footpath', 'Residents feel unsafe walking along the unlit road'],
          justification: 'Non-emergency residential outage requiring scheduled luminaire or circuit breaker service.',
        },
        priorityAssessment: {
          priorityTier: 'P3_MEDIUM',
          recommendedAction: 'Inspect the streetlight circuit and replace faulty lamps or wiring.',
          dispatchUrgency: 'WITHIN_72H',
          explanation: 'Routine maintenance is suitable unless the outage is linked to exposed wiring or another immediate hazard.',
          suggestedDepartment: 'Greater Noida Authority - Electrical & Street Lighting Department',
        },
        lastUpdated: isoHoursAgo(14),
      },
      recurrenceVelocity: 0.8,
      firstReportedAt: isoHoursAgo(32),
      lastReportedAt: isoHoursAgo(14),
      estimatedResolutionDays: 3,
      timeline: [],
      comments: [],
    };

    // 4. Low Priority Graffiti / Park Bench Maintenance
    const issue4: ConsolidatedIssue = {
      id: 'ISS-104',
      title: 'Broken Park Benches and Overgrown Grass at City Park',
      category: 'Parks & Public Spaces',
      description:
        'Two benches near the children\'s play area have broken wooden slats, and grass along the walking path needs trimming. Residents have also reported graffiti on a boundary wall.',
      summary: 'Routine maintenance needed for benches, grass and the boundary wall at City Park.',
      address: 'City Park, near the children\'s play area, Greater Noida',
      ward: 'Ward 3 (City Park & Beta Sectors)',
      coordinates: { lat: 28.4780, lng: 77.4920 },
      status: 'ASSIGNED',
      priorityTier: 'P4_LOW',
      priorityScore: 32,
      severityScore: 28,
      severityLevel: 'LOW',
      assignedDepartment: 'Greater Noida Authority - Horticulture Department',
      reportsCount: 1,
      reportIds: ['REP-212'],
      agentOutputs: {
        listenerSummary: 'Residents request repairs to park benches and routine landscaping.',
        severityAssessment: {
          severityLevel: 'LOW',
          publicSafetyRisk: 2,
          infrastructureDamageRisk: 2,
          vulnerablePopulationImpact: false,
          economicOrTrafficDisruption: 1,
          environmentalHazard: false,
          severityScore: 28,
          keyRisks: ['Risk of splinters from broken bench slats', 'Graffiti and untidy public space'],
          justification: 'No structural failure or imminent hazard.',
        },
        priorityAssessment: {
          priorityTier: 'P4_LOW',
          recommendedAction: 'Schedule bench repairs, repainting and grass trimming in the next park-maintenance round.',
          dispatchUrgency: 'SCHEDULED',
          explanation: 'Low severity and single report.',
          suggestedDepartment: 'Greater Noida Authority - Horticulture Department',
        },
        lastUpdated: isoHoursAgo(50),
      },
      recurrenceVelocity: 0.2,
      firstReportedAt: isoHoursAgo(50),
      lastReportedAt: isoHoursAgo(50),
      estimatedResolutionDays: 5,
      timeline: [],
      comments: [],
    };

    // 5. Resolved Issue
    const issue5: ConsolidatedIssue = {
      id: 'ISS-105',
      title: 'Fallen Tree Branch Blocking Road Near Pari Chowk',
      category: 'Public Safety & Hazards',
      description:
        'A large tree branch fell during strong winds and is blocking one lane near Pari Chowk, causing vehicles to merge suddenly.',
      summary: 'Fallen branch cleared and the road swept by the municipal response team.',
      address: 'Road near Pari Chowk roundabout, Greater Noida',
      ward: 'Ward 1 (Pari Chowk & Authority Office)',
      coordinates: { lat: 28.4720, lng: 77.5000 },
      status: 'RESOLVED',
      priorityTier: 'P2_HIGH',
      priorityScore: 68,
      severityScore: 65,
      severityLevel: 'HIGH',
      assignedDepartment: 'Greater Noida Authority - Horticulture & Road Maintenance Teams',
      reportsCount: 3,
      reportIds: ['REP-213', 'REP-214', 'REP-215'],
      agentOutputs: {
        listenerSummary: 'Residents reported a fallen branch obstructing traffic after strong winds.',
        severityAssessment: {
          severityLevel: 'HIGH',
          publicSafetyRisk: 7,
          infrastructureDamageRisk: 4,
          vulnerablePopulationImpact: false,
          economicOrTrafficDisruption: 8,
          environmentalHazard: false,
          severityScore: 65,
          keyRisks: ['Vehicular obstruction', 'Collision in blind turn'],
          justification: 'Arterial lane obstruction.',
        },
        priorityAssessment: {
          priorityTier: 'P2_HIGH',
          recommendedAction: 'Remove the branch safely, inspect the tree and clear the carriageway.',
          dispatchUrgency: 'WITHIN_24H',
          explanation: 'The horticulture team cleared the branch and reopened the lane.',
          suggestedDepartment: 'Greater Noida Authority - Horticulture & Road Maintenance Teams',
        },
        lastUpdated: isoHoursAgo(12),
      },
      recurrenceVelocity: 1.5,
      firstReportedAt: isoHoursAgo(24),
      lastReportedAt: isoHoursAgo(18),
      estimatedResolutionDays: 0,
      timeline: [
        {
          id: 'act-30',
          timestamp: isoHoursAgo(12),
          actor: 'Road Maintenance Supervisor Suresh Yadav',
          action: 'Road Cleared & Swept',
          details: 'The fallen branch was removed and traffic flow restored.',
          type: 'STATUS_CHANGE',
        },
      ],
      comments: [],
    };

    this.issues = [issue1, issue2, issue3, issue4, issue5];

    // Seed Reports linked to these issues
    this.reports = [
      {
        id: 'REP-201',
        citizenId: 'usr-citizen-1',
        citizenName: 'Vandita Goel',
        citizenEmail: 'vandita@example.org',
        title: 'Water gushing from a broken pipeline outside Government Hospital',
        description:
          'Water is gushing from a crack in the road on Alpha Road near Government Hospital. Vehicles are turning around and an ambulance had to slow down to pass.',
        category: 'Water & Drainage',
        address: 'Alpha Road, near Government Hospital, Greater Noida',
        ward: 'Ward 4 (Government Hospital & Alpha Road)',
        coordinates: { lat: 28.4744, lng: 77.5030 },
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
        citizenUrgency: 'EMERGENCY',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(38),
        updatedAt: isoHoursAgo(38),
      },
      {
        id: 'REP-202',
        citizenId: 'usr-cit-2',
        citizenName: 'Rohit Kumar',
        citizenEmail: 'rohit.kumar@example.org',
        title: 'Road flooded outside Government Hospital on Alpha Road',
        description: 'The road is covered with several centimetres of flowing water. It looks like a municipal water pipeline has burst.',
        category: 'Water & Drainage',
        address: 'Alpha Road near Government Hospital, Greater Noida',
        ward: 'Ward 4 (Government Hospital & Alpha Road)',
        coordinates: { lat: 28.4746, lng: 77.5032 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(32),
        updatedAt: isoHoursAgo(32),
      },
      {
        id: 'REP-203',
        citizenId: 'usr-cit-3',
        citizenName: 'Priya Singh',
        citizenEmail: 'priya.singh@example.com',
        title: 'Broken pipeline washing away soil beside hospital footpath',
        description: 'Water is washing away soil beside the footpath, making the edge unstable for pedestrians.',
        category: 'Water & Drainage',
        address: 'Alpha Road and Hospital Road junction, Greater Noida',
        ward: 'Ward 4 (Government Hospital & Alpha Road)',
        coordinates: { lat: 28.4742, lng: 77.5028 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(22),
        updatedAt: isoHoursAgo(22),
      },
      {
        id: 'REP-204',
        citizenId: 'usr-cit-4',
        citizenName: 'Traffic Police Officer Anil Kumar',
        citizenEmail: 'anil.kumar@example.org',
        title: 'Pipeline burst near hospital - traffic diversion needed',
        description: 'Traffic is backing up near the hospital entrance. The road surface may weaken if heavy vehicles continue passing.',
        category: 'Water & Drainage',
        address: '740 Alpha Road',
        ward: 'Ward 4 (Government Hospital & Alpha Road)',
        coordinates: { lat: 28.4744, lng: 77.5030 },
        citizenUrgency: 'EMERGENCY',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(10),
        updatedAt: isoHoursAgo(10),
      },
      {
        id: 'REP-205',
        citizenId: 'usr-citizen-1',
        citizenName: 'Vandita Goel',
        citizenEmail: 'vandita@example.org',
        title: 'Water is still leaking outside Government Hospital',
        description: 'Follow-up: a repair team arrived, but water is still flowing onto the road.',
        category: 'Water & Drainage',
        address: '740 Alpha Road',
        ward: 'Ward 4 (Government Hospital & Alpha Road)',
        coordinates: { lat: 28.4744, lng: 77.5030 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(2),
        updatedAt: isoHoursAgo(2),
      },
      {
        id: 'REP-206',
        citizenId: 'usr-cit-5',
        citizenName: 'Neha Gupta',
        citizenEmail: 'neha.gupta@example.net',
        title: 'Deep pothole damaged my scooter tyre near Jagat Farm',
        description: 'Right on Jagat Farm Market Road. You cannot see it when turning in the shadows.',
        category: 'Roads & Bridges',
        address: 'Jagat Farm Market Road, Greater Noida',
        ward: 'Ward 2 (Jagat Farm Market & Schools)',
        coordinates: { lat: 28.4758, lng: 77.5045 },
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-102',
        createdAt: isoHoursAgo(48),
        updatedAt: isoHoursAgo(48),
      },
      {
        id: 'REP-207',
        citizenId: 'usr-cit-6',
        citizenName: 'Amit Sharma',
        citizenEmail: 'amit.sharma@example.com',
        title: 'Deep crater on Jagat Farm market road',
        description: 'I nearly fell off my scooter while swerving around the pothole. The road surface has broken away.',
        category: 'Roads & Bridges',
        address: 'Jagat Farm Road near the market entrance',
        ward: 'Ward 2 (Jagat Farm Market & Schools)',
        coordinates: { lat: 28.4759, lng: 77.5047 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-102',
        createdAt: isoHoursAgo(36),
        updatedAt: isoHoursAgo(36),
      },
    ];

    // Seed Review Queue item (ambiguous match flagged by Recurrence Agent for human verification)
    const pendingReport: Report = {
      id: 'REP-301',
      citizenId: 'usr-cit-7',
      citizenName: 'Kavita Mishra',
      citizenEmail: 'kavita.mishra@example.com',
      title: 'Dirty water collecting around a blocked drain in Beta-2',
      description:
        'Dirty water has been collecting around the roadside drain in Beta-2 for several days. It may be a blocked drain or a damaged sewer line; the source needs inspection.',
      category: 'Water & Drainage',
      address: 'Beta-2 Sector Road, near the community market, Greater Noida',
      ward: 'Ward 4 (Government Hospital & Alpha Road)',
      coordinates: { lat: 28.4770, lng: 77.4985 },
      citizenUrgency: 'MEDIUM',
      status: 'UNDER_REVIEW',
      createdAt: isoHoursAgo(4),
      updatedAt: isoHoursAgo(4),
    };
    this.reports.push(pendingReport);

    this.reviewQueue = [
      {
        id: 'REV-501',
        reportId: pendingReport.id,
        report: pendingReport,
        candidateIssueId: 'ISS-101',
        candidateIssue: issue1,
        recurrenceConfidence: 0.58,
        recurrenceReasoning:
          'The Recurrence Agent detected standing water near the reported pipeline burst. It may be connected to the same water leak, or it may be a separate blocked drain that needs inspection.',
        status: 'PENDING',
        createdAt: isoHoursAgo(4),
      },
    ];

    // Seed notifications for citizen
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'usr-citizen-1',
        reportId: 'REP-201',
        issueId: 'ISS-101',
        title: 'Municipal Repair Team Dispatched',
        message: 'Your report REP-201 was consolidated into Critical Issue ISS-101. The municipal water-supply repair team is currently at the reported location.',
        type: 'ADMIN_ACTION',
        isRead: false,
        createdAt: isoHoursAgo(3),
      },
      {
        id: 'notif-2',
        userId: 'usr-citizen-1',
        reportId: 'REP-205',
        issueId: 'ISS-101',
        title: 'Report Merged & Priority Recalculated',
        message: 'Your follow-up report was grouped with similar complaints, increasing the issue\'s priority score to 94.',
        type: 'MERGED',
        isRead: false,
        createdAt: isoHoursAgo(2),
      },
    ];
  }
  // Orchestrate the 4 AI Agents on incoming report
  public async submitReport(reportInput: {
    citizenId: string;
    citizenName: string;
    citizenEmail: string;
    title: string;
    description: string;
    category?: string;
    address: string;
    ward: string;
    coordinates?: { lat: number; lng: number };
    photoUrl?: string;
    citizenUrgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  }): Promise<{
    report: Report;
    actionTaken: 'MERGED_TO_EXISTING' | 'CREATED_NEW_ISSUE' | 'QUEUED_FOR_HUMAN_REVIEW';
    consolidatedIssue?: ConsolidatedIssue;
    reviewQueueItem?: ReviewQueueItem;
  }> {
    const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    // STEP 1: Listener Agent
    const listenerOutput = await runListenerAgent({
      rawTitle: reportInput.title,
      rawDescription: reportInput.description,
      category: reportInput.category,
      address: reportInput.address,
      citizenUrgency: reportInput.citizenUrgency,
    });

    const report: Report = {
      id: reportId,
      citizenId: reportInput.citizenId || 'usr-citizen-1',
      citizenName: reportInput.citizenName || 'Citizen Contributor',
      citizenEmail: reportInput.citizenEmail || 'citizen@civiclens.gov',
      title: listenerOutput.normalizedTitle,
      description: listenerOutput.normalizedDescription,
      category: listenerOutput.category,
      address: reportInput.address,
      ward: reportInput.ward,
      coordinates: reportInput.coordinates || { lat: 37.7749, lng: -122.4194 },
      photoUrl: reportInput.photoUrl,
      citizenUrgency: listenerOutput.urgencySelfStated,
      status: 'PENDING_ANALYSIS',
      listenerOutput,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // STEP 2: Recurrence Agent
    const activeCandidates = this.issues.filter(
      (iss) => iss.status !== 'RESOLVED' && iss.status !== 'CLOSED'
    );

    const recurrenceOutput = await runRecurrenceAgent(
      {
        title: report.title,
        description: report.description,
        category: report.category,
        address: report.address,
        ward: report.ward,
        coordinates: report.coordinates,
      },
      activeCandidates
    );

    report.recurrenceOutput = recurrenceOutput;

    // STEP 3 & 4: Aggregation Decision
    if (recurrenceOutput.decision === 'MATCH_EXISTING' && recurrenceOutput.matchedIssueId) {
      // Find candidate issue and merge
      const targetIssue = this.issues.find((i) => i.id === recurrenceOutput.matchedIssueId);
      if (targetIssue) {
        report.status = 'ASSOCIATED';
        report.consolidatedIssueId = targetIssue.id;
        this.reports.unshift(report);

        // Update target issue
        targetIssue.reportsCount += 1;
        targetIssue.reportIds.push(report.id);
        targetIssue.lastReportedAt = nowIso;

        // Re-run Severity Agent with new cumulative evidence
        const severityOutput = await runSeverityAgent({
          title: targetIssue.title,
          category: targetIssue.category,
          description: targetIssue.description,
          address: targetIssue.address,
          ward: targetIssue.ward,
          reportsCount: targetIssue.reportsCount,
          reportedHazards: [listenerOutput.hazardType],
        });

        // Deterministic Priority Score calculation
        const scoring = calculateDeterministicPriority({
          severityScore: severityOutput.severityScore,
          reportsCount: targetIssue.reportsCount,
          ward: targetIssue.ward,
          category: targetIssue.category,
          firstReportedAt: targetIssue.firstReportedAt,
        });

        // Re-run Priority Agent
        const priorityOutput = await runPriorityAgent(
          {
            title: targetIssue.title,
            category: targetIssue.category,
            summary: targetIssue.summary,
            ward: targetIssue.ward,
            reportsCount: targetIssue.reportsCount,
            severityScore: severityOutput.severityScore,
            severityLevel: severityOutput.severityLevel,
          },
          scoring.numericScore
        );

        targetIssue.severityScore = severityOutput.severityScore;
        targetIssue.severityLevel = severityOutput.severityLevel;
        targetIssue.priorityScore = scoring.numericScore;
        targetIssue.priorityTier = scoring.tier;
        targetIssue.agentOutputs = {
          listenerSummary: `Aggregated ${targetIssue.reportsCount} citizen complaints on this defect.`,
          severityAssessment: severityOutput,
          priorityAssessment: priorityOutput,
          lastUpdated: nowIso,
        };

        targetIssue.timeline.unshift({
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          actor: 'Recurrence Agent',
          action: 'Citizen Report Merged',
          details: `Report ${report.id} automatically merged with similarity ${Math.round(recurrenceOutput.similarityScore * 100)}%. Priority recalculated to ${scoring.numericScore}/100.`,
          type: 'MERGE',
        });

        this.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: report.citizenId,
          reportId: report.id,
          issueId: targetIssue.id,
          title: 'Report Aggregated with Active Issue',
          message: `Your report was linked to ${targetIssue.title} (${targetIssue.id}). Priority elevated to ${targetIssue.priorityTier}.`,
          type: 'MERGED',
          isRead: false,
          createdAt: nowIso,
        });

        return {
          report,
          actionTaken: 'MERGED_TO_EXISTING',
          consolidatedIssue: targetIssue,
        };
      }
    }

    if (recurrenceOutput.decision === 'NEEDS_REVIEW' && recurrenceOutput.matchedIssueId) {
      const candidate = this.issues.find((i) => i.id === recurrenceOutput.matchedIssueId);
      if (candidate) {
        report.status = 'UNDER_REVIEW';
        this.reports.unshift(report);

        const reviewItem: ReviewQueueItem = {
          id: `REV-${Math.floor(100 + Math.random() * 900)}`,
          reportId: report.id,
          report,
          candidateIssueId: candidate.id,
          candidateIssue: candidate,
          recurrenceConfidence: recurrenceOutput.confidence,
          recurrenceReasoning: recurrenceOutput.reasoning,
          status: 'PENDING',
          createdAt: nowIso,
        };
        this.reviewQueue.unshift(reviewItem);

        this.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: report.citizenId,
          reportId: report.id,
          title: 'Report Under Administrative Triage',
          message:
            'Your report is in the municipal review queue for spatial deduplication verification.',
          type: 'STATUS_UPDATE',
          isRead: false,
          createdAt: nowIso,
        });

        return {
          report,
          actionTaken: 'QUEUED_FOR_HUMAN_REVIEW',
          reviewQueueItem: reviewItem,
          consolidatedIssue: candidate,
        };
      }
    }

    // Default: CREATE_NEW Consolidated Issue
    const newIssueId = `ISS-${Math.floor(100 + Math.random() * 900)}`;

    // Run Severity Agent for new issue
    const severityOutput = await runSeverityAgent({
      title: report.title,
      category: report.category,
      description: report.description,
      address: report.address,
      ward: report.ward,
      reportsCount: 1,
      reportedHazards: [listenerOutput.hazardType],
    });

    // Run Deterministic Priority Score calculation
    const scoring = calculateDeterministicPriority({
      severityScore: severityOutput.severityScore,
      reportsCount: 1,
      ward: report.ward,
      category: report.category,
      firstReportedAt: nowIso,
    });

    // Run Priority Agent
    const priorityOutput = await runPriorityAgent(
      {
        title: report.title,
        category: report.category,
        summary: listenerOutput.summary,
        ward: report.ward,
        reportsCount: 1,
        severityScore: severityOutput.severityScore,
        severityLevel: severityOutput.severityLevel,
      },
      scoring.numericScore
    );

    const newIssue: ConsolidatedIssue = {
      id: newIssueId,
      title: listenerOutput.normalizedTitle,
      category: listenerOutput.category,
      description: listenerOutput.normalizedDescription,
      summary: listenerOutput.summary,
      address: report.address,
      ward: report.ward,
      coordinates: report.coordinates,
      status: 'TRIAGED',
      priorityTier: scoring.tier,
      priorityScore: scoring.numericScore,
      severityScore: severityOutput.severityScore,
      severityLevel: severityOutput.severityLevel,
      assignedDepartment: priorityOutput.suggestedDepartment || getDefaultDepartment(listenerOutput.category),
      reportsCount: 1,
      reportIds: [report.id],
      agentOutputs: {
        listenerSummary: listenerOutput.summary,
        severityAssessment: severityOutput,
        priorityAssessment: priorityOutput,
        lastUpdated: nowIso,
      },
      recurrenceVelocity: 1.0,
      firstReportedAt: nowIso,
      lastReportedAt: nowIso,
      estimatedResolutionDays: scoring.tier === 'P1_CRITICAL' ? 1 : scoring.tier === 'P2_HIGH' ? 2 : 4,
      timeline: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          actor: 'CivicLens Agent Pipeline',
          action: 'Issue Created & Triaged',
          details: `Autonomous intake via 4-agent Gemini pipeline. Classified as ${scoring.tier} (${scoring.numericScore}/100).`,
          type: 'CREATION',
        },
      ],
      comments: [],
    };

    report.status = 'ASSOCIATED';
    report.consolidatedIssueId = newIssue.id;
    this.reports.unshift(report);
    this.issues.unshift(newIssue);

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: report.citizenId,
      reportId: report.id,
      issueId: newIssue.id,
      title: 'Consolidated Issue Created',
      message: `Your report was registered as new municipal issue ${newIssue.id} (${scoring.tier}). Assigned to ${newIssue.assignedDepartment}.`,
      type: 'STATUS_UPDATE',
      isRead: false,
      createdAt: nowIso,
    });

    return {
      report,
      actionTaken: 'CREATED_NEW_ISSUE',
      consolidatedIssue: newIssue,
    };
  }

  // Municipal officer manual decision in Review Queue
  public async resolveReviewQueue(
    reviewId: string,
    decision: 'MERGE' | 'CREATE_NEW' | 'DISMISS',
    notes: string,
    officerName: string
  ) {
    const item = this.reviewQueue.find((q) => q.id === reviewId);
    if (!item) throw new Error('Review queue item not found');

    const nowIso = new Date().toISOString();
    item.reviewedBy = officerName;
    item.reviewedAt = nowIso;
    item.notes = notes;

    const report = this.reports.find((r) => r.id === item.reportId);

    if (decision === 'MERGE') {
      item.status = 'MERGED';
      const targetIssue = this.issues.find((i) => i.id === item.candidateIssueId);
      if (targetIssue && report) {
        report.status = 'ASSOCIATED';
        report.consolidatedIssueId = targetIssue.id;
        targetIssue.reportsCount += 1;
        targetIssue.reportIds.push(report.id);
        targetIssue.lastReportedAt = nowIso;

        targetIssue.timeline.unshift({
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          actor: officerName,
          action: 'Manual Officer Merge',
          details: `Officer reviewed queue item ${item.id} and approved merge. Note: ${notes}`,
          type: 'MERGE',
        });
      }
    } else if (decision === 'CREATE_NEW') {
      item.status = 'CREATED_NEW';
      if (report) {
        // create new independent issue
        const newIssueId = `ISS-${Math.floor(100 + Math.random() * 900)}`;
        const severityOutput = await runSeverityAgent({
          title: report.title,
          category: report.category,
          description: report.description,
          address: report.address,
          ward: report.ward,
          reportsCount: 1,
        });
        const scoring = calculateDeterministicPriority({
          severityScore: severityOutput.severityScore,
          reportsCount: 1,
          ward: report.ward,
          category: report.category,
          firstReportedAt: nowIso,
        });
        const priorityOutput = await runPriorityAgent(
          {
            title: report.title,
            category: report.category,
            summary: report.description,
            ward: report.ward,
            reportsCount: 1,
            severityScore: severityOutput.severityScore,
            severityLevel: severityOutput.severityLevel,
          },
          scoring.numericScore
        );

        const newIssue: ConsolidatedIssue = {
          id: newIssueId,
          title: report.title,
          category: report.category,
          description: report.description,
          summary: report.title,
          address: report.address,
          ward: report.ward,
          coordinates: report.coordinates,
          status: 'TRIAGED',
          priorityTier: scoring.tier,
          priorityScore: scoring.numericScore,
          severityScore: severityOutput.severityScore,
          severityLevel: severityOutput.severityLevel,
          assignedDepartment: priorityOutput.suggestedDepartment || getDefaultDepartment(report.category),
          reportsCount: 1,
          reportIds: [report.id],
          agentOutputs: {
            listenerSummary: report.title,
            severityAssessment: severityOutput,
            priorityAssessment: priorityOutput,
            lastUpdated: nowIso,
          },
          recurrenceVelocity: 1.0,
          firstReportedAt: nowIso,
          lastReportedAt: nowIso,
          timeline: [
            {
              id: `act-${Date.now()}`,
              timestamp: nowIso,
              actor: officerName,
              action: 'Separated from Review Queue',
              details: `Officer approved independent issue creation from queue: ${notes}`,
              type: 'CREATION',
            },
          ],
          comments: [],
        };
        report.status = 'ASSOCIATED';
        report.consolidatedIssueId = newIssue.id;
        this.issues.unshift(newIssue);
      }
    } else {
      item.status = 'DISMISSED';
      if (report) {
        report.status = 'REJECTED';
      }
    }

    return item;
  }

  // Dashboard Aggregated Analytics
  public getStats(): DashboardStats {
    const totalReports = this.reports.length;
    const consolidatedIssues = this.issues.length;
    const activeIssues = this.issues.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
    const aggregationRatio = consolidatedIssues > 0 ? +(totalReports / consolidatedIssues).toFixed(1) : 1;
    const activeCriticalP1 = activeIssues.filter((i) => i.priorityTier === 'P1_CRITICAL').length;
    const resolvedThisMonth = this.issues.filter((i) => i.status === 'RESOLVED').length;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    for (const r of this.reports) {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
    }
    const reportsByCategory = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    // Priority breakdown
    const p1Count = this.issues.filter((i) => i.priorityTier === 'P1_CRITICAL').length;
    const p2Count = this.issues.filter((i) => i.priorityTier === 'P2_HIGH').length;
    const p3Count = this.issues.filter((i) => i.priorityTier === 'P3_MEDIUM').length;
    const p4Count = this.issues.filter((i) => i.priorityTier === 'P4_LOW').length;

    const issuesByPriority = [
      { tier: 'P1 Critical', count: p1Count, color: '#ec4899' }, // vibrant pink
      { tier: 'P2 High', count: p2Count, color: '#f97316' },     // orange
      { tier: 'P3 Medium', count: p3Count, color: '#eab308' },   // amber
      { tier: 'P4 Low', count: p4Count, color: '#06b6d4' },      // cyan
    ];

    // Trends
    const dailyIngestionTrends = [
      { date: 'Mon', reports: 12, merged: 9 },
      { date: 'Tue', reports: 18, merged: 14 },
      { date: 'Wed', reports: 15, merged: 11 },
      { date: 'Thu', reports: 22, merged: 17 },
      { date: 'Fri', reports: 29, merged: 23 },
      { date: 'Sat', reports: 14, merged: 10 },
      { date: 'Sun (Today)', reports: totalReports, merged: totalReports - consolidatedIssues },
    ];

    // Ward breakdown
    const wardMap: Record<string, { total: number; high: number; scores: number[] }> = {};
    for (const iss of this.issues) {
      if (!wardMap[iss.ward]) {
        wardMap[iss.ward] = { total: 0, high: 0, scores: [] };
      }
      wardMap[iss.ward].total += 1;
      if (iss.priorityTier === 'P1_CRITICAL' || iss.priorityTier === 'P2_HIGH') {
        wardMap[iss.ward].high += 1;
      }
      wardMap[iss.ward].scores.push(iss.priorityScore);
    }

    const wardHeatmap = Object.entries(wardMap).map(([ward, data]) => ({
      ward: ward.replace(/ \(.*\)/, ''), // concise name
      activeIssues: data.total,
      highPriority: data.high,
      avgPriorityScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    }));

    return {
      totalReports,
      consolidatedIssues,
      aggregationRatio,
      activeCriticalP1,
      resolvedThisMonth,
      averageResolutionDays: 1.8,
      aiProcessingSuccessRate: 99.4,
      reportsByCategory,
      issuesByPriority,
      dailyIngestionTrends,
      wardHeatmap,
    };
  }
}

export const dbInstance = new CivicDatabase();
