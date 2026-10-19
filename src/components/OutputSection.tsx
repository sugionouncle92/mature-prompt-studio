import React, { useState } from 'react';
import { Copy, Check, Sparkles, Trash2, CheckCheck } from 'lucide-react';
import { PromptResult } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext';

interface OutputSectionProps {
  results: PromptResult[];
  isLoading: boolean;
  onClearResults: () => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  results,
  isLoading,
  onClearResults,
}) => {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopySingle = async (item: PromptResult) => {
    try {
      // Strictly copy English prompt text only, no titles, labels, or commentary
      await navigator.clipboard.writeText(item.prompt);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleCopyAll = async () => {
    try {
      // Only English prompt bodies separated by double newlines, no UI labels
      const allText = results.map((r) => r.prompt.trim()).join('\n\n');
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  if (isLoading) {
    return (
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto animate-spin">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">{t.loadingTitle}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t.loadingDesc}
          </p>
        </div>
      </section>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t.resultsTitle} ({results.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.resultsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {results.length > 1 && (
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition"
              title={t.copyAllBtn}
            >
              {copiedAll ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.allCopiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyAllBtn}</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClearResults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            title={t.clearResultsBtn}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearResultsBtn}</span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {results.map((item) => {
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {t.variationCardLabel} {item.index}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.prompt.length} {t.charsCount}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopySingle(item)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isCopied
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={t.copyPromptBtn}
                >
                  {isCopied ? (
                    <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.copyPromptBtn}</span>
                </>
              )}
                </button>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3.5 border border-slate-800/60 font-sans text-sm text-slate-200 leading-relaxed select-text whitespace-pre-wrap">
                {item.prompt}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
