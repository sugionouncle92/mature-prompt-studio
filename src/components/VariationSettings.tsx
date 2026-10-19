import React from 'react';
import { Layers, Sliders } from 'lucide-react';
import { VariationConfig, VariationPreset } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext';

interface VariationSettingsProps {
  config: VariationConfig;
  onChange: (val: VariationConfig) => void;
}

export const VariationSettings: React.FC<VariationSettingsProps> = ({
  config,
  onChange,
}) => {
  const { t } = useLanguage();
  const presets: VariationPreset[] = [1, 3, 5, 10];
  const MAX_CUSTOM = 15;

  const handlePresetSelect = (p: VariationPreset) => {
    onChange({
      ...config,
      preset: p,
    });
  };

  const handleCustomCountChange = (val: number) => {
    const clamped = Math.max(1, Math.min(MAX_CUSTOM, isNaN(val) ? 1 : val));
    onChange({
      preset: 'custom',
      customCount: clamped,
    });
  };

  const activeCount = config.preset === 'custom' ? config.customCount : config.preset;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            {t.variationTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.variationSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400">{t.targetPromptsLabel}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
            {activeCount} {activeCount === 1 ? t.promptsUnitSingular : t.promptsUnitPlural}
          </span>
        </div>
      </div>

      {/* Preset Buttons & Custom Input */}
      <div className="flex flex-wrap items-center gap-2.5">
        {presets.map((num) => {
          const isSelected = config.preset === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => handlePresetSelect(num)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-950/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {num} {num === 1 ? t.variationUnitSingular : t.variationUnitPlural}
            </button>
          );
        })}

        {/* Custom Input */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${
            config.preset === 'custom'
              ? 'bg-amber-500/10 border-amber-500/60 text-amber-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium">{t.customLabel}</span>
          <input
            type="number"
            min={1}
            max={MAX_CUSTOM}
            value={config.preset === 'custom' ? config.customCount : ''}
            placeholder="1-15"
            onFocus={() => handlePresetSelect('custom')}
            onChange={(e) => handleCustomCountChange(parseInt(e.target.value, 10))}
            className="w-16 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2 py-1 text-xs text-white outline-none font-mono"
          />
          <span className="text-[11px] text-slate-500">({t.maxLabel} {MAX_CUSTOM})</span>
        </div>
      </div>
    </section>
  );
};
