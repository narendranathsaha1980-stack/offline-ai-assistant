import React, { useState, useEffect } from 'react';
import { StoredFile, WorkTask, DailyNote, LearnedPattern, AssistantMessage, CleanupNotification, ActiveTab } from './types';
import { db, formatBytes } from './services/storage';
import { LocalIntelligenceEngine } from './services/localIntelligence';
import { AssistantService } from './services/geminiService';
import { TopNavigation } from './components/TopNavigation';
import { UselessFileNotificationBanner } from './components/UselessFileNotificationBanner';
import { FileOrganizer } from './components/FileOrganizer';
import { DailyWorkHub } from './components/DailyWorkHub';
import { AssistantChat } from './components/AssistantChat';
import { UselessFileCleaner } from './components/UselessFileCleaner';
import { LearnedMemory } from './components/LearnedMemory';
import { FilePreviewModal } from './components/FilePreviewModal';
import { Bot, Sparkles, FolderInput, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('organizer');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [notifications, setNotifications] = useState<CleanupNotification[]>([]);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isHybridActive, setIsHybridActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setFiles(db.getFiles());
    setTasks(db.getTasks());
    setNotes(db.getNotes());
    setPatterns(db.getPatterns());
    setMessages(db.getMessages());
    setNotifications(db.getNotifications());
  };

  useEffect(() => {
    const initApp = async () => {
      await db.init();
      loadData();
      setIsReady(true);
    };
    initApp();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handlePreviewFile = (file: StoredFile) => {
    setPreviewFile(file);
  };

  const handleDeleteFile = (id: string) => {
    db.deleteFile(id);
    handleRefresh();
    showToast('File removed from workspace');
  };

  const handleOrganizeFile = (file: StoredFile) => {
    if (file.suggestedOrganizedPath) {
      db.updateFile(file.id, {
        currentPath: file.suggestedOrganizedPath,
        isOrganized: true
      });
      LocalIntelligenceEngine.learnFromFiles();
      handleRefresh();
      showToast(`Routed to ${file.suggestedOrganizedPath}`);
    }
  };

  const handleQuickPurge = () => {
    const result = db.batchDeleteJunkFiles();
    handleRefresh();
    showToast(`Purged ${result.count} useless files, reclaimed ${formatBytes(result.bytesFreed)}!`);
  };

  const handleDismissNotification = (id: string) => {
    db.dismissNotification(id);
    handleRefresh();
  };

  const handleToggleHybrid = () => {
    const next = !isHybridActive;
    setIsHybridActive(next);
    AssistantService.setHybridEnabled(next);
    showToast(next ? 'Hybrid AI mode enabled' : '100% Strict Offline mode active');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Initializing Archon Local Sandbox...</p>
        </div>
      </div>
    );
  }

  const junkFiles = files.filter(f => f.isJunk);
  const totalJunkBytes = junkFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        junkCount={junkFiles.length}
        junkTotalSize={totalJunkBytes}
        isHybridActive={isHybridActive}
        onToggleHybrid={handleToggleHybrid}
        onOpenCleaner={() => setActiveTab('cleaner')}
      />

      {/* Proactive Useless File Cleanup Notification Banner */}
      <UselessFileNotificationBanner
        notifications={notifications}
        onOpenCleaner={() => setActiveTab('cleaner')}
        onQuickPurge={handleQuickPurge}
        onDismiss={handleDismissNotification}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'organizer' && (
          <FileOrganizer
            files={files}
            onRefresh={handleRefresh}
            onPreviewFile={handlePreviewFile}
            onDeleteFile={handleDeleteFile}
            onOrganizeFile={handleOrganizeFile}
          />
        )}

        {activeTab === 'daily_work' && (
          <DailyWorkHub
            tasks={tasks}
            notes={notes}
            files={files}
            onRefresh={handleRefresh}
            onPreviewFile={handlePreviewFile}
          />
        )}

        {activeTab === 'assistant' && (
          <AssistantChat
            messages={messages}
            files={files}
            onRefresh={handleRefresh}
            onPreviewFile={handlePreviewFile}
            onTriggerClean={handleQuickPurge}
            onTriggerOrganize={() => {
              db.batchOrganizeLooseFiles();
              handleRefresh();
              showToast('Auto-organized loose files');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'cleaner' && (
          <UselessFileCleaner
            files={files}
            notifications={notifications}
            onRefresh={handleRefresh}
            onPreviewFile={handlePreviewFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {activeTab === 'learned' && (
          <LearnedMemory
            patterns={patterns}
            files={files}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      {/* Floating Quick Ask Archon Button (visible when not on assistant tab) */}
      {activeTab !== 'assistant' && (
        <button
          onClick={() => setActiveTab('assistant')}
          className="fixed bottom-6 right-6 z-30 px-3.5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl hover:shadow-cyan-500/20 transition-all flex items-center gap-2 group text-xs font-semibold"
        >
          <Bot className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>Ask Archon</span>
        </button>
      )}

      {/* File Detail / Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onOrganize={handleOrganizeFile}
        onDelete={handleDeleteFile}
      />

      {/* Transient Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
