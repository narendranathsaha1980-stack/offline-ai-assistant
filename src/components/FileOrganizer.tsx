import React, { useState, useRef } from 'react';
import { StoredFile, FileCategory } from '../types';
import { db, formatBytes } from '../services/storage';
import { LocalIntelligenceEngine } from '../services/localIntelligence';
import { 
  FolderInput, 
  UploadCloud, 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FolderPlus,
  PlusCircle,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon
} from 'lucide-react';

interface FileOrganizerProps {
  files: StoredFile[];
  onRefresh: () => void;
  onPreviewFile: (file: StoredFile) => void;
  onDeleteFile: (id: string) => void;
  onOrganizeFile: (file: StoredFile) => void;
}

export const FileOrganizer: React.FC<FileOrganizerProps> = ({
  files,
  onRefresh,
  onPreviewFile,
  onDeleteFile,
  onOrganizeFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanningDirectory, setIsScanningDirectory] = useState(false);
  const [showAccessHelp, setShowAccessHelp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Native File System Access API (showDirectoryPicker)
  const handleConnectRealDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support the File System Access API (showDirectoryPicker). Please use Chrome, Edge, or Brave, or drag-and-drop your files directly.');
      return;
    }

    try {
      setIsScanningDirectory(true);
      const dirHandle = await (window as any).showDirectoryPicker();
      const existing = db.getFiles();
      let importedCount = 0;

      // Recursive scanner
      async function scanDir(handle: any, currentPath: string) {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const rawFile: File = await entry.getFile();
            // Process file
            let textContent = '';
            if (rawFile.size < 500000 && !rawFile.type.startsWith('image/')) {
              try {
                textContent = await rawFile.text();
              } catch (_) {}
            }

            const evaluated = LocalIntelligenceEngine.evaluateFile(
              rawFile.name,
              rawFile.size,
              textContent,
              existing
            );

            const newStoredFile: StoredFile = {
              id: `real-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: rawFile.name,
              originalPath: `${currentPath}/${rawFile.name}`,
              currentPath: `${currentPath}/${rawFile.name}`,
              category: evaluated.category,
              subcategory: evaluated.subcategory,
              size: rawFile.size,
              extension: rawFile.name.split('.').pop() || '',
              mimeType: rawFile.type || 'application/octet-stream',
              lastModified: new Date(rawFile.lastModified || Date.now()).toISOString(),
              contentPreview: textContent.substring(0, 300) || `${rawFile.name} (${formatBytes(rawFile.size)})`,
              textContent: textContent.substring(0, 5000),
              tags: evaluated.tags,
              isJunk: evaluated.isJunk,
              junkReason: evaluated.junkReason,
              duplicateOfId: evaluated.duplicateOfId,
              suggestedOrganizedPath: evaluated.suggestedPath,
              isOrganized: false,
              accessCount: 1,
              lastAccessedAt: new Date().toISOString()
            };

            db.addFile(newStoredFile);
            importedCount++;
          }
        }
      }

      await scanDir(dirHandle, `/${dirHandle.name}`);
      LocalIntelligenceEngine.learnFromFiles();
      onRefresh();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to open directory:', err);
      }
    } finally {
      setIsScanningDirectory(false);
    }
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.currentPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'loose') return !file.isOrganized && !file.isJunk;
    if (selectedCategory === 'junk') return file.isJunk;
    return file.category === selectedCategory;
  });

  const unorganizedCount = files.filter(f => !f.isOrganized && !f.isJunk).length;
  const junkCount = files.filter(f => f.isJunk).length;
  const organizedCount = files.filter(f => f.isOrganized).length;

  // Batch auto-organize handler
  const handleBatchOrganize = () => {
    const count = db.batchOrganizeLooseFiles();
    LocalIntelligenceEngine.learnFromFiles();
    onRefresh();
  };

  // Real Drag & Drop / File Upload Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processRealFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processRealFiles(Array.from(e.target.files));
    }
  };

  const processRealFiles = (fileList: File[]) => {
    const existing = db.getFiles();

    fileList.forEach(rawFile => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const textContent = typeof event.target?.result === 'string' ? event.target.result : '';
        const evaluated = LocalIntelligenceEngine.evaluateFile(
          rawFile.name,
          rawFile.size,
          textContent,
          existing
        );

        const newStoredFile: StoredFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: rawFile.name,
          originalPath: `/Desktop/${rawFile.name}`,
          currentPath: `/Desktop/${rawFile.name}`,
          category: evaluated.category,
          subcategory: evaluated.subcategory,
          size: rawFile.size,
          extension: rawFile.name.split('.').pop() || '',
          mimeType: rawFile.type || 'application/octet-stream',
          lastModified: new Date(rawFile.lastModified || Date.now()).toISOString(),
          contentPreview: textContent.substring(0, 300) || `${rawFile.name} (${formatBytes(rawFile.size)})`,
          textContent: textContent.substring(0, 5000),
          tags: evaluated.tags,
          isJunk: evaluated.isJunk,
          junkReason: evaluated.junkReason,
          duplicateOfId: evaluated.duplicateOfId,
          suggestedOrganizedPath: evaluated.suggestedPath,
          isOrganized: false,
          accessCount: 1,
          lastAccessedAt: new Date().toISOString()
        };

        db.addFile(newStoredFile);
        LocalIntelligenceEngine.learnFromFiles();
        onRefresh();
      };

      // Read text if small text-like, or read as ArrayBuffer
      if (rawFile.size < 500000 && !rawFile.type.startsWith('image/')) {
        reader.readAsText(rawFile);
      } else {
        const evaluated = LocalIntelligenceEngine.evaluateFile(rawFile.name, rawFile.size, '', existing);
        const newStoredFile: StoredFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: rawFile.name,
          originalPath: `/Desktop/${rawFile.name}`,
          currentPath: `/Desktop/${rawFile.name}`,
          category: evaluated.category,
          subcategory: evaluated.subcategory,
          size: rawFile.size,
          extension: rawFile.name.split('.').pop() || '',
          mimeType: rawFile.type || 'application/octet-stream',
          lastModified: new Date().toISOString(),
          contentPreview: `${rawFile.name} (${formatBytes(rawFile.size)})`,
          textContent: '',
          tags: evaluated.tags,
          isJunk: evaluated.isJunk,
          junkReason: evaluated.junkReason,
          duplicateOfId: evaluated.duplicateOfId,
          suggestedOrganizedPath: evaluated.suggestedPath,
          isOrganized: false,
          accessCount: 1,
          lastAccessedAt: new Date().toISOString()
        };
        db.addFile(newStoredFile);
        LocalIntelligenceEngine.learnFromFiles();
        onRefresh();
      }
    });
  };

  // Add realistic simulated test file
  const handleAddSample = (type: 'invoice' | 'junk_log' | 'spec' | 'duplicate') => {
    const existing = db.getFiles();
    let name = '';
    let size = 0;
    let content = '';

    if (type === 'invoice') {
      const invNum = Math.floor(1000 + Math.random() * 9000);
      name = `Invoice_Consulting_INV-${invNum}.pdf`;
      size = 320000 + Math.floor(Math.random() * 50000);
      content = `Invoice #${invNum} - Amount Due: $4,500.00. Payment terms: Net 30 days. Client: Acme Corporation.`;
    } else if (type === 'junk_log') {
      name = `crash_stacktrace_dump_${Date.now()}.log`;
      size = 28500000;
      content = `[FATAL] Stack memory dump generated. Orphaned log from failed process.`;
    } else if (type === 'spec') {
      name = `Engineering_Sprint_Spec_${Math.floor(Math.random() * 20 + 1)}.md`;
      size = 45000;
      content = `# Architecture Specification\nDeliverables for current sprint. High performance offline indexing and file sorting.`;
    } else if (type === 'duplicate') {
      name = `Invoice_Consulting_INV-8491 (Copy).pdf`;
      size = 480000;
      content = `Duplicate file copy.`;
    }

    const evaluated = LocalIntelligenceEngine.evaluateFile(name, size, content, existing);
    const newFile: StoredFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      originalPath: `/Downloads/${name}`,
      currentPath: `/Downloads/${name}`,
      category: evaluated.category,
      subcategory: evaluated.subcategory,
      size,
      extension: name.split('.').pop() || '',
      mimeType: 'application/octet-stream',
      lastModified: new Date().toISOString(),
      contentPreview: content,
      textContent: content,
      tags: evaluated.tags,
      isJunk: evaluated.isJunk,
      junkReason: evaluated.junkReason,
      duplicateOfId: evaluated.duplicateOfId,
      suggestedOrganizedPath: evaluated.suggestedPath,
      isOrganized: false,
      accessCount: 1,
      lastAccessedAt: new Date().toISOString()
    };

    db.addFile(newFile);
    LocalIntelligenceEngine.learnFromFiles();
    onRefresh();
  };

  const getFileIcon = (ext: string, category: string) => {
    if (category === 'code') return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (category === 'finance') return <FileSpreadsheet className="w-4 h-4 text-cyan-400" />;
    if (category === 'archives') return <FileArchive className="w-4 h-4 text-amber-400" />;
    if (category === 'media') return <ImageIcon className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Automated File Organizer</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{files.length} Total Files</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{organizedCount} Organized</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-mono tabular-nums">{unorganizedCount} Pending Routes</span>
            {junkCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-mono tabular-nums">{junkCount} Useless Items</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real Local Folder Connection via File System Access API */}
          <button
            onClick={handleConnectRealDirectory}
            disabled={isScanningDirectory}
            title="Grant browser read permission to a real folder on your computer (e.g. Downloads, Desktop, Documents)"
            className="px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FolderPlus className={`w-4 h-4 text-cyan-400 ${isScanningDirectory ? 'animate-spin' : ''}`} />
            {isScanningDirectory ? 'Scanning Real Folder...' : 'Connect Real Local Folder'}
          </button>

          {/* Quick Simulate Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-xs text-slate-400 px-2 select-none">Add Sample:</span>
            <button
              onClick={() => handleAddSample('invoice')}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              + Invoice
            </button>
            <button
              onClick={() => handleAddSample('junk_log')}
              className="px-2 py-1 text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded transition-colors"
            >
              + Crash Log
            </button>
            <button
              onClick={() => handleAddSample('spec')}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              + Spec
            </button>
          </div>

          {/* Batch Auto-Organize CTA */}
          <button
            onClick={handleBatchOrganize}
            disabled={unorganizedCount === 0}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              unorganizedCount > 0
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <FolderInput className="w-4 h-4" />
            Auto-Organize Loose Files ({unorganizedCount})
          </button>
        </div>
      </div>

      {/* Explanation Banner: How Files Are Accessed */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            How Archon Accesses Your Files
          </div>
          <button
            onClick={() => setShowAccessHelp(!showAccessHelp)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
          >
            {showAccessHelp ? 'Hide Details' : 'Explain Access Model'}
          </button>
        </div>

        {showAccessHelp ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
              <span className="font-semibold text-cyan-300 block mb-1">1. Native Folder Connection</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Clicking <strong>Connect Real Local Folder</strong> uses the browser's native <code>showDirectoryPicker()</code> API. You choose a local folder (e.g. <code>Downloads</code>), grant read permission, and Archon inspects files directly on your disk.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
              <span className="font-semibold text-cyan-300 block mb-1">2. Drag & Drop / File Picker</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Drag any files or folder from your computer into the drop zone below. The browser reads text and metadata locally via the HTML5 <code>FileReader</code> API.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
              <span className="font-semibold text-emerald-400 block mb-1">3. 100% Offline Sandbox</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                All files, duplicates, crash logs, and learned heuristics are stored strictly inside your browser's private <code>IndexedDB / localStorage</code>. Zero bytes are uploaded to the cloud.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Archon is running inside your browser's secure sandbox. You can connect a real folder on your disk, drag & drop files, or use the pre-loaded sandbox workspace. <strong>No files ever leave your device.</strong>
          </p>
        )}
      </div>

      {/* Drag & Drop Import Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-cyan-500 bg-cyan-950/20' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          onChange={handleFileInputChange} 
          className="hidden" 
        />
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300 mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Drop files or click to add into offline workspace
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Archon automatically indexes content, applies learned categorization rules, and alerts if duplicates or crash logs are detected.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files by name, path, tag..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({files.length})
          </button>
          <button
            onClick={() => setSelectedCategory('loose')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'loose' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Loose ({unorganizedCount})
          </button>
          <button
            onClick={() => setSelectedCategory('finance')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'finance' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Finance
          </button>
          <button
            onClick={() => setSelectedCategory('documents')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'documents' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setSelectedCategory('code')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setSelectedCategory('junk')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'junk' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Junk ({junkCount})
          </button>
        </div>
      </div>

      {/* Files Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No files found matching the criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 select-none">
                <tr>
                  <th className="py-3 px-4 font-medium">Name & Path</th>
                  <th className="py-3 px-4 font-medium">Category / Route</th>
                  <th className="py-3 px-4 font-medium text-right">Size</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFiles.map((file) => {
                  return (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        file.isJunk ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Name & Path */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                            {getFileIcon(file.extension, file.category)}
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

                      {/* Category & Route */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="capitalize text-slate-300 font-medium">
                            {file.category}
                          </span>
                          {!file.isOrganized && !file.isJunk && (
                            <span className="text-[11px] font-mono text-cyan-400 truncate max-w-xs block">
                              ➔ {file.suggestedOrganizedPath}
                            </span>
                          )}
                          {file.isJunk && (
                            <span className="text-[11px] text-rose-400 font-medium">
                              Flagged: {file.junkReason?.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {formatBytes(file.size)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {file.isJunk ? (
                          <span className="text-amber-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Useless Item
                          </span>
                        ) : file.isOrganized ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Organized
                          </span>
                        ) : (
                          <span className="text-cyan-400 text-xs">
                            Loose
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPreviewFile(file)}
                            title="Preview file content & metadata"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!file.isOrganized && !file.isJunk && (
                            <button
                              onClick={() => onOrganizeFile(file)}
                              title="Apply suggested route"
                              className="px-2.5 py-1 text-xs font-medium text-white bg-cyan-700 hover:bg-cyan-600 rounded transition-colors flex items-center gap-1"
                            >
                              <FolderInput className="w-3.5 h-3.5" />
                              Route
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteFile(file.id)}
                            title="Delete file"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
