import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Code2,
  Terminal,
  Database,
  CheckCircle,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DjangoDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DjangoDocsModal: React.FC<DjangoDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'windows-setup' | 'code-viewer'>('architecture');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCommands = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const windowsSetupCommands = `# 1. NAVIGATE TO PROJECT ROOT
cd civiclens

# 2. PYTHON 3.12 VIRTUAL ENVIRONMENT (WINDOWS)
python -m venv venv
venv\\Scripts\\activate

# 3. INSTALL BACKEND DEPENDENCIES
pip install -r backend/requirements.txt

# 4. POSTGRESQL DATABASE SETUP
# Ensure PostgreSQL is active on Windows port 5432
psql -U postgres -c "CREATE DATABASE civiclens_db;"

# 5. CONFIGURE ENVIRONMENT
copy backend\\.env.example backend\\.env
# Edit backend\\.env and set GEMINI_API_KEY and DATABASE_URL

# 6. RUN DJANGO MIGRATIONS
python backend/manage.py makemigrations
python backend/manage.py migrate

# 7. RUN DJANGO REST FRAMEWORK (PORT 8000)
python backend/manage.py runserver 8000

# 8. IN SEPARATE TERMINAL: RUN FRONTEND (PORT 3000)
npm install
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191C1B]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#D6D3CB] bg-[#FAF9F5] shadow-2xl p-6 sm:p-8 text-[#191C1B] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E5DF]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#1B4D3E] font-semibold">
              Technical Documentation &bull; Reference Stack
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#191C1B]">
              Django REST Framework, PostgreSQL &amp; Gemini Agents
            </h2>
            <p className="text-xs text-[#525854]">
              Authoritative architecture specification and local Windows deployment procedure.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#706D66] hover:text-[#191C1B] hover:bg-[#EFECE4] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex border-b border-[#E7E5DF] gap-4 font-sans text-xs">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'architecture'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            Architecture &amp; Data Flow
          </button>
          <button
            onClick={() => setActiveTab('windows-setup')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'windows-setup'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            Windows Local Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('code-viewer')}
            className={`pb-2.5 px-1 font-semibold transition-colors border-b-2 ${
              activeTab === 'code-viewer'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-[#706D66] hover:text-[#191C1B]'
            }`}
          >
            Django Codebase Files
          </button>
        </div>

        {/* Tab 1: Architecture */}
        {activeTab === 'architecture' && (
          <div className="mt-6 space-y-5 text-xs">
            <div className="p-5 rounded-xl border border-[#D6D3CB] bg-white space-y-3">
              <h3 className="font-serif font-bold text-base text-[#191C1B]">System Responsibility Split</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E7E5DF] space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#1B4D3E]">Frontend</span>
                  <div className="font-semibold text-[#191C1B]">Next.js &amp; Tailwind CSS</div>
                  <p className="text-[#525854] text-[11px] leading-relaxed">
                    App Router, Recharts, Lucide icons, responsive editorial interface. Communicates with backend via authenticated REST calls.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E7E5DF] space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#1B4D3E]">Backend</span>
                  <div className="font-semibold text-[#191C1B]">Django REST Framework</div>
                  <p className="text-[#525854] text-[11px] leading-relaxed">
                    Python 3.12, Django ORM, role-based authorization, transactions, and Google Gen AI Python SDK orchestration.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E7E5DF] space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#1B4D3E]">Database</span>
                  <div className="font-semibold text-[#191C1B]">PostgreSQL (Sole DB)</div>
                  <p className="text-[#525854] text-[11px] leading-relaxed">
                    Foreign keys, JSONField for structured AI outputs, spatial ward indices, and transactional locking during merges.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#F4F2EC] space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#191C1B]">Deterministic Scoring Formula</h4>
              <p className="font-mono text-xs text-[#1B4D3E] bg-white p-2 rounded border border-[#D6D3CB]">
                Priority Score (1–100) = clamp(0.45*Severity + 0.25*Recurrence + 0.15*WardSensitivity + 0.15*Aging, 1, 100)
              </p>
              <p className="text-[#525854] text-[11px] leading-relaxed">
                The Priority Agent recommends qualitative dispatch actions (e.g. cold-patch crew deployment), while the numeric score is calculated deterministically to guarantee transparency and auditability.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Windows Setup Guide */}
        {activeTab === 'windows-setup' && (
          <div className="mt-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-base text-[#191C1B]">
                Windows Local Development Terminal Script
              </span>
              <button
                onClick={() => handleCopyCommands(windowsSetupCommands)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] text-white font-semibold text-xs transition-colors"
              >
                {copiedCode ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-white border border-[#D6D3CB] text-[11px] font-mono text-[#191C1B] overflow-x-auto leading-relaxed">
              {windowsSetupCommands}
            </pre>
          </div>
        )}

        {/* Tab 3: Code Viewer */}
        {activeTab === 'code-viewer' && (
          <div className="mt-6 space-y-4 text-xs">
            <p className="text-[#525854]">
              The backend codebase files have been created in the workspace at <code className="font-mono text-[#1B4D3E]">/backend/</code>:
            </p>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span className="font-bold text-[#191C1B]">backend/requirements.txt</span>
                <span className="text-[#706D66]">Django 5, DRF, psycopg3, google-genai</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span className="font-bold text-[#191C1B]">backend/config/settings.py</span>
                <span className="text-[#706D66]">PostgreSQL configuration, CORS, DRF</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span className="font-bold text-[#191C1B]">backend/apps/reports/models.py</span>
                <span className="text-[#706D66]">Report model, JSONField for AI outputs</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span className="font-bold text-[#191C1B]">backend/apps/issues/models.py</span>
                <span className="text-[#706D66]">ConsolidatedIssue, PriorityTier, Activities</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span className="font-bold text-[#191C1B]">backend/services/agent_orchestrator.py</span>
                <span className="text-[#706D66]">Google Gen AI Python SDK 4-Agent Pipeline</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#E7E5DF] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#F4F2EC] hover:bg-[#EAE6DC] text-[#191C1B] font-semibold text-xs border border-[#D6D3CB] transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
