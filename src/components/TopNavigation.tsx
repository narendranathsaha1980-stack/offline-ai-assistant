import React from 'react';
import { ActiveTab } from '../types';
import { ShieldCheck, HardDrive, Bell } from 'lucide-react';

interface TopNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  junkCount: number;
  junkTotalSize: number;
  isHybridActive: boolean;
  onToggleHybrid: () => void;
  onOpenCleaner: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onTabChange,
  junkCount,
  isHybridActive,
  onToggleHybrid,
  onOpenCleaner
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onTabChange('organizer'); }}
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          Archon
        </a>
      </div>

      {/* Zone 2: Clean text navigation tabs (Interactive Filter Controls) */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => onTabChange('organizer')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'organizer' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          File Organizer
        </button>

        <button
          onClick={() => onTabChange('daily_work')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'daily_work' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Daily Work Hub
        </button>

        <button
          onClick={() => onTabChange('assistant')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'assistant' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Archon AI Assistant
        </button>

        <button
          onClick={() => onTabChange('cleaner')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'cleaner' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Useless Cleaner
          {junkCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => onTabChange('learned')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'learned' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Learned Memory
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        {/* Offline Sandbox indicator button */}
        <div 
          title="All files and reasoning stay 100% on your device in browser sandbox"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg cursor-default select-none"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Offline Sandbox</span>
        </div>

        {/* Clutter Alert quick bell */}
        {junkCount > 0 && (
          <button
            onClick={onOpenCleaner}
            title={`${junkCount} useless files detected`}
            className="relative p-2 text-slate-300 hover:text-amber-300 hover:bg-slate-900 rounded-lg transition-colors border border-slate-800"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
          </button>
        )}
      </div>
    </header>
  );
};
