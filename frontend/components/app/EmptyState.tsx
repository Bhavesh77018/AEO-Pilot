"use client";

interface EmptyStateProps {
  userEmail: string | null;
  onNewProject: () => void;
}

export function EmptyState({ userEmail, onNewProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen -mt-16">
      <div className="text-center max-w-2xl">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-4xl font-black tracking-tight mb-3">
          Make your startup{" "}
          <span className="gradient-text">discoverable by AI</span>
        </h1>
        <p className="text-lg text-white/60 mb-8">
          Start by adding your domain. AEO Pilot will analyze your website,
          score your AI readiness across 8 categories, and show you exactly
          what to fix to get mentioned in ChatGPT, Gemini, Claude & Perplexity.
        </p>

        {!userEmail ? (
          <div className="space-y-4">
            <p className="text-white/50 mb-6">
              Sign in to create your first project
            </p>
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white hover:bg-brand-400 transition shadow-xl shadow-brand-600/30"
            >
              Get Started
              <span>→</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onNewProject}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white hover:bg-brand-400 transition shadow-xl shadow-brand-600/30"
          >
            <span>+</span>
            Add Your First Project
          </button>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-left text-sm">
          <div>
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-white mb-1">Crawl & Score</h3>
            <p className="text-white/50">
              Analyze your site's AI readiness across 8 categories
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white mb-1">Monitor</h3>
            <p className="text-white/50">
              Track visibility across ChatGPT, Gemini, Claude & more
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">💡</div>
            <h3 className="font-semibold text-white mb-1">Optimize</h3>
            <p className="text-white/50">
              Get AI-powered recommendations to boost your presence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
