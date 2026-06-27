"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    domain: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFormData({ name: "", email: "", phone: "", domain: "", message: "" });
    setSubmitted(false);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.submitContact(formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
      style={{ animationDuration: "0.2s" }}
    >
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-ink-900 to-ink-950 border border-white/10 rounded-3xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] p-8 sm:p-10 relative overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ animationDuration: "0.4s" }}
      >
        {/* Ambient glow inside modal */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/0 hover:bg-white/5 text-white/40 hover:text-white transition-all duration-200"
          title="Close modal"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Request Received</h3>
            <p className="text-white/50 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
              Thank you for reaching out! Our team will get back to you shortly at <span className="text-white font-medium">{formData.email}</span>.
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition duration-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Hire our Team</h2>
            <p className="text-white/50 mb-8 text-sm leading-relaxed">
              Ready to dominate AI answer engines? Tell us about your brand and we'll be in touch. Or email us directly at <a href="mailto:info@dialforit.com" className="text-brand-400 hover:text-brand-300 font-medium underline transition-colors">info@dialforit.com</a>.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Company Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  placeholder="company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                  Message / Context
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 resize-none"
                  placeholder="Tell us about your goals, key competitors, or project context..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-400 hover:to-sky-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </span>
                ) : (
                  "Submit Request"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
