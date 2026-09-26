import React, { useState } from 'react';
import { LearnedPattern, StoredFile } from '../types';
import { db } from '../services/storage';
import { LocalIntelligenceEngine } from '../services/localIntelligence';
import { 
  Brain, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  FolderSync, 
  Lightbulb,
  Cpu,
  Layers
} from 'lucide-react';

interface LearnedMemoryProps {
  patterns: LearnedPattern[];
  files: StoredFile[];
  onRefresh: () => void;
}

export const LearnedMemory: React.FC<LearnedMemoryProps> = ({
  patterns,
  files,
  onRefresh
}) => {
  const [sweepFeedback, setSweepFeedback] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);

  const rules = patterns.filter(p => p.type === 'rule');
  const entities = patterns.filter(p => p.type === 'entity');
  const habits = patterns.filter(p => p.type === 'habit');

  const handleSweepLearning = () => {
    LocalIntelligenceEngine.learnFromFiles();
    setSweepFeedback(true);
    setTimeout(() => setSweepFeedback(false), 2500);
    onRefresh();
  };

  const handleExportBackup = () => {
    const jsonString = db.exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archon_offline_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const success = db.importData(content);
        if (success) {
          onRefresh();
        } else {
          alert('Invalid backup JSON format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    if (confirm('Reset workspace to initial sample state? This will repopulate initial files, tasks, and notifications.')) {
      db.resetToSample();
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Offline Learned Memory & Knowledge Graph</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="text-cyan-400 font-mono tabular-nums">{patterns.length} Inferred Patterns</span>
            <span aria-hidden="true">·</span>
            <span>100% Local Sandboxed Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Zero Data Leaves Your Device</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSweepLearning}
            className="px-3 py-2 text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5" />
            {sweepFeedback ? 'Learning Refined!' : 'Run Heuristic Sweep'}
          </button>

          <button
            onClick={handleExportBackup}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {exportFeedback ? 'Backup Exported' : 'Export JSON Backup'}
          </button>
        </div>
      </div>

      {/* Privacy & Architecture Guarantee Card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Complete Offline Sovereignty Architecture</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Archon does not stream your personal documents, invoices, or crash logs to third-party cloud servers. 
          All indexing, duplicate detection, automatic routing recommendations, and conversational answers are computed locally in your browser memory and IndexedDB.
        </p>
        <div className="flex items-center gap-4 pt-1 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Local IndexedDB Sandbox
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Client-Side Semantic Search
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            No Cloud Telemetry
          </span>
        </div>
      </div>

      {/* Grid of Learned Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learned Organization Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-cyan-400" />
              Learned File Routing Rules ({rules.length})
            </h2>
            <span className="text-xs text-slate-400">Autonomous</span>
          </div>

          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white">{rule.title}</h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {Math.round(rule.confidence * 100)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rule.description}
                </p>
                {rule.actionRule && (
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                    <div>Target: <span className="text-cyan-300">{rule.actionRule.targetFolder}</span></div>
                    {rule.actionRule.matchKeyword && (
                      <div>Keywords: <span className="text-slate-200">{rule.actionRule.matchKeyword.join(', ')}</span></div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Reinforced: {rule.occurrences} times</span>
                  <span>Updated: {new Date(rule.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discovered Entities & Habits */}
        <div className="space-y-6">
          {/* Discovered Entities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Extracted Entities & Topics ({entities.length})
              </h2>
            </div>

            <div className="space-y-3">
              {entities.map(ent => (
                <div key={ent.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white">{ent.title}</h3>
                    <span className="text-[11px] font-mono text-purple-400">
                      {Math.round(ent.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ent.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Working Habits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Working Rhythm & Clutter Habits ({habits.length})
              </h2>
            </div>

            <div className="space-y-3">
              {habits.map(habit => (
                <div key={habit.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white">{habit.title}</h3>
                    <span className="text-[11px] font-mono text-amber-400">
                      {Math.round(habit.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {habit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Maintenance Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold text-white">Data Portability & State Control</h3>
          <p className="text-xs text-slate-400">
            Import an existing backup JSON file or reset the workspace to initial demonstration state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Import Backup
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              className="hidden" 
            />
          </label>

          <button
            onClick={handleResetSample}
            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </div>
    </div>
  );
};
