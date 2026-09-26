import React from 'react';
import { CleanupNotification } from '../types';
import { formatBytes } from '../services/storage';
import { AlertTriangle, Trash2, ArrowRight, X } from 'lucide-react';

interface UselessFileNotificationBannerProps {
  notifications: CleanupNotification[];
  onOpenCleaner: () => void;
  onQuickPurge: () => void;
  onDismiss: (id: string) => void;
}

export const UselessFileNotificationBanner: React.FC<UselessFileNotificationBannerProps> = ({
  notifications,
  onOpenCleaner,
  onQuickPurge,
  onDismiss
}) => {
  const activeNotification = notifications.find(n => !n.dismissed);

  if (!activeNotification) return null;

  return (
    <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 sm:px-6 py-3 text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Archon Clutter Notice
              </span>
              <span className="text-xs text-amber-400/60">·</span>
              <span className="text-xs font-mono font-medium text-amber-300">
                {formatBytes(activeNotification.totalSize)} recoverable
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100/90 line-clamp-1 mt-0.5">
              {activeNotification.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={onQuickPurge}
            className="px-3 py-1.5 text-xs font-medium text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            1-Click Clean
          </button>
          
          <button
            onClick={onOpenCleaner}
            className="px-3 py-1.5 text-xs font-medium text-amber-200 hover:text-white bg-amber-900/50 hover:bg-amber-800/60 rounded-lg transition-colors flex items-center gap-1"
          >
            Review Files
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDismiss(activeNotification.id)}
            title="Dismiss alert"
            className="p-1.5 text-amber-400/70 hover:text-amber-200 rounded-lg hover:bg-amber-900/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
