export type FileCategory = 
  | 'documents' 
  | 'finance' 
  | 'media' 
  | 'code' 
  | 'archives' 
  | 'temporary' 
  | 'misc';

export type JunkReason = 
  | 'duplicate' 
  | 'old_cache' 
  | 'empty_file' 
  | 'temp_scratch' 
  | 'stale_download' 
  | 'obsolete_log';

export interface StoredFile {
  id: string;
  name: string;
  originalPath: string;
  currentPath: string;
  category: FileCategory;
  subcategory: string;
  size: number; // in bytes
  extension: string;
  mimeType: string;
  lastModified: string;
  contentPreview?: string;
  textContent?: string;
  tags: string[];
  isJunk: boolean;
  junkReason?: JunkReason;
  duplicateOfId?: string;
  suggestedOrganizedPath: string;
  isOrganized: boolean;
  accessCount: number;
  lastAccessedAt: string;
}

export interface WorkTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  linkedFileIds: string[];
  notes?: string;
  category: string;
  createdAt: string;
}

export interface DailyNote {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  linkedProjects: string[];
  createdAt: string;
}

export interface LearnedPattern {
  id: string;
  type: 'rule' | 'preference' | 'entity' | 'habit' | 'project_cluster';
  title: string;
  description: string;
  confidence: number; // 0 to 1
  occurrences: number;
  lastUpdated: string;
  actionRule?: {
    matchExt?: string[];
    matchKeyword?: string[];
    targetFolder: string;
    autoRenamePattern?: string;
  };
}

export interface AssistantSource {
  fileId: string;
  fileName: string;
  snippet?: string;
  confidence?: number;
}

export interface AssistantAction {
  label: string;
  actionType: 'clean_junk' | 'organize_files' | 'open_file' | 'create_task' | 'view_learned';
  payload?: any;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  sources?: AssistantSource[];
  suggestedActions?: AssistantAction[];
  isOfflineAnswer: boolean;
}

export interface CleanupNotification {
  id: string;
  title: string;
  message: string;
  detectedAt: string;
  totalSize: number;
  junkFileIds: string[];
  severity: 'warning' | 'critical' | 'info';
  isRead: boolean;
  dismissed: boolean;
}

export type ActiveTab = 'organizer' | 'daily_work' | 'assistant' | 'cleaner' | 'learned';
