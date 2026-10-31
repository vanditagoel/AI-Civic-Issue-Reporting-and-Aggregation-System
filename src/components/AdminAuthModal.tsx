import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAsAdmin: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginAsAdmin,
}) => {
  const [email, setEmail] = useState('admin.dispatch@civiclens.gov');
  const [passkey, setPasskey] = useState('director2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !passkey) {
      setError('Please provide municipal officer email and passkey.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginAsAdmin();
      onClose();
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginAsAdmin();
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191C1B]/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#D6D3CB] bg-[#FAF9F5] shadow-2xl p-6 sm:p-8 text-[#191C1B] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E7E5DF]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4D3E]/10 border border-[#1B4D3E]/30 text-[#1B4D3E]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#1B4D3E] font-semibold block">
                Municipal Operations Gateway
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#191C1B]">
                Officer &amp; Admin Sign In
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#706D66] hover:text-[#191C1B] hover:bg-[#EFECE4] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 text-xs">
          <p className="text-[#525854] leading-relaxed">
            This area is designated for municipal staff, city engineers, and public works dispatchers to manage work dockets, review borderline clusters, and deploy crews.
          </p>

          {/* 1-Click Demo Login Box */}
          <div className="p-4 rounded-xl border border-[#1B4D3E]/30 bg-[#F2F7F4] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-[#1B4D3E]">
                1-Click Verified Officer Login
              </span>
              <span className="font-mono text-[10px] text-[#1B4D3E] bg-white px-2 py-0.5 rounded border border-[#1B4D3E]/20">
                Demo Ready
              </span>
            </div>
            <p className="text-[11px] text-[#444845] leading-relaxed">
              Sign in immediately as <strong>Director Marcus Vance</strong> (City Works Dispatch &amp; Operations Command) with full administrative triage privileges.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-[#1B4D3E] hover:bg-[#133E32] py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Director Marcus Vance'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E7E5DF] w-full" />
            <span className="bg-[#FAF9F5] px-3 text-[10px] font-mono uppercase text-[#706D66] absolute">
              or enter officer credentials
            </span>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {error && (
              <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171]/40 text-[#991B1B] text-[11px] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#191C1B] mb-1">
                Municipal Officer Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer.dispatch@civiclens.gov"
                className="w-full rounded-md border border-[#D6D3CB] bg-white px-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#191C1B] mb-1">
                Access Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#858A85]" />
                <input
                  type="password"
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-md border border-[#D6D3CB] bg-white pl-9 pr-3 py-2 text-xs text-[#191C1B] focus:border-[#1B4D3E] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-md border border-[#D6D3CB] bg-[#F5F3EC] hover:bg-[#EAE6DC] text-[#191C1B] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#1B4D3E]" />
              <span>Authenticate Credentials</span>
            </button>
          </form>

          {/* Capabilities Summary */}
          <div className="pt-3 border-t border-[#E7E5DF] text-[11px] text-[#706D66] space-y-1">
            <span className="font-semibold text-[#191C1B] block">Administrative Privileges Included:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[#525854]">
              <li>Triage Desk for borderline recurrence clusters</li>
              <li>Reassign municipal departments &amp; dispatch field work crews</li>
              <li>Operational ticket status updates (In Progress, Resolved, Closed)</li>
              <li>Live 4-agent Gemini telemetry logs and prompt sandbox</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
