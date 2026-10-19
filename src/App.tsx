import React, { useState, useEffect } from 'react';
import {
  Wand2,
  AlertCircle,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { StoryStyleSelector } from './components/StoryStyleSelector';
import { PhotographicStyleSelector } from './components/PhotographicStyleSelector';
import { CharacterLocks } from './components/CharacterLocks';
import { VariationSettings } from './components/VariationSettings';
import { OutputSection } from './components/OutputSection';
import { SettingsModal } from './components/SettingsModal';
import {
  StoryStyleSelection,
  PhotographicStyleSelection,
  CharacterLocksState,
  VariationConfig,
  PromptResult,
  ConnectionStatus,
  ApiConfig,
  GenerationInput,
} from './types/index.ts';
import { GeminiService } from './services/geminiService.ts';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const STORAGE_KEY_API = 'mature_prompt_studio_api_key';
const STORAGE_KEY_MODEL = 'mature_prompt_studio_model_id';

const StudioContent: React.FC = () => {
  const { t, language } = useLanguage();

  // Inputs
  const [samplePrompt, setSamplePrompt] = useState('');
  const [keywords, setKeywords] = useState('');

  // Styles
  const [storyStyle, setStoryStyle] = useState<StoryStyleSelection>({
    primary: null,
    supporting: [],
    custom: '',
  });

  const [photographicStyle, setPhotographicStyle] = useState<PhotographicStyleSelection>({
    selected: ['Ultra Realistic'],
    custom: '',
  });

  // Locks (All default to false per spec)
  const [characterLocks, setCharacterLocks] = useState<CharacterLocksState>({
    facelock: false,
    bodyshape: false,
    outfitlock: false,
    poselock: false,
    agepreserve: false,
    expressionlock: false,
    hairlock: false,
  });

  // Variations
  const [variationConfig, setVariationConfig] = useState<VariationConfig>({
    preset: 3,
    customCount: 3,
  });

  // API Config & Status
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiKey: '',
    modelId: 'gemini-2.5-flash',
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Generation & Output State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<PromptResult[]>([]);

  // Load API config from localStorage on init
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_API) || '';
      const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-2.5-flash';
      setApiConfig({ apiKey: savedKey, modelId: savedModel });

      if (savedKey.trim()) {
        setConnectionStatus('connected');
        setStatusMessage(language === 'id' 
          ? `Terkonfigurasi menggunakan ${savedModel}.` 
          : `Configured to use ${savedModel}.`);
      }
    } catch {
      // localStorage may be restricted in some sandboxes
    }
  }, [language]);

  const handleSaveSettings = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_API, newConfig.apiKey);
      localStorage.setItem(STORAGE_KEY_MODEL, newConfig.modelId);
    } catch {
      // fallback
    }
    if (newConfig.apiKey.trim()) {
      setConnectionStatus('connected');
      setStatusMessage(language === 'id'
        ? `Siap. Menggunakan model: ${newConfig.modelId}`
        : `Ready. Using model: ${newConfig.modelId}`);
    } else {
      setConnectionStatus('disconnected');
      setStatusMessage(t.keyRemovedMessage);
    }
  };

  const handleClearApiKey = () => {
    setApiConfig((prev) => ({ ...prev, apiKey: '' }));
    try {
      localStorage.removeItem(STORAGE_KEY_API);
    } catch {
      // ignore
    }
  };

  const handleClearInputs = () => {
    setSamplePrompt('');
    setKeywords('');
    setErrorMessage(null);
  };

  const handleGenerate = async () => {
    setErrorMessage(null);

    // 1. Validation: Both inputs empty
    if (!samplePrompt.trim() && !keywords.trim()) {
      setErrorMessage(t.emptyInputsError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Validation: API Key missing
    if (!apiConfig.apiKey.trim()) {
      setIsSettingsOpen(true);
      setErrorMessage(t.apiKeyMissingError);
      return;
    }

    const targetCount =
      variationConfig.preset === 'custom'
        ? variationConfig.customCount
        : variationConfig.preset;

    const generationInput: GenerationInput = {
      samplePrompt,
      keywords,
      storyStyle,
      photographicStyle,
      characterLocks,
      variationCount: targetCount,
    };

    setIsLoading(true);
    setResults([]);

    try {
      const geminiService = GeminiService.getInstance();
      const generated = await geminiService.generatePrompts(
        apiConfig.apiKey,
        apiConfig.modelId,
        generationInput
      );

      setResults(generated);
      setConnectionStatus('connected');

      // Scroll smoothly to output
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during generation.';
      setErrorMessage(msg);
      if (msg.includes('401') || msg.includes('403') || msg.includes('404')) {
        setConnectionStatus('error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isInputEmpty = !samplePrompt.trim() && !keywords.trim();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Header */}
      <Header
        connectionStatus={connectionStatus}
        modelId={apiConfig.modelId}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-rose-300">{t.validationNoticeTitle}</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-rose-900/40"
            >
              {t.dismissBtn}
            </button>
          </div>
        )}

        {/* 1. Core Scene Inputs */}
        <InputSection
          samplePrompt={samplePrompt}
          keywords={keywords}
          onSamplePromptChange={setSamplePrompt}
          onKeywordsChange={setKeywords}
          onClearInputs={handleClearInputs}
        />

        {/* 2. Story Style Selector */}
        <StoryStyleSelector
          selection={storyStyle}
          onChange={setStoryStyle}
        />

        {/* 3. Photographic Style Selector */}
        <PhotographicStyleSelector
          selection={photographicStyle}
          onChange={setPhotographicStyle}
        />

        {/* 4. Character Locks */}
        <CharacterLocks
          locks={characterLocks}
          onChange={setCharacterLocks}
        />

        {/* 5. Variation Settings */}
        <VariationSettings
          config={variationConfig}
          onChange={setVariationConfig}
        />

        {/* Action Trigger Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>
              {t.adultShieldNotice}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || isInputEmpty}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-lg transition duration-150 ${
              isInputEmpty
                ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                : isLoading
                ? 'bg-amber-600/70 text-slate-200 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-900" />
                <span>{t.generatingBtn}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-slate-950" />
                <span>{t.generateBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* 6. Output Section */}
        <div id="results-section">
          <OutputSection
            results={results}
            isLoading={isLoading}
            onClearResults={() => setResults([])}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {t.footerCopy}</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {t.footerDisclaimer}
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={apiConfig}
        connectionStatus={connectionStatus}
        statusMessage={statusMessage}
        onSave={handleSaveSettings}
        onClearKey={handleClearApiKey}
        onStatusChange={(st, msg) => {
          setConnectionStatus(st);
          setStatusMessage(msg);
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <StudioContent />
    </LanguageProvider>
  );
};
