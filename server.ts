import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbInstance } from './src/server/db.ts';
import { agentLogs, runListenerAgent, runRecurrenceAgent, runSeverityAgent, runPriorityAgent } from './src/server/geminiService.ts';
import { calculateDeterministicPriority } from './src/server/scoringEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'CivicLens AI Municipal Aggregation Platform',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Users
app.get('/api/users/current', (req: Request, res: Response) => {
  const role = req.query.role === 'ADMIN' ? 'ADMIN' : 'CITIZEN';
  const user = dbInstance.users.find((u) => u.role === role) || dbInstance.users[0];
  res.json(user);
});

// Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = dbInstance.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reports
app.get('/api/reports', (req: Request, res: Response) => {
  const { citizenId, status, category, ward } = req.query;
  let result = [...dbInstance.reports];

  if (citizenId) {
    result = result.filter((r) => r.citizenId === citizenId);
  }
  if (status) {
    result = result.filter((r) => r.status === status);
  }
  if (category) {
    result = result.filter((r) => r.category === category);
  }
  if (ward) {
    result = result.filter((r) => r.ward === ward);
  }

  res.json(result);
});

app.get('/api/reports/:id', (req: Request, res: Response) => {
  const report = dbInstance.reports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Include linked issue if any
  let issue = null;
  if (report.consolidatedIssueId) {
    issue = dbInstance.issues.find((i) => i.id === report.consolidatedIssueId);
  }

  res.json({ report, consolidatedIssue: issue });
});

// Real-time Listener preview before submitting
app.post('/api/ai/preview-listener', async (req: Request, res: Response) => {
  try {
    const { title, description, category, address, citizenUrgency } = req.body;
    if (!title && !description) {
      return res.status(400).json({ error: 'Title or description required' });
    }

    const output = await runListenerAgent({
      rawTitle: title || 'Untitled report',
      rawDescription: description || '',
      category,
      address: address || 'City Center',
      citizenUrgency,
    });

    res.json(output);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit report and trigger 4-agent pipeline
app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const {
      citizenId,
      citizenName,
      citizenEmail,
      title,
      description,
      category,
      address,
      ward,
      coordinates,
      photoUrl,
      citizenUrgency,
    } = req.body;

    if (!title || !description || !address || !ward) {
      return res.status(400).json({ error: 'Missing required report fields (title, description, address, ward).' });
    }

    const result = await dbInstance.submitReport({
      citizenId,
      citizenName,
      citizenEmail,
      title,
      description,
      category,
      address,
      ward,
      coordinates,
      photoUrl,
      citizenUrgency,
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error submitting report:', err);
    res.status(500).json({ error: err.message || 'Report processing failed' });
  }
});

// Consolidated Issues
app.get('/api/issues', (req: Request, res: Response) => {
  const { status, category, priorityTier, ward, search } = req.query;
  let result = [...dbInstance.issues];

  if (status) {
    result = result.filter((i) => i.status === status);
  }
  if (category) {
    result = result.filter((i) => i.category === category);
  }
  if (priorityTier) {
    result = result.filter((i) => i.priorityTier === priorityTier);
  }
  if (ward) {
    result = result.filter((i) => i.ward === ward);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q)
    );
  }

  // Sort by priorityScore descending
  result.sort((a, b) => b.priorityScore - a.priorityScore);

  res.json(result);
});

app.get('/api/issues/:id', (req: Request, res: Response) => {
  const issue = dbInstance.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Attach full report objects
  const linkedReports = dbInstance.reports.filter((r) => issue.reportIds.includes(r.id));
  res.json({
    ...issue,
    reports: linkedReports,
  });
});

app.patch('/api/issues/:id', (req: Request, res: Response) => {
  const issue = dbInstance.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const { status, assignedDepartment, estimatedResolutionDays, actorName } = req.body;
  const nowIso = new Date().toISOString();

  if (status && status !== issue.status) {
    const oldStatus = issue.status;
    issue.status = status;
    issue.timeline.unshift({
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      actor: actorName || 'Municipal Dispatcher',
      action: 'Status Updated',
      details: `Status transitioned from ${oldStatus} to ${status}.`,
      type: 'STATUS_CHANGE',
    });

    // Notify citizens linked to this issue
    issue.reportIds.forEach((repId) => {
      const rep = dbInstance.reports.find((r) => r.id === repId);
      if (rep) {
        dbInstance.notifications.unshift({
          id: `notif-${Date.now()}-${rep.id}`,
          userId: rep.citizenId,
          reportId: rep.id,
          issueId: issue.id,
          title: `Issue ${issue.id} Status: ${status}`,
          message: `The municipal issue your report was merged into is now marked ${status}.`,
          type: status === 'RESOLVED' ? 'RESOLVED' : 'STATUS_UPDATE',
          isRead: false,
          createdAt: nowIso,
        });
      }
    });
  }

  if (assignedDepartment && assignedDepartment !== issue.assignedDepartment) {
    issue.assignedDepartment = assignedDepartment;
    issue.timeline.unshift({
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      actor: actorName || 'Municipal Dispatcher',
      action: 'Department Reassigned',
      details: `Reassigned to ${assignedDepartment}.`,
      type: 'STATUS_CHANGE',
    });
  }

  if (estimatedResolutionDays !== undefined) {
    issue.estimatedResolutionDays = estimatedResolutionDays;
  }

  res.json(issue);
});

app.post('/api/issues/:id/comments', (req: Request, res: Response) => {
  const issue = dbInstance.issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const { author, role, text, isInternal } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const comment = {
    id: `com-${Date.now()}`,
    author: author || 'Municipal Officer',
    role: (role as any) || 'ADMIN',
    text,
    timestamp: new Date().toISOString(),
    isInternal: Boolean(isInternal),
  };

  issue.comments.push(comment);
  res.status(201).json(comment);
});

// Review Queue
app.get('/api/review-queue', (_req: Request, res: Response) => {
  res.json(dbInstance.reviewQueue);
});

app.post('/api/review-queue/:id/decision', async (req: Request, res: Response) => {
  try {
    const { decision, notes, officerName } = req.body;
    if (!['MERGE', 'CREATE_NEW', 'DISMISS'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision type' });
    }

    const result = await dbInstance.resolveReviewQueue(
      req.params.id,
      decision,
      notes || 'Processed by triage officer',
      officerName || 'Director Marcus Vance'
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Processing Logs
app.get('/api/ai/logs', (_req: Request, res: Response) => {
  res.json(agentLogs);
});

// Test Agent Sandbox
app.post('/api/ai/test-agent', async (req: Request, res: Response) => {
  try {
    const { agentName, payload } = req.body;

    if (agentName === 'Listener Agent') {
      const result = await runListenerAgent({
        rawTitle: payload.title || 'Water pipe broke on 5th',
        rawDescription: payload.description || 'Flooding the sidewalk',
        category: payload.category,
        address: payload.address || '5th and Main',
        citizenUrgency: payload.urgency || 'HIGH',
      });
      return res.json(result);
    }

    if (agentName === 'Recurrence Agent') {
      const activeCandidates = dbInstance.issues.slice(0, 4);
      const result = await runRecurrenceAgent(
        {
          title: payload.title || 'Pothole on 4th street',
          description: payload.description || 'Damaged wheel rim',
          category: payload.category || 'Roads & Bridges',
          address: payload.address || '4th and Main',
          ward: payload.ward || 'Ward 2 (Downtown & School District)',
        },
        activeCandidates
      );
      return res.json(result);
    }

    if (agentName === 'Severity Agent') {
      const result = await runSeverityAgent({
        title: payload.title || 'Gas leak smell near community park',
        category: payload.category || 'Public Safety & Hazards',
        description: payload.description || 'Strong odor near children playground',
        address: payload.address || 'Community Park Sector 3',
        ward: payload.ward || 'Ward 3 (West Suburbs)',
        reportsCount: payload.reportsCount || 3,
        reportedHazards: payload.hazards || ['chemical_leak'],
      });
      return res.json(result);
    }

    if (agentName === 'Priority Agent') {
      const severity = payload.severityScore || 75;
      const scoring = calculateDeterministicPriority({
        severityScore: severity,
        reportsCount: payload.reportsCount || 4,
        ward: payload.ward || 'Ward 4 (Central Hospital & Metro Corridor)',
        category: payload.category || 'Water & Drainage',
        firstReportedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      });

      const result = await runPriorityAgent(
        {
          title: payload.title || 'Water main rupture',
          category: payload.category || 'Water & Drainage',
          summary: 'Water pipe leak outside emergency entrance',
          ward: payload.ward || 'Ward 4 (Central Hospital & Metro Corridor)',
          reportsCount: payload.reportsCount || 4,
          severityScore: severity,
          severityLevel: severity > 80 ? 'CRITICAL' : 'HIGH',
        },
        scoring.numericScore
      );

      return res.json({ scoring, priorityAgent: result });
    }

    res.status(400).json({ error: `Unknown agent: ${agentName}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr-citizen-1';
  const notifs = dbInstance.notifications.filter((n) => n.userId === userId);
  res.json(notifs);
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = dbInstance.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

// Reset demo data
app.post('/api/reset-demo', (_req: Request, res: Response) => {
  dbInstance.seed();
  res.json({ message: 'Demo data reseeded successfully' });
});

// Mount Vite or static server
async function setupVite() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicLens server active on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
