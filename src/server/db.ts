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
        email: 'goelvandita777@gmail.com',
        role: 'CITIZEN',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr-admin-1',
        name: 'Director Marcus Vance',
        email: 'admin.dispatch@civiclens.gov',
        role: 'ADMIN',
        ward: 'Ward 1 (Civic Center)',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      },
    ];

    const now = new Date();
    const isoHoursAgo = (hours: number) =>
      new Date(now.getTime() - hours * 3600 * 1000).toISOString();

    // 1. Critical Water & Drainage Issue (5 merged reports)
    const issue1: ConsolidatedIssue = {
      id: 'ISS-101',
      title: 'Major Water Main Fracture & Flooding at Hospital Access Route',
      category: 'Water & Drainage',
      description:
        'Sub-surface potable water pipeline burst causing 4 inches of standing water on 9th Ave, blocking emergency ambulance bays and eroding asphalt foundation.',
      summary: 'High-pressure water main breach near Ward 4 Hospital, impeding ambulances.',
      address: '740 9th Ave (Opposite St. Jude Hospital Entrance)',
      ward: 'Ward 4 (Central Hospital & Metro Corridor)',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      status: 'IN_PROGRESS',
      priorityTier: 'P1_CRITICAL',
      priorityScore: 94,
      severityScore: 91,
      severityLevel: 'CRITICAL',
      assignedDepartment: 'Water Supply & Sewerage Board',
      reportsCount: 5,
      reportIds: ['REP-201', 'REP-202', 'REP-203', 'REP-204', 'REP-205'],
      agentOutputs: {
        listenerSummary:
          'Multiple citizen alarms reporting submerged roadway and geyser-like leak outside hospital.',
        severityAssessment: {
          severityLevel: 'CRITICAL',
          publicSafetyRisk: 9,
          infrastructureDamageRisk: 9,
          vulnerablePopulationImpact: true,
          economicOrTrafficDisruption: 9,
          environmentalHazard: true,
          severityScore: 91,
          keyRisks: [
            'Ambulance delay to emergency room',
            'Sub-pavement sinkhole formation risk',
            'Municipal water loss estimated at 1200 gal/hour',
          ],
          justification:
            'Critical emergency due to direct interference with hospital ambulance transit and rapid sub-base erosion.',
        },
        priorityAssessment: {
          priorityTier: 'P1_CRITICAL',
          recommendedAction:
            'Emergency valve isolation crew dispatched; alert public transit detour.',
          dispatchUrgency: 'IMMEDIATE_2H',
          explanation:
            'Score 94/100 triggers mandatory Level-1 incident response with immediate heavy equipment dispatch.',
          suggestedDepartment: 'Water Supply & Sewerage Board',
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
          actor: 'Director Marcus Vance',
          action: 'Work Crew Dispatched',
          details: 'Water Emergency Response Unit #4 deployed on-site.',
          type: 'DISPATCH',
        },
      ],
      comments: [
        {
          id: 'com-1',
          author: 'Supervisor Frank Kowalski',
          role: 'ADMIN',
          text: 'Isolation valve #14 shut down. Secondary bypass engaged to keep hospital pressure above 40 PSI.',
          timestamp: isoHoursAgo(2),
          isInternal: true,
        },
      ],
    };

    // 2. High Priority Pothole Cluster (3 merged reports)
    const issue2: ConsolidatedIssue = {
      id: 'ISS-102',
      title: 'Cluster of Severe Asphalt Potholes on 4th & Main Commercial Corridor',
      category: 'Roads & Bridges',
      description:
        'Chain of three deep potholes (up to 7 inches deep) spanning the eastbound bicycle lane and right vehicular lane. Multiple reports of blown tires and swerving traffic.',
      summary: 'Deep arterial potholes damaging vehicles and causing traffic bottleneck.',
      address: 'Intersection of 4th St & Main Blvd',
      ward: 'Ward 2 (Downtown & School District)',
      coordinates: { lat: 37.7833, lng: -122.4167 },
      status: 'ASSIGNED',
      priorityTier: 'P2_HIGH',
      priorityScore: 78,
      severityScore: 72,
      severityLevel: 'HIGH',
      assignedDepartment: 'Department of Transportation & Roads',
      reportsCount: 4,
      reportIds: ['REP-206', 'REP-207', 'REP-208', 'REP-209'],
      agentOutputs: {
        listenerSummary: 'Repeated reports of vehicular rim damage and cyclists forced into heavy traffic.',
        severityAssessment: {
          severityLevel: 'HIGH',
          publicSafetyRisk: 8,
          infrastructureDamageRisk: 6,
          vulnerablePopulationImpact: true,
          economicOrTrafficDisruption: 7,
          environmentalHazard: false,
          severityScore: 72,
          keyRisks: [
            'Cyclist collision risk',
            'Wheel rim and axle damage to passenger cars',
            'Congestion during evening rush hour',
          ],
          justification: 'Located in school zone arterial, posing immediate hazard to smaller vehicles.',
        },
        priorityAssessment: {
          priorityTier: 'P2_HIGH',
          recommendedAction: 'Deploy asphalt patching truck and temporary traffic safety cones within 24h.',
          dispatchUrgency: 'WITHIN_24H',
          explanation: 'P2 priority assigned due to 4 citizen reports and downtown school corridor location.',
          suggestedDepartment: 'Department of Transportation & Roads',
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
      title: 'Consecutive Dark Streetlight Outage on Elmwood Residential Boulevard',
      category: 'Streetlights & Electrical',
      description:
        'Series of four consecutive municipal LED lamp heads extinguished between 14th and 18th Avenue, creating a 300-meter blackout zone on pedestrian sidewalk.',
      summary: '4 consecutive streetlights non-operational, dark residential corridor.',
      address: 'Elmwood Blvd between 14th & 18th St',
      ward: 'Ward 7 (East Market & High-Density Residential)',
      coordinates: { lat: 37.765, lng: -122.425 },
      status: 'TRIAGED',
      priorityTier: 'P3_MEDIUM',
      priorityScore: 54,
      severityScore: 48,
      severityLevel: 'MEDIUM',
      assignedDepartment: 'Public Lighting & Energy Grid',
      reportsCount: 2,
      reportIds: ['REP-210', 'REP-211'],
      agentOutputs: {
        listenerSummary: 'Citizens expressing nighttime walking safety concerns along Elmwood.',
        severityAssessment: {
          severityLevel: 'MEDIUM',
          publicSafetyRisk: 5,
          infrastructureDamageRisk: 3,
          vulnerablePopulationImpact: false,
          economicOrTrafficDisruption: 2,
          environmentalHazard: false,
          severityScore: 48,
          keyRisks: ['Pedestrian slip-and-fall risk at night', 'Personal safety apprehension in dark corridor'],
          justification: 'Non-emergency residential outage requiring scheduled luminaire or circuit breaker service.',
        },
        priorityAssessment: {
          priorityTier: 'P3_MEDIUM',
          recommendedAction: 'Schedule bucket truck inspection on next scheduled residential circuit route.',
          dispatchUrgency: 'WITHIN_72H',
          explanation: 'Standard maintenance priority tier.',
          suggestedDepartment: 'Public Lighting & Energy Grid',
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
      title: 'Vandalized Park Benches & Minor Overgrowth at Rosewood Green',
      category: 'Parks & Public Spaces',
      description:
        'Two wooden benches have splintered slats and graffiti tagging near the playground perimeter. Lawns need standard trim.',
      summary: 'Park bench upkeep and graffiti removal at Rosewood Green.',
      address: 'Rosewood Community Park (Playground Sector B)',
      ward: 'Ward 3 (West Suburbs)',
      coordinates: { lat: 37.755, lng: -122.435 },
      status: 'ASSIGNED',
      priorityTier: 'P4_LOW',
      priorityScore: 32,
      severityScore: 28,
      severityLevel: 'LOW',
      assignedDepartment: 'Parks & Recreation Department',
      reportsCount: 1,
      reportIds: ['REP-212'],
      agentOutputs: {
        listenerSummary: 'Cosmetic repair request for playground benches.',
        severityAssessment: {
          severityLevel: 'LOW',
          publicSafetyRisk: 2,
          infrastructureDamageRisk: 2,
          vulnerablePopulationImpact: false,
          economicOrTrafficDisruption: 1,
          environmentalHazard: false,
          severityScore: 28,
          keyRisks: ['Minor splinters', 'Aesthetic degradation'],
          justification: 'No structural failure or imminent hazard.',
        },
        priorityAssessment: {
          priorityTier: 'P4_LOW',
          recommendedAction: 'Add to weekly park maintenance docket for sanding and repainting.',
          dispatchUrgency: 'SCHEDULED',
          explanation: 'Low severity and single report.',
          suggestedDepartment: 'Parks & Recreation Department',
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
      title: 'Fallen Tree Branch Obstructing Southbound Lane on Pine St',
      category: 'Public Safety & Hazards',
      description:
        'Large eucalyptus limb snapped during morning windstorm and blocked vehicular lane.',
      summary: 'Storm debris cleared and roadway swept by emergency crew.',
      address: '1100 Pine Street',
      ward: 'Ward 1 (Civic Center)',
      coordinates: { lat: 37.79, lng: -122.41 },
      status: 'RESOLVED',
      priorityTier: 'P2_HIGH',
      priorityScore: 68,
      severityScore: 65,
      severityLevel: 'HIGH',
      assignedDepartment: 'Emergency Infrastructure Services',
      reportsCount: 3,
      reportIds: ['REP-213', 'REP-214', 'REP-215'],
      agentOutputs: {
        listenerSummary: 'Citizen alerts regarding vehicular blockage from storm damage.',
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
          recommendedAction: 'Rapid removal with chainsaw and woodchipper.',
          dispatchUrgency: 'WITHIN_24H',
          explanation: 'Resolved successfully by arbor team.',
          suggestedDepartment: 'Emergency Infrastructure Services',
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
          actor: 'Crew Chief Rodriguez',
          action: 'Road Cleared & Swept',
          details: 'Branch chipped and lane reopened to traffic.',
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
        citizenEmail: 'goelvandita777@gmail.com',
        title: 'Geyser of water shooting up right outside hospital emergency entrance',
        description:
          'Water is bubbling violently out of a crack in the pavement on 9th Ave. Cars are turning around and an ambulance had to slow right down.',
        category: 'Water & Drainage',
        address: '740 9th Ave (Near St. Jude Hospital)',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        coordinates: { lat: 37.7749, lng: -122.4194 },
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
        citizenName: 'David Chen',
        citizenEmail: 'dchen@example.org',
        title: 'Flooding in front of medical center on 9th Avenue',
        description: 'Road completely flooded, about 3-4 inches of running water. Water main broke.',
        category: 'Water & Drainage',
        address: '744 9th Ave',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        coordinates: { lat: 37.775, lng: -122.4192 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(32),
        updatedAt: isoHoursAgo(32),
      },
      {
        id: 'REP-203',
        citizenId: 'usr-cit-3',
        citizenName: 'Sarah Jenkins',
        citizenEmail: 'sjenkins@example.com',
        title: 'Broken pipe collapsing sidewalk curb near St Jude',
        description: 'Water has undermined the concrete curb. Dangerous for pedestrians.',
        category: 'Water & Drainage',
        address: '9th Ave & Jefferson',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        coordinates: { lat: 37.7748, lng: -122.4195 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(22),
        updatedAt: isoHoursAgo(22),
      },
      {
        id: 'REP-204',
        citizenId: 'usr-cit-4',
        citizenName: 'Officer Bradley',
        citizenEmail: 'bradley.p@citypolice.gov',
        title: 'Water main break - traffic reroute needed immediately',
        description: 'Assisting ambulance transit. Road base might collapse if heavy trucks pass.',
        category: 'Water & Drainage',
        address: '740 9th Ave',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        coordinates: { lat: 37.7749, lng: -122.4194 },
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
        citizenEmail: 'goelvandita777@gmail.com',
        title: 'Water leak still flowing outside hospital',
        description: 'Followup: crew arrived but water pressure still high on the street.',
        category: 'Water & Drainage',
        address: '740 9th Ave',
        ward: 'Ward 4 (Central Hospital & Metro Corridor)',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        citizenUrgency: 'HIGH',
        status: 'ASSOCIATED',
        consolidatedIssueId: 'ISS-101',
        createdAt: isoHoursAgo(2),
        updatedAt: isoHoursAgo(2),
      },
      {
        id: 'REP-206',
        citizenId: 'usr-cit-5',
        citizenName: 'Elena Rostova',
        citizenEmail: 'elena.r@example.net',
        title: 'Huge pothole popped my front right tire',
        description: 'Right on 4th and Main. You cannot see it when turning in the shadows.',
        category: 'Roads & Bridges',
        address: '4th & Main St',
        ward: 'Ward 2 (Downtown & School District)',
        coordinates: { lat: 37.7833, lng: -122.4167 },
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
        citizenName: 'Carlos Morales',
        citizenEmail: 'carlos@example.com',
        title: 'Deep crater on 4th street bike lane',
        description: 'Nearly crashed my bicycle. The asphalt has completely hollowed out.',
        category: 'Roads & Bridges',
        address: '4th St between Main and Pine',
        ward: 'Ward 2 (Downtown & School District)',
        coordinates: { lat: 37.7834, lng: -122.4165 },
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
      citizenName: 'Maya Lin',
      citizenEmail: 'mlin@example.com',
      title: 'Water pooling by storm drain on 8th and Jefferson',
      description:
        'There is standing dirty water around the catch basin. Not sure if it is backed up storm drain or related to the main break on 9th Ave 2 blocks away.',
      category: 'Water & Drainage',
      address: '8th Ave & Jefferson St',
      ward: 'Ward 4 (Central Hospital & Metro Corridor)',
      coordinates: { lat: 37.7755, lng: -122.421 },
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
          'Recurrence Agent detected nearby water pooling within 220 meters of ISS-101 (Hospital Water Main Burst). It may be runoff from the fracture or an isolated blocked catch basin.',
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
        title: 'Emergency Crew Deployed',
        message: 'Your report REP-201 was consolidated into Critical Issue ISS-101. Water emergency response unit is currently on-site.',
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
        message: 'Your follow-up report was clustered. Collective citizen recurrence elevated priority score to 94.',
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
