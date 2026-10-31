import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  MapPin,
  Camera,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Droplets,
  Trash2,
  Lightbulb,
  Trees,
  TrafficCone,
  Car,
  Flame,
} from 'lucide-react';
import { CivicCategory, ListenerAgentOutput, User } from '../types/index.ts';

interface ReportSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onReportSubmitted: (result: any) => void;
}

const CATEGORIES: { label: CivicCategory; icon: any }[] = [
  { label: 'Roads & Bridges', icon: Car },
  { label: 'Water & Drainage', icon: Droplets },
  { label: 'Sanitation & Solid Waste', icon: Trash2 },
  { label: 'Streetlights & Electrical', icon: Lightbulb },
  { label: 'Public Safety & Hazards', icon: Flame },
  { label: 'Parks & Public Spaces', icon: Trees },
  { label: 'Traffic & Signage', icon: TrafficCone },
];

const WARDS = [
  'Ward 4 (Central Hospital & Metro Corridor)',
  'Ward 2 (Downtown & School District)',
  'Ward 7 (East Market & High-Density Residential)',
  'Ward 1 (Civic Center)',
  'Ward 5 (North Industrial Park)',
  'Ward 3 (West Suburbs)',
  'Ward 6 (Harbor & Logistics Hub)',
];

export const ReportSubmissionModal: React.FC<ReportSubmissionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onReportSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CivicCategory>('Roads & Bridges');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState(currentUser.ward || WARDS[0]);
  const [citizenUrgency, setCitizenUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('MEDIUM');
  const [photoUrl, setPhotoUrl] = useState('');

  // AI Listener Preview state
  const [listenerPreview, setListenerPreview] = useState<ListenerAgentOutput | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Submission pipeline state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  if (!isOpen) return null;

  // Real-time AI Listener check
  const handleRunListenerCheck = async () => {
    if (!title && !description) return;
    setIsPreviewLoading(true);
    try {
      const res = await fetch('/api/ai/preview-listener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          address: address || 'Municipal Area',
          citizenUrgency,
        }),
      });
      const data = await res.json();
      setListenerPreview(data);
      if (data.category && CATEGORIES.some((c) => c.label === data.category)) {
        setCategory(data.category as CivicCategory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Sample quick presets
  const handleQuickFill = (type: 'pothole' | 'water' | 'light') => {
    if (type === 'pothole') {
      setTitle('Dangerous crater pothole damaging car rims on 4th and Main');
      setDescription('Pothole is roughly 8 inches deep right in the right lane before the pedestrian crossing. Cars are swerving abruptly.');
      setCategory('Roads & Bridges');
      setAddress('4th St & Main Blvd');
      setWard('Ward 2 (Downtown & School District)');
      setCitizenUrgency('HIGH');
      setPhotoUrl('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80');
    } else if (type === 'water') {
      setTitle('Water main gushing on 9th avenue near St Jude');
      setDescription('Water is flooding the roadway and running towards the ambulance bay. High pressure bubbling up from crack in asphalt.');
      setCategory('Water & Drainage');
      setAddress('740 9th Ave (Outside Hospital)');
      setWard('Ward 4 (Central Hospital & Metro Corridor)');
      setCitizenUrgency('EMERGENCY');
      setPhotoUrl('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80');
    } else {
      setTitle('Streetlights out for three blocks on Elmwood');
      setDescription('Entire block is pitch black at night. Kids and commuters walk here from bus stop #12.');
      setCategory('Streetlights & Electrical');
      setAddress('Elmwood Blvd & 16th St');
      setWard('Ward 7 (East Market & High-Density Residential)');
      setCitizenUrgency('MEDIUM');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address) return;

    setIsSubmitting(true);
    setPipelineStep(1);

    try {
      setTimeout(() => setPipelineStep(2), 600);
      setTimeout(() => setPipelineStep(3), 1200);
      setTimeout(() => setPipelineStep(4), 1800);

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: currentUser.id,
          citizenName: currentUser.name,
          citizenEmail: currentUser.email,
          title,
          description,
          category,
          address,
          ward,
          citizenUrgency,
          photoUrl: photoUrl || undefined,
        }),
      });

      const data = await response.json();
      setTimeout(() => {
        setSubmissionResult(data);
        setIsSubmitting(false);
        onReportSubmitted(data);
      }, 2400);
    } catch (err) {
      console.error('Error submitting report:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191C1B]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#D6D3CB] bg-[#FAF9F5] shadow-2xl p-6 sm:p-8 text-[#191C1B] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E5DF]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D66]">
              Citizen Dispatch Intake
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#191C1B]">
              File a Civic Defect Report
            </h2>
            <p className="text-xs text-[#525854]">
              Intake is standardized and deduplicated by the 4-Agent Gemini pipeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#706D66] hover:text-[#191C1B] hover:bg-[#EFECE4] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick presets */}
        {!submissionResult && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-[#706D66] font-mono text-[11px]">Field Presets:</span>
            <button
              type="button"
              onClick={() => handleQuickFill('pothole')}
              className="px-2.5 py-1 rounded bg-[#F4F2EC] hover:bg-[#EAE6DC] text-[#444845] border border-[#D6D3CB] text-[11px]"
            >
              4th St Pothole
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('water')}
              className="px-2.5 py-1 rounded bg-[#E8EFEA] hover:bg-[#D5E4D9] text-[#1B4D3E] border border-[#A7C8B2] text-[11px] font-medium"
            >
              Hospital Water Main
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('light')}
              className="px-2.5 py-1 rounded bg-[#FEFCE8] hover:bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] text-[11px]"
            >
              Elmwood Blackout
            </button>
          </div>
        )}

        {/* Modal Body */}
        {submissionResult ? (
          /* Result confirmation */
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-[#1B4D3E]/30 bg-[#F2F7F4] p-5 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#191C1B]">
                Report Registered &amp; Evaluated Successfully
              </h3>
              <p className="text-xs text-[#444845] mt-1 max-w-lg mx-auto">
                Report <span className="font-mono font-bold text-[#1B4D3E]">{submissionResult.report.id}</span> was ingested and analyzed across all 4 machine agents.
              </p>
            </div>

            {/* Outcome card */}
            <div className="rounded-xl border border-[#D6D3CB] bg-white p-5 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D66] block">
                Automated Pipeline Result
              </span>

              {submissionResult.actionTaken === 'MERGED_TO_EXISTING' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#191C1B]">
                      Clustered with Active Issue #{submissionResult.consolidatedIssue?.id}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FBBF24]/40">
                      {submissionResult.consolidatedIssue?.priorityTier} &bull; Score {submissionResult.consolidatedIssue?.priorityScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-[#525854]">
                    {submissionResult.consolidatedIssue?.title}
                  </p>
                  <p className="text-xs text-[#706D66] bg-[#F4F2EC] p-3 rounded-lg border border-[#E7E5DF] leading-relaxed">
                    💡 <strong>Recurrence Deduplication:</strong> This physical defect was already tracked by city operations. Your report was clustered as notice #{submissionResult.consolidatedIssue?.reportsCount}. This elevated the municipal priority score and prevented a redundant field crew dispatch.
                  </p>
                </div>
              )}

              {submissionResult.actionTaken === 'CREATED_NEW_ISSUE' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#1B4D3E]">
                      Created New Master Ticket #{submissionResult.consolidatedIssue?.id}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8EFEA] text-[#1B4D3E] border border-[#1B4D3E]/30">
                      {submissionResult.consolidatedIssue?.priorityTier} &bull; Score {submissionResult.consolidatedIssue?.priorityScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-[#525854]">
                    {submissionResult.consolidatedIssue?.title}
                  </p>
                  <p className="text-xs text-[#706D66] bg-[#F4F2EC] p-3 rounded-lg border border-[#E7E5DF]">
                    Routed to <strong>{submissionResult.consolidatedIssue?.assignedDepartment}</strong> for operational scheduling.
                  </p>
                </div>
              )}

              {submissionResult.actionTaken === 'QUEUED_FOR_HUMAN_REVIEW' && (
                <div className="space-y-2">
                  <span className="font-serif font-bold text-base text-[#B45309]">
                    Routed to Triage Desk for Human Verification
                  </span>
                  <p className="text-xs text-[#525854] leading-relaxed">
                    The Recurrence Agent detected candidate issue #{submissionResult.consolidatedIssue?.id} nearby with moderate similarity. A municipal triage officer will inspect the location to confirm if this represents the same failure or an independent defect.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] text-white font-semibold text-xs transition-colors"
              >
                Close &amp; Return to Register
              </button>
            </div>
          </div>
        ) : isSubmitting ? (
          /* 4-Agent Pipeline Execution Stepper */
          <div className="mt-8 py-8 space-y-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E8EFEA] text-[#1B4D3E] animate-pulse">
              <Activity className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#191C1B]">
                4-Agent Intelligence Pipeline Processing...
              </h3>
              <p className="text-xs text-[#706D66] mt-1">
                Auditing defect description, proximity clustering, and public safety severity.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-2 text-left">
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  pipelineStep >= 1
                    ? 'border-[#1B4D3E]/40 bg-[#F2F7F4] text-[#191C1B]'
                    : 'border-[#E7E5DF] bg-white text-[#858A85]'
                }`}
              >
                <span className="font-medium">1. Listener: Natural Language Intake &amp; Hazard Titling</span>
                {pipelineStep > 1 && <CheckCircle2 className="h-4 w-4 text-[#1B4D3E]" />}
              </div>

              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  pipelineStep >= 2
                    ? 'border-[#1B4D3E]/40 bg-[#F2F7F4] text-[#191C1B]'
                    : 'border-[#E7E5DF] bg-white text-[#858A85]'
                }`}
              >
                <span className="font-medium">2. Recurrence: Spatial Proximity &amp; Deduplication</span>
                {pipelineStep > 2 && <CheckCircle2 className="h-4 w-4 text-[#1B4D3E]" />}
              </div>

              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  pipelineStep >= 3
                    ? 'border-[#1B4D3E]/40 bg-[#F2F7F4] text-[#191C1B]'
                    : 'border-[#E7E5DF] bg-white text-[#858A85]'
                }`}
              >
                <span className="font-medium">3. Severity: Structural &amp; Public Safety Assessment</span>
                {pipelineStep > 3 && <CheckCircle2 className="h-4 w-4 text-[#1B4D3E]" />}
              </div>

              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  pipelineStep >= 4
                    ? 'border-[#1B4D3E]/40 bg-[#F2F7F4] text-[#191C1B]'
                    : 'border-[#E7E5DF] bg-white text-[#858A85]'
                }`}
              >
                <span className="font-medium">4. Priority: Deterministic 1–100 Mathematical Scoring</span>
                {pipelineStep >= 4 && <CheckCircle2 className="h-4 w-4 text-[#1B4D3E]" />}
              </div>
            </div>
          </div>
        ) : (
          /* Intake Form */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#191C1B]">
                  Issue Summary / Physical Problem *
                </label>
                <button
                  type="button"
                  onClick={handleRunListenerCheck}
                  disabled={isPreviewLoading || (!title && !description)}
                  className="text-[11px] font-mono text-[#1B4D3E] hover:underline disabled:opacity-40"
                >
                  {isPreviewLoading ? 'Analyzing...' : 'Test AI Listener'}
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleRunListenerCheck}
                placeholder="e.g. Deep pothole damaging tires on 4th and Main"
                className="mt-1 w-full rounded-md border border-[#D6D3CB] bg-white px-3.5 py-2 text-xs text-[#191C1B] placeholder-[#858A85] focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-xs font-semibold text-[#191C1B] mb-1.5">
                Civic Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.label;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setCategory(cat.label)}
                      className={`flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-colors ${
                        isSelected
                          ? 'border-[#1B4D3E] bg-[#E8EFEA] text-[#1B4D3E] font-semibold'
                          : 'border-[#D6D3CB] bg-white text-[#444845] hover:bg-[#F5F3EC]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#191C1B]">
                Detailed Physical Description &amp; Severity Clues *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleRunListenerCheck}
                placeholder="Describe size, depth, traffic risk, pedestrian impact, and whether situation is worsening..."
                className="mt-1 w-full rounded-md border border-[#D6D3CB] bg-white px-3.5 py-2 text-xs text-[#191C1B] placeholder-[#858A85] focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            {/* Location & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191C1B]">
                  Street Address / Intersection *
                </label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#858A85]" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 740 9th Ave outside Hospital"
                    className="w-full rounded-md border border-[#D6D3CB] bg-white pl-9 pr-3 py-2 text-xs text-[#191C1B] placeholder-[#858A85] focus:border-[#1B4D3E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191C1B]">
                  Municipal Ward / Sector *
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#D6D3CB] bg-white px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgency & Photo URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191C1B]">
                  Citizen Self-Reported Urgency
                </label>
                <div className="mt-1 grid grid-cols-4 gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setCitizenUrgency(urg)}
                      className={`py-1.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                        citizenUrgency === urg
                          ? urg === 'EMERGENCY'
                            ? 'bg-[#991B1B] text-white border-[#991B1B]'
                            : urg === 'HIGH'
                            ? 'bg-[#B45309] text-white border-[#B45309]'
                            : urg === 'MEDIUM'
                            ? 'bg-[#D97706] text-white border-[#D97706]'
                            : 'bg-[#525854] text-white border-[#525854]'
                          : 'border-[#D6D3CB] bg-white text-[#706D66] hover:bg-[#F5F3EC]'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191C1B]">
                  Photograph Attachment (URL)
                </label>
                <div className="relative mt-1">
                  <Camera className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#858A85]" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-md border border-[#D6D3CB] bg-white pl-9 pr-3 py-2 text-xs text-[#191C1B] placeholder-[#858A85] focus:border-[#1B4D3E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Real-time AI Listener Card preview */}
            {listenerPreview && (
              <div className="rounded-xl border border-[#1B4D3E]/30 bg-[#F2F7F4] p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#1B4D3E]/20">
                  <span className="font-serif font-bold text-sm text-[#1B4D3E]">
                    Listener Agent Intake Evaluation
                  </span>
                  <span className="font-mono text-[10px] text-[#1B4D3E]">
                    Confidence: {Math.round(listenerPreview.confidenceScore * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#706D66] font-semibold">Standardized Title:</span>
                  <p className="font-semibold text-[#191C1B]">{listenerPreview.normalizedTitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#706D66]">Tags:</span>
                  {listenerPreview.keywords.map((kw, i) => (
                    <span key={i} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#1B4D3E] border border-[#D6D3CB]">
                      #{kw}
                    </span>
                  ))}
                  {listenerPreview.hazardType !== 'none' && (
                    <span className="ml-auto rounded bg-[#FDF2F2] px-2 py-0.5 text-[10px] font-mono font-bold text-[#991B1B] border border-[#F87171]/40">
                      Hazard: {listenerPreview.hazardType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E7E5DF]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#706D66] hover:text-[#191C1B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                <span>Run 4-Agent Pipeline &amp; File</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
