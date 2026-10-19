import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Star,
  Plus,
  Check,
  RotateCcw,
} from 'lucide-react';
import { STORY_CATEGORIES } from '../data/storyStyles.ts';
import { StoryStyleSelection } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext';

interface StoryStyleSelectorProps {
  selection: StoryStyleSelection;
  onChange: (val: StoryStyleSelection) => void;
}

export const StoryStyleSelector: React.FC<StoryStyleSelectorProps> = ({
  selection,
  onChange,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'mature-sensual': true,
    'cinematic-film': false,
  });

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSelectPrimary = (item: string) => {
    if (selection.primary === item) {
      onChange({
        ...selection,
        primary: null,
      });
    } else {
      const nextSupporting = selection.supporting.filter((s) => s !== item);
      onChange({
        ...selection,
        primary: item,
        supporting: nextSupporting,
      });
    }
  };

  const handleToggleSupporting = (item: string) => {
    if (selection.primary === item) return;

    if (selection.supporting.includes(item)) {
      onChange({
        ...selection,
        supporting: selection.supporting.filter((s) => s !== item),
      });
    } else {
      if (selection.supporting.length >= 2) {
        return;
      }
      onChange({
        ...selection,
        supporting: [...selection.supporting, item],
      });
    }
  };

  const handleClearAll = () => {
    onChange({
      primary: null,
      supporting: [],
      custom: '',
    });
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return STORY_CATEGORIES;
    const query = searchQuery.toLowerCase();

    return STORY_CATEGORIES.map((cat) => {
      const matchCat = cat.name.toLowerCase().includes(query);
      const matchItems = cat.items.filter((item) =>
        item.toLowerCase().includes(query)
      );

      if (matchCat) return cat;
      if (matchItems.length > 0) {
        return {
          ...cat,
          items: matchItems,
        };
      }
      return null;
    }).filter(Boolean) as typeof STORY_CATEGORIES;
  }, [searchQuery]);

  const hasSelections =
    selection.primary !== null ||
    selection.supporting.length > 0 ||
    selection.custom.trim().length > 0;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            {t.storyStyleTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.storyStyleSubtitle}
          </p>
        </div>

        {hasSelections && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            {t.clearStyles}
          </button>
        )}
      </div>

      {/* Active Selections Bar */}
      {hasSelections && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">{t.activeStylesLabel}</span>

          {/* Primary */}
          {selection.primary && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{t.primaryPrefix}: {selection.primary}</span>
              <button
                onClick={() => handleSelectPrimary(selection.primary!)}
                className="hover:text-white ml-0.5"
                title={t.unsetPrimaryTooltip}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Supporting */}
          {selection.supporting.map((sup) => (
            <span
              key={sup}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>{t.supportingPrefix}: {sup}</span>
              <button
                onClick={() => handleToggleSupporting(sup)}
                className="hover:text-white ml-0.5"
                title={t.removeSupportingTooltip}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Custom */}
          {selection.custom.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-950/30 text-purple-300 border border-purple-800/40">
              <span>{t.customPrefix}: {selection.custom}</span>
              <button
                onClick={() => onChange({ ...selection, custom: '' })}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search & Custom Input Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchStoryPlaceholder}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Custom Style Input */}
        <div>
          <input
            type="text"
            value={selection.custom}
            onChange={(e) => onChange({ ...selection, custom: e.target.value })}
            placeholder={t.customStoryPlaceholder}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
          />
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredCategories.map((category) => {
          const isOpen = Boolean(openCategories[category.id] || searchQuery.trim().length > 0);

          const selectedInCat = category.items.filter(
            (i) => i === selection.primary || selection.supporting.includes(i)
          ).length;

          return (
            <div
              key={category.id}
              className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-200">{category.name}</span>
                  {selectedInCat > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedInCat}
                    </span>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-1 border-t border-slate-800/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {category.items.map((item) => {
                    const isPrimary = selection.primary === item;
                    const isSupporting = selection.supporting.includes(item);
                    const canSupport = !isPrimary && selection.supporting.length < 2;

                    return (
                      <div
                        key={item}
                        className={`group p-2 rounded-lg border text-xs flex items-center justify-between transition ${
                          isPrimary
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : isSupporting
                            ? 'bg-cyan-950/20 border-cyan-700/50 text-cyan-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-medium truncate mr-1.5">{item}</span>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Set Primary Button */}
                          <button
                            type="button"
                            onClick={() => handleSelectPrimary(item)}
                            title={isPrimary ? t.unsetPrimaryTooltip : t.setPrimaryTooltip}
                            className={`p-1 rounded transition ${
                              isPrimary
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isPrimary ? 'fill-current' : ''}`} />
                          </button>

                          {/* Set Supporting Button */}
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleToggleSupporting(item)}
                              disabled={!isSupporting && !canSupport}
                              title={
                                isSupporting
                                  ? t.removeSupportingTooltip
                                  : canSupport
                                  ? t.addSupportingTooltip
                                  : t.supportingLimitReached
                              }
                              className={`p-1 rounded transition ${
                                isSupporting
                                  ? 'bg-cyan-600 text-white font-bold'
                                  : canSupport
                                  ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                                  : 'text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              {isSupporting ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
