const ENGINES = [
  "ChatGPT",
  "GPT Search",
  "Gemini",
  "Claude",
  "Perplexity",
  "Copilot",
  "Grok",
  "DeepSeek",
  "Meta AI",
  "Mistral",
];

export function EngineMarquee() {
  const row = [...ENGINES, ...ENGINES];
  return (
    <div className="marquee-mask relative overflow-hidden py-2">
      <div className="flex w-max animate-marquee gap-10">
        {row.map((name, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-white/40"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400/70" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
