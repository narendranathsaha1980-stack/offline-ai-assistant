import React, { useState } from 'react';
import { StoredFile, CleanupNotification, JunkReason } from '../types';
import { db, formatBytes } from '../services/storage';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  FileWarning, 
  Clock, 
  HardDrive, 
  Sparkles, 
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';

interface UselessFileCleanerProps {
  files: StoredFile[];
  notifications: CleanupNotification[];
  onRefresh: () => void;
  onPreviewFile: (file: StoredFile) => void;
  onDeleteFile: (id: string) => void;
}

export const UselessFileCleaner: React.FC<UselessFileCleanerProps> = ({
  files,
  notifications,
  onRefresh,
  onPreviewFile,
  onDeleteFile
}) => {
  const [purgedFeedback, setPurgedFeedback] = useState<{ count: number; bytes: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const junkFiles = files.filter(f => f.isJunk);
  const totalJunkBytes = junkFiles.reduce((acc, f) => acc + f.size, 0);

  // Group by junk reason
  const duplicates = junkFiles.filter(f => f.junkReason === 'duplicate');
  const crashLogs = junkFiles.filter(f => f.junkReason === 'obsolete_log');
  const tempScratch = junkFiles.filter(f => f.junkReason === 'temp_scratch' || f.junkReason === 'old_cache');
  const staleDownloads = junkFiles.filter(f => f.junkReason === 'stale_download');
  const emptyFiles = junkFiles.filter(f => f.junkReason === 'empty_file');

  const handlePurgeAll = () => {
    const result = db.batchDeleteJunkFiles();
    setPurgedFeedback({ count: result.count, bytes: result.bytesFreed });
    setTimeout(() => setPurgedFeedback(null), 4000);
    onRefresh();
  };

  const handleManualScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onRefresh();
    }, 600);
  };

  const getReasonLabel = (reason?: JunkReason) => {
    switch (reason) {
      case 'duplicate': return 'Identical Duplicate File';
      case 'obsolete_log': return 'Obsolete Crash Log';
      case 'temp_scratch': return 'Orphaned Temp Cache';
      case 'stale_download': return 'Stale Download Archive';
      case 'empty_file': return 'Zero-Byte Empty File';
      default: return 'Useless Clutter';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Useless File Delete & Clutter Manager</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="text-amber-400 font-mono tabular-nums">{junkFiles.length} Useless Items Flagged</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatBytes(totalJunkBytes)} Recoverable Storage</span>
            <span aria-hidden="true">·</span>
            <span>Real-time local deletion alerts</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualScan}
            disabled={isScanning}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Workspace
          </button>

          <button
            onClick={handlePurgeAll}
            disabled={junkFiles.length === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              junkFiles.length > 0
                ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Purge All Useless Files ({formatBytes(totalJunkBytes)})
          </button>
        </div>
      </div>

      {/* Purge Success Banner */}
      {purgedFeedback && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-100">Space Successfully Recovered!</p>
            <p className="text-xs text-emerald-300/80">
              Permanently removed {purgedFeedback.count} useless files and freed up {formatBytes(purgedFeedback.bytes)} of local storage.
            </p>
          </div>
        </div>
      )}

      {/* Clutter Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Duplicates</span>
          <span className="text-base font-semibold font-mono tabular-nums text-slate-200">{duplicates.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
            {formatBytes(duplicates.reduce((a, b) => a + b.size, 0))}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Crash Logs</span>
          <span className="text-base font-semibold font-mono tabular-nums text-slate-200">{crashLogs.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
            {formatBytes(crashLogs.reduce((a, b) => a + b.size, 0))}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Temp Buffers</span>
          <span className="text-base font-semibold font-mono tabular-nums text-slate-200">{tempScratch.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
            {formatBytes(tempScratch.reduce((a, b) => a + b.size, 0))}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Stale Downloads</span>
          <span className="text-base font-semibold font-mono tabular-nums text-slate-200">{staleDownloads.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
            {formatBytes(staleDownloads.reduce((a, b) => a + b.size, 0))}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 block mb-1">Empty Files</span>
          <span className="text-base font-semibold font-mono tabular-nums text-slate-200">{emptyFiles.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">0-byte orphans</span>
        </div>
      </div>

      {/* Notifications History Panel */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Active Clutter Alerts & Notification Log
          </h2>

          <div className="space-y-2">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{notif.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      Detected: {new Date(notif.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!notif.dismissed && (
                  <button
                    onClick={handlePurgeAll}
                    className="px-3 py-1.5 text-xs font-medium text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shrink-0"
                  >
                    Clean Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Junk Files Inspection Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Useless Files Awaiting Deletion ({junkFiles.length})
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {junkFiles.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-slate-200">Your workspace is clean!</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No useless, duplicate, or stale temporary files were found. Archon will alert you when clutter accumulates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 select-none">
                  <tr>
                    <th className="py-3 px-4 font-medium">Useless File & Path</th>
                    <th className="py-3 px-4 font-medium">Deletion Reason</th>
                    <th className="py-3 px-4 font-medium text-right">Size</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {junkFiles.map(file => (
                    <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                            <FileWarning className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => onPreviewFile(file)}
                              className="font-medium text-slate-200 hover:text-white truncate block text-left"
                            >
                              {file.name}
                            </button>
                            <span className="text-[11px] font-mono text-slate-400 truncate block">
                              {file.currentPath}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs text-rose-300 font-medium">
                          {getReasonLabel(file.junkReason)}
                        </span>
                        {file.duplicateOfId && (
                          <span className="text-[11px] text-slate-400 block font-mono">
                            Clone of primary file #{file.duplicateOfId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {formatBytes(file.size)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPreviewFile(file)}
                            title="Preview file"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file.id)}
                            title="Delete this file"
                            className="px-2.5 py-1 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
