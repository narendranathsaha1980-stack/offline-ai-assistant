import React from 'react';
import { StoredFile } from '../types';
import { formatBytes } from '../services/storage';
import { X, FileText, Trash2, FolderInput, Tag, Calendar, HardDrive, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FilePreviewModalProps {
  file: StoredFile | null;
  onClose: () => void;
  onOrganize: (file: StoredFile) => void;
  onDelete: (id: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onOrganize,
  onDelete
}) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white truncate">{file.name}</h3>
              <p className="text-xs text-slate-400 font-mono truncate">{file.currentPath}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Junk Alert if junk */}
          {file.isJunk && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Flagged as Useless Clutter</p>
                <p className="text-xs text-rose-300/90 mt-1">
                  Reason: <span className="font-mono">{file.junkReason?.replace('_', ' ')}</span>. Deleting this file will reclaim {formatBytes(file.size)}.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">File Size</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-slate-200">{formatBytes(file.size)}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Category</span>
              <span className="text-sm font-semibold text-slate-200 capitalize">{file.category}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Status</span>
              <span className="text-sm font-semibold text-slate-200">
                {file.isOrganized ? 'Organized' : 'Loose File'}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Access Count</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-slate-200">{file.accessCount} times</span>
            </div>
          </div>

          {/* Suggested Routing */}
          {!file.isJunk && !file.isOrganized && (
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/30 rounded-lg flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-cyan-400 block mb-0.5">Learned Route Suggestion</span>
                <span className="text-xs font-mono text-cyan-200 truncate block">{file.suggestedOrganizedPath}</span>
              </div>
              <button
                onClick={() => {
                  onOrganize(file);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors shrink-0 flex items-center gap-1.5"
              >
                <FolderInput className="w-3.5 h-3.5" />
                Move to Folder
              </button>
            </div>
          )}

          {/* Text Content / Preview */}
          <div>
            <span className="text-xs font-medium text-slate-400 mb-2 block">Content Index Preview</span>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
              {file.textContent || file.contentPreview || '(No text content indexed for this file)'}
            </div>
          </div>

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-400 mb-2 block">Indexed Semantic Tags</span>
              <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
                {file.tags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-800/70 border border-slate-700/50 px-2 py-0.5 rounded text-slate-300 font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={() => {
              onDelete(file.id);
              onClose();
            }}
            className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete File
          </button>

          <div className="flex items-center gap-2">
            {!file.isOrganized && !file.isJunk && (
              <button
                onClick={() => {
                  onOrganize(file);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FolderInput className="w-4 h-4" />
                Apply Route
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
