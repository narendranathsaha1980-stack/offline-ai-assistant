import React, { useState } from 'react';
import { WorkTask, DailyNote, StoredFile } from '../types';
import { db } from '../services/storage';
import { LocalIntelligenceEngine } from '../services/localIntelligence';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  FileText, 
  Calendar, 
  AlertCircle, 
  ArrowUpRight, 
  FilePlus,
  Sparkles,
  Check,
  Brain
} from 'lucide-react';

interface DailyWorkHubProps {
  tasks: WorkTask[];
  notes: DailyNote[];
  files: StoredFile[];
  onRefresh: () => void;
  onPreviewFile: (file: StoredFile) => void;
}

export const DailyWorkHub: React.FC<DailyWorkHubProps> = ({
  tasks,
  notes,
  files,
  onRefresh,
  onPreviewFile
}) => {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskCategory, setTaskCategory] = useState('General');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Scratchpad note state
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleToggleTask = (id: string) => {
    db.toggleTask(id);
    onRefresh();
  };

  const handleDeleteTask = (id: string) => {
    db.deleteTask(id);
    onRefresh();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    db.addTask({
      title: taskTitle.trim(),
      completed: false,
      priority: taskPriority,
      dueDate: new Date().toISOString().split('T')[0],
      linkedFileIds: selectedFileIds,
      category: taskCategory
    });

    setTaskTitle('');
    setSelectedFileIds([]);
    setShowNewTaskModal(false);
    onRefresh();
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    db.addNote({
      title: newNoteTitle.trim() || `Daily Work Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      content: newNoteContent.trim(),
      date: new Date().toISOString().split('T')[0],
      tags: ['daily', 'work', 'scratchpad'],
      linkedProjects: ['General']
    });

    // Archon learns from this note
    LocalIntelligenceEngine.learnFromFiles();

    setNewNoteTitle('');
    setNewNoteContent('');
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2500);
    onRefresh();
  };

  const handleDeleteNote = (id: string) => {
    db.deleteNote(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header & Daily Briefing Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Daily Work Hub</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="text-cyan-400 font-mono tabular-nums">{pendingTasks.length} Pending Tasks</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{completedTasks.length} Done</span>
            <span aria-hidden="true">·</span>
            <span>{notes.length} Work Logs & Notes</span>
          </div>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-3.5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-1.5 self-start md:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Priority Task
        </button>
      </div>

      {/* Archon Proactive Daily Briefing */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <Brain className="w-4 h-4" />
          <span>Archon Morning Work Briefing (Generated Offline)</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {pendingTasks.length > 0 
            ? `You have ${pendingTasks.length} pending agenda items today. Top priority: "${pendingTasks[0]?.title}". 2 linked project files are ready for review.`
            : `All daily tasks are marked completed! Your workspace is organized and clean.`}
        </p>
      </div>

      {/* Main Grid: Left Tasks, Right Scratchpad & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Today's Action Items
            </h2>
            <span className="text-xs text-slate-400">
              Sorted by Priority
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">No tasks yet. Create one to organize your daily work.</p>
              </div>
            ) : (
              tasks.map(task => {
                const linkedFiles = task.linkedFileIds
                  .map(id => files.find(f => f.id === id))
                  .filter(Boolean) as StoredFile[];

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                      task.completed 
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {task.title}
                          </p>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                            task.priority === 'high' 
                              ? 'text-rose-400 bg-rose-500/10' 
                              : task.priority === 'medium'
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-slate-400 bg-slate-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.notes}</p>
                        )}

                        {/* Linked files affordance */}
                        {linkedFiles.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[11px] text-slate-400">Attached Data:</span>
                            {linkedFiles.map(file => (
                              <button
                                key={file.id}
                                onClick={() => onPreviewFile(file)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded transition-colors"
                              >
                                <FileText className="w-3 h-3 text-cyan-400" />
                                <span className="truncate max-w-[140px]">{file.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Scratchpad & Notes Section (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Work Scratchpad & Memory
            </h2>
            <span className="text-xs text-slate-400">Auto-Indexed</span>
          </div>

          {/* New Note Form */}
          <form onSubmit={handleSaveNote} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title (e.g. Acme deliverables)..."
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Jot down notes, client requests, or daily decisions. Archon learns keywords and references offline..."
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {noteSavedFeedback ? '✓ Indexed into memory!' : 'Stored 100% locally'}
              </span>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Save & Index
              </button>
            </div>
          </form>

          {/* Stored Notes List */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {notes.map(note => (
              <div key={note.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{note.title}</h4>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                  <span>{note.date}</span>
                  {note.tags.map((t, idx) => (
                    <span key={idx}>#{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Create Work Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit Q3 expenditure spreadsheet"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    placeholder="e.g. Finance, Ops"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Link Relevant File</label>
                <select
                  onChange={(e) => {
                    if (e.target.value && !selectedFileIds.includes(e.target.value)) {
                      setSelectedFileIds([...selectedFileIds, e.target.value]);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select a workspace file...</option>
                  {files.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                {selectedFileIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedFileIds.map(fid => {
                      const f = files.find(file => file.id === fid);
                      return (
                        <span key={fid} className="text-[11px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-cyan-300 flex items-center gap-1">
                          {f?.name}
                          <button
                            type="button"
                            onClick={() => setSelectedFileIds(selectedFileIds.filter(id => id !== fid))}
                            className="text-slate-400 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
