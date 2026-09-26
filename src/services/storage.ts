import { StoredFile, WorkTask, DailyNote, LearnedPattern, AssistantMessage, CleanupNotification } from '../types';

const DB_NAME = 'ArchonOfflineAssistantDB';
const DB_VERSION = 1;

// Default initial dataset
const INITIAL_FILES: StoredFile[] = [
  {
    id: 'f-1',
    name: 'Q3_Financial_Summary_2026.pdf',
    originalPath: '/Downloads/Q3_Financial_Summary_2026.pdf',
    currentPath: '/Downloads/Q3_Financial_Summary_2026.pdf',
    category: 'finance',
    subcategory: 'reports',
    size: 2450000,
    extension: 'pdf',
    mimeType: 'application/pdf',
    lastModified: '2026-09-21T14:30:00Z',
    contentPreview: 'Financial breakdown for third quarter 2026. Net operating margin 24.8%. Total revenue $1,420,000.',
    textContent: 'Financial breakdown for third quarter 2026. Net operating margin 24.8%. Total revenue $1,420,000. Expenses categorized by R&D, operations, and cloud infrastructure.',
    tags: ['finance', 'quarterly', 'q3', 'revenue', 'report'],
    isJunk: false,
    suggestedOrganizedPath: '/Documents/Finance/2026/Q3_Financial_Summary_2026.pdf',
    isOrganized: false,
    accessCount: 6,
    lastAccessedAt: '2026-09-25T11:20:00Z',
  },
  {
    id: 'f-2',
    name: 'Invoice_Acme_Corp_INV-8491.pdf',
    originalPath: '/Desktop/Invoice_Acme_Corp_INV-8491.pdf',
    currentPath: '/Desktop/Invoice_Acme_Corp_INV-8491.pdf',
    category: 'finance',
    subcategory: 'invoices',
    size: 480000,
    extension: 'pdf',
    mimeType: 'application/pdf',
    lastModified: '2026-09-24T09:15:00Z',
    contentPreview: 'Acme Corporation - Invoice #INV-8491. Amount Due: $3,250.00. Payment terms: Net 30 days.',
    textContent: 'Acme Corporation - Invoice #INV-8491. Bill To: Engineering Dept. Amount Due: $3,250.00. Services rendered: Architecture audit and server migration assistance.',
    tags: ['invoice', 'acme', 'billing', 'finance'],
    isJunk: false,
    suggestedOrganizedPath: '/Documents/Finance/Invoices/Invoice_Acme_Corp_INV-8491.pdf',
    isOrganized: false,
    accessCount: 3,
    lastAccessedAt: '2026-09-25T16:45:00Z',
  },
  {
    id: 'f-3',
    name: 'Invoice_Acme_Corp_INV-8491 (1).pdf',
    originalPath: '/Downloads/Invoice_Acme_Corp_INV-8491 (1).pdf',
    currentPath: '/Downloads/Invoice_Acme_Corp_INV-8491 (1).pdf',
    category: 'temporary',
    subcategory: 'duplicate',
    size: 480000,
    extension: 'pdf',
    mimeType: 'application/pdf',
    lastModified: '2026-09-24T09:18:00Z',
    contentPreview: 'Acme Corporation - Invoice #INV-8491. Exact duplicate downloaded twice.',
    textContent: 'Acme Corporation - Invoice #INV-8491. Bill To: Engineering Dept. Amount Due: $3,250.00.',
    tags: ['duplicate', 'download', 'junk'],
    isJunk: true,
    junkReason: 'duplicate',
    duplicateOfId: 'f-2',
    suggestedOrganizedPath: '/Trash/Invoice_Acme_Corp_INV-8491 (1).pdf',
    isOrganized: false,
    accessCount: 1,
    lastAccessedAt: '2026-09-24T09:18:00Z',
  },
  {
    id: 'f-4',
    name: 'debug_dump_crash_2026-09-12.log',
    originalPath: '/System/Logs/debug_dump_crash_2026-09-12.log',
    currentPath: '/System/Logs/debug_dump_crash_2026-09-12.log',
    category: 'temporary',
    subcategory: 'logs',
    size: 48900000, // ~48.9 MB
    extension: 'log',
    mimeType: 'text/plain',
    lastModified: '2026-09-12T02:11:00Z',
    contentPreview: '[ERROR] 2026-09-12T02:11:04Z SIGTERM received. Thread stacktrace dumped to disk 48.9MB.',
    textContent: 'Obsolete crash memory dump from 2 weeks ago. Safe to delete.',
    tags: ['log', 'crash', 'obsolete', 'junk'],
    isJunk: true,
    junkReason: 'obsolete_log',
    suggestedOrganizedPath: '/Trash/debug_dump_crash_2026-09-12.log',
    isOrganized: false,
    accessCount: 0,
    lastAccessedAt: '2026-09-12T02:11:00Z',
  },
  {
    id: 'f-5',
    name: 'project_archon_spec_v2.md',
    originalPath: '/Desktop/project_archon_spec_v2.md',
    currentPath: '/Desktop/project_archon_spec_v2.md',
    category: 'documents',
    subcategory: 'specifications',
    size: 64200,
    extension: 'md',
    mimeType: 'text/markdown',
    lastModified: '2026-09-25T18:00:00Z',
    contentPreview: '# Project Archon Architecture\n- Complete offline storage using IndexedDB\n- Heuristic rule learning from user naming styles\n- Proactive junk cleaning notifications',
    textContent: '# Project Archon Architecture\n- Complete offline storage using IndexedDB\n- Heuristic rule learning from user naming styles\n- Proactive junk cleaning notifications\n- Daily agenda task linking\n- Instant semantic offline search',
    tags: ['project', 'archon', 'architecture', 'spec', 'active'],
    isJunk: false,
    suggestedOrganizedPath: '/Projects/Archon/project_archon_spec_v2.md',
    isOrganized: false,
    accessCount: 14,
    lastAccessedAt: '2026-09-25T18:30:00Z',
  },
  {
    id: 'f-6',
    name: 'scratch_notes_temp.tmp',
    originalPath: '/Downloads/scratch_notes_temp.tmp',
    currentPath: '/Downloads/scratch_notes_temp.tmp',
    category: 'temporary',
    subcategory: 'cache',
    size: 18200000, // 18.2 MB
    extension: 'tmp',
    mimeType: 'application/octet-stream',
    lastModified: '2026-09-14T08:00:00Z',
    contentPreview: 'Orphaned temporary buffer file created by legacy editor. No active reference.',
    textContent: 'Binary temporary data buffer. Unused.',
    tags: ['tmp', 'cache', 'junk'],
    isJunk: true,
    junkReason: 'temp_scratch',
    suggestedOrganizedPath: '/Trash/scratch_notes_temp.tmp',
    isOrganized: false,
    accessCount: 0,
    lastAccessedAt: '2026-09-14T08:00:00Z',
  },
  {
    id: 'f-7',
    name: 'team_meeting_action_items.txt',
    originalPath: '/Desktop/team_meeting_action_items.txt',
    currentPath: '/Desktop/team_meeting_action_items.txt',
    category: 'documents',
    subcategory: 'meeting_notes',
    size: 4200,
    extension: 'txt',
    mimeType: 'text/plain',
    lastModified: '2026-09-25T11:00:00Z',
    contentPreview: '1. Finalize Q3 expenditure review.\n2. Purge unused test assets from staging drive.\n3. Send signed Acme NDA to legal.',
    textContent: 'Meeting notes 2026-09-25:\n1. Finalize Q3 expenditure review.\n2. Purge unused test assets from staging drive.\n3. Send signed Acme NDA to legal.\nAttendees: Alex, Sarah, David.',
    tags: ['meeting', 'action-items', 'tasks', 'acme'],
    isJunk: false,
    suggestedOrganizedPath: '/Documents/Notes/team_meeting_action_items.txt',
    isOrganized: false,
    accessCount: 5,
    lastAccessedAt: '2026-09-25T14:10:00Z',
  },
  {
    id: 'f-8',
    name: 'old_installer_package_v1.0.tar.gz',
    originalPath: '/Downloads/old_installer_package_v1.0.tar.gz',
    currentPath: '/Downloads/old_installer_package_v1.0.tar.gz',
    category: 'archives',
    subcategory: 'stale_downloads',
    size: 112000000, // 112 MB
    extension: 'tar.gz',
    mimeType: 'application/gzip',
    lastModified: '2026-08-15T10:00:00Z',
    contentPreview: 'Downloaded software archive from 42 days ago. Successfully installed; archive no longer required.',
    textContent: 'Stale installer archive. Consuming 112 MB disk space.',
    tags: ['stale', 'download', 'archive', 'junk'],
    isJunk: true,
    junkReason: 'stale_download',
    suggestedOrganizedPath: '/Trash/old_installer_package_v1.0.tar.gz',
    isOrganized: false,
    accessCount: 0,
    lastAccessedAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'f-9',
    name: 'app_config_schema.json',
    originalPath: '/Desktop/app_config_schema.json',
    currentPath: '/Desktop/app_config_schema.json',
    category: 'code',
    subcategory: 'configuration',
    size: 12400,
    extension: 'json',
    mimeType: 'application/json',
    lastModified: '2026-09-23T15:20:00Z',
    contentPreview: '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "title": "OfflineStorageConfig",\n  "version": "1.4"\n}',
    textContent: '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "title": "OfflineStorageConfig",\n  "type": "object",\n  "properties": {\n    "storageEngine": { "type": "string", "enum": ["indexeddb", "localstorage"] },\n    "autoPurgeJunkDays": { "type": "integer", "default": 14 }\n  }\n}',
    tags: ['code', 'json', 'config', 'schema'],
    isJunk: false,
    suggestedOrganizedPath: '/Projects/Archon/Config/app_config_schema.json',
    isOrganized: false,
    accessCount: 4,
    lastAccessedAt: '2026-09-24T18:00:00Z',
  },
  {
    id: 'f-10',
    name: 'empty_untitled_scratch.txt',
    originalPath: '/Desktop/empty_untitled_scratch.txt',
    currentPath: '/Desktop/empty_untitled_scratch.txt',
    category: 'temporary',
    subcategory: 'empty',
    size: 0,
    extension: 'txt',
    mimeType: 'text/plain',
    lastModified: '2026-09-20T10:00:00Z',
    contentPreview: '(0-byte empty file)',
    textContent: '',
    tags: ['empty', 'junk'],
    isJunk: true,
    junkReason: 'empty_file',
    suggestedOrganizedPath: '/Trash/empty_untitled_scratch.txt',
    isOrganized: false,
    accessCount: 0,
    lastAccessedAt: '2026-09-20T10:00:00Z',
  }
];

const INITIAL_TASKS: WorkTask[] = [
  {
    id: 't-1',
    title: 'Review and approve Acme Corp invoice INV-8491',
    completed: false,
    priority: 'high',
    dueDate: '2026-09-26',
    linkedFileIds: ['f-2'],
    notes: 'Verify hours logged against project deliverables.',
    category: 'Finance',
    createdAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 't-2',
    title: 'Clean obsolete cache & download files to free disk',
    completed: false,
    priority: 'high',
    dueDate: '2026-09-26',
    linkedFileIds: ['f-3', 'f-4', 'f-6', 'f-8', 'f-10'],
    notes: '179.5 MB of useless duplicate and crash files detected.',
    category: 'Maintenance',
    createdAt: '2026-09-25T09:00:00Z'
  },
  {
    id: 't-3',
    title: 'Finalize Project Archon architecture specification',
    completed: false,
    priority: 'medium',
    dueDate: '2026-09-27',
    linkedFileIds: ['f-5', 'f-9'],
    notes: 'Incorporate offline heuristic learning module.',
    category: 'Engineering',
    createdAt: '2026-09-24T14:00:00Z'
  },
  {
    id: 't-4',
    title: 'Archive Q3 financial review deck',
    completed: true,
    priority: 'low',
    dueDate: '2026-09-25',
    linkedFileIds: ['f-1'],
    notes: 'Sent to team members.',
    category: 'Finance',
    createdAt: '2026-09-23T11:00:00Z'
  }
];

const INITIAL_NOTES: DailyNote[] = [
  {
    id: 'n-1',
    title: 'Offline Assistant System Rules',
    content: 'All user files must stay within browser local sandbox. When organizing, detect file types by extension and content keywords. Proactively notify user whenever clutter exceeds 50MB.',
    date: '2026-09-26',
    tags: ['offline', 'privacy', 'rules'],
    linkedProjects: ['Archon'],
    createdAt: '2026-09-25T17:00:00Z'
  },
  {
    id: 'n-2',
    title: 'Acme Corp Contract & Billing Terms',
    content: 'Invoices payable via ACH within 30 days. Hourly rate $175/hr. Contact person is Sarah Jenkins in Procurement.',
    date: '2026-09-24',
    tags: ['acme', 'vendor', 'billing'],
    linkedProjects: ['Operations'],
    createdAt: '2026-09-24T10:00:00Z'
  }
];

const INITIAL_PATTERNS: LearnedPattern[] = [
  {
    id: 'p-1',
    type: 'rule',
    title: 'Financial Document Routing',
    description: 'Learned that PDF files containing "Invoice", "Q3", "Billing" or "Acme" belong under /Documents/Finance',
    confidence: 0.95,
    occurrences: 12,
    lastUpdated: '2026-09-25T14:00:00Z',
    actionRule: {
      matchExt: ['pdf', 'xlsx', 'csv'],
      matchKeyword: ['invoice', 'q3', 'billing', 'financial', 'tax', 'receipt'],
      targetFolder: '/Documents/Finance'
    }
  },
  {
    id: 'p-2',
    type: 'rule',
    title: 'Automatic Scratch & Log Disposal',
    description: 'Learned that .tmp, .log, and 0-byte scratch files on Desktop/Downloads are ephemeral clutter',
    confidence: 0.98,
    occurrences: 24,
    lastUpdated: '2026-09-26T00:00:00Z',
    actionRule: {
      matchExt: ['tmp', 'log', 'bak'],
      matchKeyword: ['scratch', 'crash', 'debug_dump'],
      targetFolder: '/Trash'
    }
  },
  {
    id: 'p-3',
    type: 'entity',
    title: 'Key Entity: Acme Corporation',
    description: 'Frequently associated with engineering consulting, billing invoices, and NDA documentation.',
    confidence: 0.92,
    occurrences: 8,
    lastUpdated: '2026-09-25T11:00:00Z'
  },
  {
    id: 'p-4',
    type: 'habit',
    title: 'Daily Working Rhythm',
    description: 'High file creation and organization activity between 09:00 - 18:00. Weekly downloads cleanup preferred on Fridays.',
    confidence: 0.88,
    occurrences: 15,
    lastUpdated: '2026-09-25T18:00:00Z'
  }
];

const INITIAL_NOTIFICATIONS: CleanupNotification[] = [
  {
    id: 'notif-1',
    title: 'Useless Files Detected: 179.5 MB Recoverable',
    message: 'Archon identified 5 useless files (1 duplicate invoice, 1 large crash log dump, 1 stale installer archive, 1 orphaned temp file, and 1 empty file). Delete them to reclaim storage.',
    detectedAt: '2026-09-26T00:30:00Z',
    totalSize: 179580000,
    junkFileIds: ['f-3', 'f-4', 'f-6', 'f-8', 'f-10'],
    severity: 'critical',
    isRead: false,
    dismissed: false
  }
];

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: 'm-1',
    sender: 'assistant',
    timestamp: '2026-09-26T00:35:00Z',
    text: "Good morning! I am Archon, your 100% offline personal data & file assistant. All your files and learning stay strictly on this device.\n\nI have pre-scanned your workspace:\n• Found 10 files across Desktop & Downloads.\n• Flagged 5 useless files (179.5 MB junk) ready for 1-click cleanup.\n• Prepared your daily work agenda with 3 high-priority tasks.\n\nHow can I help you today? You can ask me to find files, clean useless items, organize folders, or answer questions about your data.",
    suggestedActions: [
      { label: '🧹 Clean 179.5 MB Useless Files', actionType: 'clean_junk' },
      { label: '📁 Auto-Organize 5 Loose Files', actionType: 'organize_files' },
      { label: '🧠 View Learned Patterns', actionType: 'view_learned' }
    ],
    isOfflineAnswer: true
  }
];

// In-memory cache + LocalStorage / IndexedDB fallback engine
class LocalDatabase {
  private files: StoredFile[] = [];
  private tasks: WorkTask[] = [];
  private notes: DailyNote[] = [];
  private patterns: LearnedPattern[] = [];
  private messages: AssistantMessage[] = [];
  private notifications: CleanupNotification[] = [];
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const storedFiles = localStorage.getItem('archon_files');
      const storedTasks = localStorage.getItem('archon_tasks');
      const storedNotes = localStorage.getItem('archon_notes');
      const storedPatterns = localStorage.getItem('archon_patterns');
      const storedMessages = localStorage.getItem('archon_messages');
      const storedNotifs = localStorage.getItem('archon_notifications');

      this.files = storedFiles ? JSON.parse(storedFiles) : INITIAL_FILES;
      this.tasks = storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS;
      this.notes = storedNotes ? JSON.parse(storedNotes) : INITIAL_NOTES;
      this.patterns = storedPatterns ? JSON.parse(storedPatterns) : INITIAL_PATTERNS;
      this.messages = storedMessages ? JSON.parse(storedMessages) : INITIAL_MESSAGES;
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : INITIAL_NOTIFICATIONS;

      this.isInitialized = true;
      this.persist();
    } catch (e) {
      console.warn('Storage init failed, using defaults in memory', e);
      this.files = [...INITIAL_FILES];
      this.tasks = [...INITIAL_TASKS];
      this.notes = [...INITIAL_NOTES];
      this.patterns = [...INITIAL_PATTERNS];
      this.messages = [...INITIAL_MESSAGES];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.isInitialized = true;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem('archon_files', JSON.stringify(this.files));
      localStorage.setItem('archon_tasks', JSON.stringify(this.tasks));
      localStorage.setItem('archon_notes', JSON.stringify(this.notes));
      localStorage.setItem('archon_patterns', JSON.stringify(this.patterns));
      localStorage.setItem('archon_messages', JSON.stringify(this.messages));
      localStorage.setItem('archon_notifications', JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  // --- File Operations ---
  public getFiles(): StoredFile[] {
    return [...this.files];
  }

  public getFileById(id: string): StoredFile | undefined {
    return this.files.find(f => f.id === id);
  }

  public addFile(file: StoredFile): void {
    this.files.unshift(file);
    this.recalculateJunkNotification();
    this.persist();
  }

  public updateFile(id: string, updates: Partial<StoredFile>): StoredFile | undefined {
    const idx = this.files.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.files[idx] = { ...this.files[idx], ...updates };
      this.recalculateJunkNotification();
      this.persist();
      return this.files[idx];
    }
    return undefined;
  }

  public deleteFile(id: string): void {
    this.files = this.files.filter(f => f.id !== id);
    // remove from tasks link if any
    this.tasks = this.tasks.map(t => ({
      ...t,
      linkedFileIds: t.linkedFileIds.filter(fid => fid !== id)
    }));
    this.recalculateJunkNotification();
    this.persist();
  }

  public batchDeleteJunkFiles(): { count: number; bytesFreed: number } {
    const junkFiles = this.files.filter(f => f.isJunk);
    const bytesFreed = junkFiles.reduce((acc, f) => acc + f.size, 0);
    const count = junkFiles.length;

    this.files = this.files.filter(f => !f.isJunk);

    // mark active notifications as dismissed
    this.notifications = this.notifications.map(n => ({
      ...n,
      isRead: true,
      dismissed: true
    }));

    this.persist();
    return { count, bytesFreed };
  }

  public batchOrganizeLooseFiles(): number {
    let organizedCount = 0;
    this.files = this.files.map(f => {
      if (!f.isJunk && !f.isOrganized && f.suggestedOrganizedPath) {
        organizedCount++;
        return {
          ...f,
          currentPath: f.suggestedOrganizedPath,
          isOrganized: true
        };
      }
      return f;
    });
    this.persist();
    return organizedCount;
  }

  // --- Task Operations ---
  public getTasks(): WorkTask[] {
    return [...this.tasks];
  }

  public toggleTask(id: string): void {
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    this.persist();
  }

  public addTask(task: Omit<WorkTask, 'id' | 'createdAt'>): WorkTask {
    const newTask: WorkTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    this.tasks.unshift(newTask);
    this.persist();
    return newTask;
  }

  public deleteTask(id: string): void {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.persist();
  }

  // --- Note Operations ---
  public getNotes(): DailyNote[] {
    return [...this.notes];
  }

  public addNote(note: Omit<DailyNote, 'id' | 'createdAt'>): DailyNote {
    const newNote: DailyNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    this.notes.unshift(newNote);
    this.persist();
    return newNote;
  }

  public deleteNote(id: string): void {
    this.notes = this.notes.filter(n => n.id !== id);
    this.persist();
  }

  // --- Learned Patterns ---
  public getPatterns(): LearnedPattern[] {
    return [...this.patterns];
  }

  public addOrUpdatePattern(pattern: Omit<LearnedPattern, 'id' | 'lastUpdated'>): void {
    const existingIdx = this.patterns.findIndex(p => p.title.toLowerCase() === pattern.title.toLowerCase());
    if (existingIdx !== -1) {
      this.patterns[existingIdx] = {
        ...this.patterns[existingIdx],
        ...pattern,
        occurrences: this.patterns[existingIdx].occurrences + 1,
        confidence: Math.min(0.99, this.patterns[existingIdx].confidence + 0.05),
        lastUpdated: new Date().toISOString()
      };
    } else {
      this.patterns.unshift({
        ...pattern,
        id: `pattern-${Date.now()}`,
        lastUpdated: new Date().toISOString()
      });
    }
    this.persist();
  }

  // --- Messages & Chat History ---
  public getMessages(): AssistantMessage[] {
    return [...this.messages];
  }

  public addMessage(msg: AssistantMessage): void {
    this.messages.push(msg);
    this.persist();
  }

  public clearMessages(): void {
    this.messages = [];
    this.persist();
  }

  // --- Notifications ---
  public getNotifications(): CleanupNotification[] {
    return [...this.notifications];
  }

  public markNotificationRead(id: string): void {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.persist();
  }

  public dismissNotification(id: string): void {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, dismissed: true, isRead: true } : n);
    this.persist();
  }

  private recalculateJunkNotification(): void {
    const junkFiles = this.files.filter(f => f.isJunk);
    const totalSize = junkFiles.reduce((acc, f) => acc + f.size, 0);

    if (junkFiles.length > 0) {
      const existing = this.notifications.find(n => !n.dismissed);
      if (existing) {
        existing.junkFileIds = junkFiles.map(f => f.id);
        existing.totalSize = totalSize;
        existing.message = `Archon detected ${junkFiles.length} useless files (${formatBytes(totalSize)} junk). Review & delete to free disk space.`;
      } else {
        this.notifications.unshift({
          id: `notif-${Date.now()}`,
          title: `Useless Files Detected: ${formatBytes(totalSize)} Recoverable`,
          message: `Archon detected ${junkFiles.length} useless files (${formatBytes(totalSize)} junk). Review & delete to free disk space.`,
          detectedAt: new Date().toISOString(),
          totalSize,
          junkFileIds: junkFiles.map(f => f.id),
          severity: totalSize > 50000000 ? 'critical' : 'warning',
          isRead: false,
          dismissed: false
        });
      }
    } else {
      this.notifications = this.notifications.map(n => ({ ...n, dismissed: true, isRead: true }));
    }
  }

  // Reset to sample initial state
  public resetToSample(): void {
    this.files = [...INITIAL_FILES];
    this.tasks = [...INITIAL_TASKS];
    this.notes = [...INITIAL_NOTES];
    this.patterns = [...INITIAL_PATTERNS];
    this.messages = [...INITIAL_MESSAGES];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.persist();
  }

  // Export full database JSON
  public exportData(): string {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      files: this.files,
      tasks: this.tasks,
      notes: this.notes,
      patterns: this.patterns,
      messages: this.messages,
      notifications: this.notifications
    }, null, 2);
  }

  // Import JSON backup
  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.files && Array.isArray(data.files)) {
        this.files = data.files;
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.patterns = data.patterns || [];
        this.messages = data.messages || [];
        this.notifications = data.notifications || [];
        this.recalculateJunkNotification();
        this.persist();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const db = new LocalDatabase();
