import React from 'react';
import { Lock, ShieldCheck, UserCheck, Check } from 'lucide-react';
import { CharacterLocksState } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext';

interface CharacterLocksProps {
  locks: CharacterLocksState;
  onChange: (val: CharacterLocksState) => void;
}

interface LockMeta {
  key: keyof CharacterLocksState;
  tag: string;
  name: string;
}

const LOCKS_CONFIG: LockMeta[] = [
  {
    key: 'facelock',
    tag: '/facelock 100%',
    name: 'Face Lock',
  },
  {
    key: 'bodyshape',
    tag: '/bodyshape lock',
    name: 'Body Shape Lock',
  },
  {
    key: 'outfitlock',
    tag: '/outfitlock',
    name: 'Outfit Lock',
  },
  {
    key: 'poselock',
    tag: '/poselock',
    name: 'Pose Lock',
  },
  {
    key: 'agepreserve',
    tag: '/agepreserve',
    name: 'Age Preserve',
  },
  {
    key: 'expressionlock',
    tag: '/expressionlock',
    name: 'Expression Lock',
  },
  {
    key: 'hairlock',
    tag: '/hairlock',
    name: 'Hair Lock',
  },
];

export const CharacterLocks: React.FC<CharacterLocksProps> = ({ locks, onChange }) => {
  const { t } = useLanguage();

  const toggleLock = (key: keyof CharacterLocksState) => {
    onChange({
      ...locks,
      [key]: !locks[key],
    });
  };

  const setAll = (val: boolean) => {
    onChange({
      facelock: val,
      bodyshape: val,
      outfitlock: val,
      poselock: val,
      agepreserve: val,
      expressionlock: val,
      hairlock: val,
    });
  };

  const activeCount = Object.values(locks).filter(Boolean).length;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              {t.characterLocksTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {activeCount} {t.activeLocksCount}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.characterLocksSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            {t.lockAll}
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition"
          >
            {t.unlockAll}
          </button>
        </div>
      </div>

      {/* Locks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {LOCKS_CONFIG.map((item) => {
          const isActive = locks[item.key];
          const description = t.locksDesc[item.key];

          return (
            <div
              key={item.key}
              onClick={() => toggleLock(item.key)}
              className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                isActive
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-sm shadow-rose-950/20'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-amber-300 tracking-tight">
                    {item.tag}
                  </span>
                  {/* Switch Pill */}
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center ${
                      isActive ? 'bg-rose-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-[10px] ${
                        isActive ? 'translate-x-4 text-rose-600' : 'translate-x-0 text-slate-400'
                      }`}
                    >
                      {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  {item.key === 'agepreserve' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{item.name}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
