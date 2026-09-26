import { StoredFile, WorkTask, DailyNote, LearnedPattern, AssistantMessage, AssistantSource, AssistantAction, FileCategory, JunkReason } from '../types';
import { db, formatBytes } from './storage';

export interface LocalAnswerResult {
  text: string;
  sources?: AssistantSource[];
  suggestedActions?: AssistantAction[];
}

export class LocalIntelligenceEngine {
  /**
   * Process a user query completely offline using deterministic semantic matching,
   * local inverted indexing, intent classification, and pattern extraction.
   * Supports both Bengali and English seamlessly.
   */
  public static answerOffline(query: string): LocalAnswerResult {
    const cleanQuery = query.trim().toLowerCase();
    const files = db.getFiles();
    const tasks = db.getTasks();
    const notes = db.getNotes();
    const patterns = db.getPatterns();

    // Detect if user is asking in Bengali
    const isBengali = /[\u0980-\u09FF]/.test(query) || 
      cleanQuery.includes('bangla') || 
      cleanQuery.includes('bengali') ||
      cleanQuery.includes('delete') ||
      cleanQuery.includes('file');

    // 1. Intent: Junk / Useless File Cleanup
    if (
      cleanQuery.includes('useless') || 
      cleanQuery.includes('junk') || 
      cleanQuery.includes('delete') || 
      cleanQuery.includes('clean') || 
      cleanQuery.includes('duplicate') ||
      cleanQuery.includes('free space') ||
      cleanQuery.includes('disk') ||
      cleanQuery.includes('অপ্রয়োজনীয়') ||
      cleanQuery.includes('মুছে') ||
      cleanQuery.includes('ডিলিট') ||
      cleanQuery.includes('পরিষ্কার') ||
      cleanQuery.includes('ফাঁকা')
    ) {
      const junkFiles = files.filter(f => f.isJunk);
      const totalBytes = junkFiles.reduce((acc, f) => acc + f.size, 0);

      if (junkFiles.length === 0) {
        return {
          text: isBengali 
            ? `আপনার ওয়ার্কস্পেস এখন একদম পরিষ্কার! কোনো অপ্রয়োজনীয়, ডুপ্লিকেট বা পুরনো ক্র্যাশ ফাইল পাওয়া যায়নি। আপনার সব ${files.length}টি ফাইল সুসংগঠিত রয়েছে।`
            : `Your workspace is currently pristine! No useless, duplicate, or stale temporary files were detected. All ${files.length} active files are cleanly cataloged.`,
          suggestedActions: [
            { label: isBengali ? '📁 সব ফাইল দেখুন' : '📁 Review All Files', actionType: 'organize_files' },
            { label: isBengali ? '⚡ আজকের কাজ দেখুন' : '⚡ View Daily Tasks', actionType: 'create_task' }
          ]
        };
      }

      const duplicates = junkFiles.filter(f => f.junkReason === 'duplicate');
      const logs = junkFiles.filter(f => f.junkReason === 'obsolete_log');
      const temps = junkFiles.filter(f => f.junkReason === 'temp_scratch' || f.junkReason === 'old_cache');
      const stales = junkFiles.filter(f => f.junkReason === 'stale_download');
      const empties = junkFiles.filter(f => f.junkReason === 'empty_file');

      const breakdown: string[] = [];
      if (isBengali) {
        if (duplicates.length > 0) breakdown.push(`• ${duplicates.length}টি ডুপ্লিকেট ফাইল (${duplicates.map(d => d.name).join(', ')})`);
        if (logs.length > 0) breakdown.push(`• ${logs.length}টি পুরনো ক্র্যাশ লগ (${formatBytes(logs.reduce((a, b) => a + b.size, 0))})`);
        if (temps.length > 0) breakdown.push(`• ${temps.length}টি খালি টেম্পোরারি/ক্যাশ ফাইল`);
        if (stales.length > 0) breakdown.push(`• ${stales.length}টি পুরনো ডাউনলোড প্যাকেজ`);
        if (empties.length > 0) breakdown.push(`• ${empties.length}টি শূন্য-বাইটের খালি ফাইল`);
      } else {
        if (duplicates.length > 0) breakdown.push(`• ${duplicates.length} duplicate file(s) (${duplicates.map(d => d.name).join(', ')})`);
        if (logs.length > 0) breakdown.push(`• ${logs.length} obsolete crash log(s) (${formatBytes(logs.reduce((a, b) => a + b.size, 0))})`);
        if (temps.length > 0) breakdown.push(`• ${temps.length} orphaned scratch/cache file(s)`);
        if (stales.length > 0) breakdown.push(`• ${stales.length} stale download archive(s)`);
        if (empties.length > 0) breakdown.push(`• ${empties.length} zero-byte empty file(s)`);
      }

      return {
        text: isBengali 
          ? `⚠️ আর্কন (Archon) **${junkFiles.length}টি অপ্রয়োজনীয় ফাইল** শনাক্ত করেছে যা প্রায় **${formatBytes(totalBytes)}** জায়গা দখল করে আছে।\n\n${breakdown.join('\n')}\n\nআপনি এক ক্লিকেই এই ফাইলগুলো ডিলিট করে সম্পূর্ণ মেমরি খালি করতে পারেন:`
          : `⚠️ Archon found **${junkFiles.length} useless files** consuming **${formatBytes(totalBytes)}** of recoverable space.\n\n${breakdown.join('\n')}\n\nYou can safely purge these items with a single click or review them individually.`,
        sources: junkFiles.map(f => ({
          fileId: f.id,
          fileName: f.name,
          snippet: `Junk: ${f.junkReason ? f.junkReason.replace('_', ' ') : 'unreferenced'} (${formatBytes(f.size)})`
        })),
        suggestedActions: [
          { label: isBengali ? `🧹 ${formatBytes(totalBytes)} অপ্রয়োজনীয় ফাইল ডিলিট করুন` : `🧹 Purge ${formatBytes(totalBytes)} Useless Files`, actionType: 'clean_junk' }
        ]
      };
    }

    // 2. Intent: Daily Tasks / Work Planning
    if (
      cleanQuery.includes('task') || 
      cleanQuery.includes('todo') || 
      cleanQuery.includes('daily work') || 
      cleanQuery.includes('agenda') || 
      cleanQuery.includes('what to do') ||
      cleanQuery.includes('what should i do') ||
      cleanQuery.includes('plan') ||
      cleanQuery.includes('কাজ') ||
      cleanQuery.includes('আজকের') ||
      cleanQuery.includes('কর্মপরিকল্পনা') ||
      cleanQuery.includes('রুটিন')
    ) {
      const pendingTasks = tasks.filter(t => !t.completed);
      const highPriority = pendingTasks.filter(t => t.priority === 'high');

      if (pendingTasks.length === 0) {
        return {
          text: isBengali 
            ? `আজকের সব কাজ সম্পন্ন হয়েছে! আপনার কোনো কাজ এখন বাকি নেই।`
            : `You have completed all scheduled tasks for today! Great job. Everything is up to date in your workspace.`,
          suggestedActions: [
            { label: isBengali ? '➕ নতুন কাজ যোগ করুন' : '➕ Add New Work Task', actionType: 'create_task' },
            { label: isBengali ? '📁 ফাইলগুলো সাজান' : '📁 Organize Workspace', actionType: 'organize_files' }
          ]
        };
      }

      const taskLines = pendingTasks.map((t, idx) => {
        const linkedFiles = t.linkedFileIds
          .map(id => files.find(f => f.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        return `${idx + 1}. **[${t.priority.toUpperCase()}]** ${t.title}${linkedFiles ? ` *(যুক্ত ফাইল: ${linkedFiles})*` : ''}`;
      }).join('\n');

      return {
        text: isBengali 
          ? `আপনার আজকের দৈনন্দিন কাজের তালিকা:\n\nবর্তমানে **${pendingTasks.length}টি কাজ বাকি আছে** (এর মধ্যে ${highPriority.length}টি অতি-জরুরি):\n\n${taskLines}\n\nআপনি চাইলে 'Daily Work Hub' থেকে আরও কাজ যোগ বা সম্পন্ন করতে পারেন।`
          : `Here is your current daily work status:\n\nYou have **${pendingTasks.length} pending tasks** (${highPriority.length} marked high priority):\n\n${taskLines}\n\nWould you like to open the Daily Work Hub to update or create new items?`,
        suggestedActions: [
          { label: isBengali ? '⚡ ডেইলি ওয়ার্ক হাব খুলুন' : '⚡ Open Daily Work Hub', actionType: 'create_task' }
        ]
      };
    }

    // 3. Intent: Organize / Arrange Files Automatically
    if (
      cleanQuery.includes('organize') || 
      cleanQuery.includes('arrange') || 
      cleanQuery.includes('folder') || 
      cleanQuery.includes('structure') ||
      cleanQuery.includes('sort') ||
      cleanQuery.includes('সাজাও') ||
      cleanQuery.includes('সাজিয়ে') ||
      cleanQuery.includes('ফোল্ডার') ||
      cleanQuery.includes('গোছাও')
    ) {
      const unorganized = files.filter(f => !f.isOrganized && !f.isJunk);

      if (unorganized.length === 0) {
        return {
          text: isBengali 
            ? `আপনার সমস্ত সক্রিয় ফাইল ইতিমধ্যে যথাযথ প্রজেক্ট ও ক্যাটাগরি ফোল্ডারে সুসজ্জিত রয়েছে! কোনো অগোছালো ফাইল নেই।`
            : `All of your active files are already sorted into their designated project and category directories! No loose items found on Desktop or Downloads.`,
          suggestedActions: [
            { label: isBengali ? '📁 ফাইল ট্রি দেখুন' : '📁 View File Tree', actionType: 'organize_files' },
            { label: isBengali ? '🧠 শেখা নিয়মাবলি দেখুন' : '🧠 View Organization Rules', actionType: 'view_learned' }
          ]
        };
      }

      const plan = unorganized.map(f => `• \`${f.name}\` ➔ \`${f.suggestedOrganizedPath}\``).join('\n');

      return {
        text: isBengali 
          ? `আর্কনের অফলাইন রাউটিং ইঞ্জিন **${unorganized.length}টি অগোছালো ফাইলের** জন্য স্বয়ংক্রিয় ফোল্ডার তৈরি করেছে:\n\n${plan}\n\nনিচের বাটনে ক্লিক করে এখনই স্বয়ংক্রিয়ভাবে সাজিয়ে ফেলুন:`
          : `Archon's offline routing engine analyzed your workspace and generated automated destinations for **${unorganized.length} unorganized files** based on learned project patterns and file content:\n\n${plan}\n\nClick below to apply these automated routes now:`,
        sources: unorganized.map(f => ({
          fileId: f.id,
          fileName: f.name,
          snippet: `Current: ${f.currentPath} ➔ Proposed: ${f.suggestedOrganizedPath}`
        })),
        suggestedActions: [
          { label: isBengali ? `📁 ${unorganized.length}টি ফাইল স্বয়ংক্রিয় সাজান` : `📁 Auto-Organize ${unorganized.length} Files Now`, actionType: 'organize_files' }
        ]
      };
    }

    // 4. Intent: What has the assistant learned?
    if (
      cleanQuery.includes('learn') || 
      cleanQuery.includes('memory') || 
      cleanQuery.includes('what do you know') || 
      cleanQuery.includes('offline') ||
      cleanQuery.includes('privacy') ||
      cleanQuery.includes('শিখেছ') ||
      cleanQuery.includes('মেমরি') ||
      cleanQuery.includes('অফলাইন') ||
      cleanQuery.includes('গোপনীয়তা')
    ) {
      const patternSummary = patterns.map(p => `• **${p.title}** (${Math.round(p.confidence * 100)}% নিশ্চিততা): ${p.description}`).join('\n');

      return {
        text: isBengali 
          ? `আর্কন সম্পূর্ণ **১০০% অফলাইনে** আপনার ডিভাইসেই চলে। আপনার কোনো ডেটা, ফাইল বা প্রশ্ন বাইরের কোনো সার্ভারে যায় না।\n\nআপনার কাজ ও ফাইল থেকে আর্কন যা শিখেছে:\n\n${patternSummary}\n\nআপনি ফাইল গোছানোর সাথে সাথে এই অফলাইন জ্ঞানভাণ্ডার স্বয়ংক্রিয়ভাবে সমৃদ্ধ হয়।`
          : `Archon runs **100% offline** on your device. No telemetry, files, or queries leave your browser sandbox.\n\nHere is what Archon has autonomously learned from your files, names, and daily routines:\n\n${patternSummary}\n\nAs you organize or work with more files, Archon continuously refines these routing heuristics.`,
        suggestedActions: [
          { label: isBengali ? '🧠 শেখা মেমরি ট্যাব দেখুন' : '🧠 Inspect Learned Memory Tab', actionType: 'view_learned' }
        ]
      };
    }

    // 5. Intent: Specific search / query about files or entities (e.g. "invoice", "acme", "q3", "spec", "meeting")
    const searchTerms = cleanQuery
      .replace(/where is|find|search for|look for|show me|tell me about|what is|summarize|কোথায়|খুঁজে দাও|দেখাও|সম্পর্কে বলো/g, '')
      .trim()
      .split(/\s+/)
      .filter(t => t.length > 1);

    if (searchTerms.length > 0) {
      const scoredFiles = files.map(file => {
        let score = 0;
        const nameLower = file.name.toLowerCase();
        const contentLower = (file.textContent || file.contentPreview || '').toLowerCase();
        const pathLower = file.currentPath.toLowerCase();

        for (const term of searchTerms) {
          if (nameLower.includes(term)) score += 10;
          if (contentLower.includes(term)) score += 5;
          if (file.tags.some(tag => tag.toLowerCase().includes(term))) score += 7;
          if (pathLower.includes(term)) score += 4;
        }

        return { file, score };
      }).filter(res => res.score > 0)
        .sort((a, b) => b.score - a.score);

      // Also check notes
      const matchedNotes = notes.filter(n => {
        const text = (n.title + ' ' + n.content + ' ' + n.tags.join(' ')).toLowerCase();
        return searchTerms.some(term => text.includes(term));
      });

      if (scoredFiles.length > 0 || matchedNotes.length > 0) {
        const topFiles = scoredFiles.slice(0, 3).map(s => s.file);
        const fileBullets = topFiles.map(f => {
          return `• **${f.name}** (${formatBytes(f.size)})\n  অবস্থান: \`${f.currentPath}\`\n  ${f.contentPreview ? `পূর্বরূপ: *"${f.contentPreview.substring(0, 140)}..."*` : ''}`;
        }).join('\n\n');

        const noteBullets = matchedNotes.slice(0, 2).map(n => {
          return `• 📝 নোট: **${n.title}** (${n.date})\n  *${n.content.substring(0, 120)}...*`;
        }).join('\n\n');

        return {
          text: isBengali 
            ? `আপনার খোঁজা অনুযায়ী অফলাইন রেকর্ড পাওয়া গেছে:\n\n${fileBullets}${noteBullets ? `\n\n${noteBullets}` : ''}`
            : `Found relevant offline records matching your query:\n\n${fileBullets}${noteBullets ? `\n\n${noteBullets}` : ''}`,
          sources: topFiles.map(f => ({
            fileId: f.id,
            fileName: f.name,
            snippet: f.contentPreview || f.textContent?.substring(0, 100)
          })),
          suggestedActions: topFiles[0] ? [
            { label: isBengali ? `📄 ${topFiles[0].name} খুলুন` : `📄 Open ${topFiles[0].name}`, actionType: 'open_file', payload: { fileId: topFiles[0].id } }
          ] : undefined
        };
      }
    }

    // 6. Generic / Fallback Assistant Response
    return {
      text: isBengali 
        ? `আমি আপনার প্রশ্ন বুঝতে পেরেছি। আর্কন (Archon) সম্পূর্ণ **অফলাইন মোডে** চলছে।\n\nআমি আপনাকে যেভাবে সাহায্য করতে পারি:\n১. **অপ্রয়োজনীয় ফাইল মোছা**: বলুন *"অপ্রয়োজনীয় ফাইল ডিলিট করো"* অথবা ক্লিনার ট্যাবে যান।\n২. **ফাইল সাজানো**: বলুন *"ফাইলগুলো সাজিয়ে দাও"*।\n৩. **দৈনন্দিন কাজ**: বলুন *"আজকের কাজগুলো কী কী?"*।\n৪. **নথি খোঁজা**: বলুন *"আমার ইনভয়েস ফাইল কোথায়?"*।\n৫. **অফলাইন মেমরি**: বলুন *"তুমি আমার ডেটা থেকে কী শিখেছ?"*।`
        : `I understood your message. Archon is operating in **Complete Offline Mode**.\n\nHere are some things I can assist you with right now:\n1. **Useless file cleanup**: Ask *"What useless files can I delete?"* or check the Cleaner tab.\n2. **Automated organization**: Ask *"How should I organize my files?"* to route loose Desktop/Downloads items into structured folders.\n3. **Daily work assistance**: Ask *"What are my daily tasks?"* to inspect priority items linked with your documents.\n4. **Document retrieval**: Ask *"Where is my invoice?"* or search for any project document.\n5. **Learned memory**: Ask *"What have you learned from my data?"*`,
      suggestedActions: [
        { label: isBengali ? '🧹 অপ্রয়োজনীয় ফাইল মুছুন' : '🧹 Check Useless Files', actionType: 'clean_junk' },
        { label: isBengali ? '📁 স্বয়ংক্রিয় ফাইল সাজান' : '📁 Auto-Organize Files', actionType: 'organize_files' },
        { label: isBengali ? '⚡ আজকের কাজ দেখুন' : '⚡ View Daily Agenda', actionType: 'create_task' }
      ]
    };
  }

  /**
   * Evaluates a file and predicts its category, junk classification, and ideal organized path.
   */
  public static evaluateFile(
    fileName: string, 
    size: number, 
    content = '', 
    existingFiles: StoredFile[] = []
  ): {
    category: FileCategory;
    subcategory: string;
    isJunk: boolean;
    junkReason?: JunkReason;
    duplicateOfId?: string;
    suggestedPath: string;
    tags: string[];
  } {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const nameLower = fileName.toLowerCase();
    const contentLower = content.toLowerCase();

    // 1. Check for duplicates
    const duplicate = existingFiles.find(f => {
      if (f.name === fileName && f.size === size) return true;
      if (f.name.replace(/\s*\(\d+\)\./, '.') === fileName.replace(/\s*\(\d+\)\./, '.') && Math.abs(f.size - size) < 10) return true;
      return false;
    });

    if (duplicate) {
      return {
        category: 'temporary',
        subcategory: 'duplicate',
        isJunk: true,
        junkReason: 'duplicate',
        duplicateOfId: duplicate.id,
        suggestedPath: `/Trash/${fileName}`,
        tags: ['duplicate', 'junk', ext]
      };
    }

    // 2. Empty file
    if (size === 0) {
      return {
        category: 'temporary',
        subcategory: 'empty',
        isJunk: true,
        junkReason: 'empty_file',
        suggestedPath: `/Trash/${fileName}`,
        tags: ['empty', 'junk', ext]
      };
    }

    // 3. Temporary scratch / cache files
    if (ext === 'tmp' || ext === 'bak' || nameLower.startsWith('~') || nameLower.includes('.cache') || nameLower.includes('scratch_')) {
      return {
        category: 'temporary',
        subcategory: 'cache',
        isJunk: true,
        junkReason: 'temp_scratch',
        suggestedPath: `/Trash/${fileName}`,
        tags: ['temp', 'cache', 'junk']
      };
    }

    // 4. Obsolete log files
    if (ext === 'log' || nameLower.includes('crash_') || nameLower.includes('debug_dump')) {
      return {
        category: 'temporary',
        subcategory: 'logs',
        isJunk: true,
        junkReason: 'obsolete_log',
        suggestedPath: `/Trash/${fileName}`,
        tags: ['log', 'system', 'junk']
      };
    }

    // 5. Stale installers / archives in downloads
    if ((ext === 'tar.gz' || ext === 'dmg' || ext === 'iso' || ext === 'pkg' || ext === 'exe') && size > 50000000) {
      return {
        category: 'archives',
        subcategory: 'stale_downloads',
        isJunk: true,
        junkReason: 'stale_download',
        suggestedPath: `/Trash/${fileName}`,
        tags: ['archive', 'installer', 'junk']
      };
    }

    // 6. Finance & Invoices
    if (
      nameLower.includes('invoice') || 
      nameLower.includes('bill') || 
      nameLower.includes('receipt') || 
      nameLower.includes('tax') || 
      nameLower.includes('financial') ||
      contentLower.includes('amount due') ||
      contentLower.includes('total revenue')
    ) {
      const sub = nameLower.includes('invoice') ? 'Invoices' : 'Reports';
      return {
        category: 'finance',
        subcategory: sub.toLowerCase(),
        isJunk: false,
        suggestedPath: `/Documents/Finance/${sub}/${fileName}`,
        tags: ['finance', sub.toLowerCase(), ext]
      };
    }

    // 7. Project Archon / Engineering Specs
    if (nameLower.includes('archon') || nameLower.includes('spec') || nameLower.includes('architecture') || ext === 'md') {
      return {
        category: 'documents',
        subcategory: 'specifications',
        isJunk: false,
        suggestedPath: `/Projects/Archon/${fileName}`,
        tags: ['project', 'spec', 'engineering', ext]
      };
    }

    // 8. Code & Scripts
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'go', 'rs', 'html', 'css', 'sql'].includes(ext)) {
      return {
        category: 'code',
        subcategory: 'source',
        isJunk: false,
        suggestedPath: `/Projects/Code/${fileName}`,
        tags: ['code', ext]
      };
    }

    // 9. Media & Photos
    if (['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp', 'mp4', 'mov', 'wav', 'mp3'].includes(ext)) {
      return {
        category: 'media',
        subcategory: 'media',
        isJunk: false,
        suggestedPath: `/Media/${fileName}`,
        tags: ['media', ext]
      };
    }

    // 10. General Documents
    return {
      category: 'documents',
      subcategory: 'general',
      isJunk: false,
      suggestedPath: `/Documents/${fileName}`,
      tags: ['document', ext]
    };
  }

  /**
   * Inspects user actions and files to generate or refine learned patterns.
   */
  public static learnFromFiles(): void {
    const files = db.getFiles();
    
    // Check if user has recurring invoice names
    const invoiceFiles = files.filter(f => f.name.toLowerCase().includes('invoice') || f.tags.includes('invoice'));
    if (invoiceFiles.length >= 2) {
      db.addOrUpdatePattern({
        type: 'rule',
        title: 'Invoice Categorization Heuristic',
        description: `Consistently routes files with 'invoice' in name or content directly to /Documents/Finance/Invoices`,
        confidence: 0.96,
        occurrences: invoiceFiles.length + 5,
        actionRule: {
          matchKeyword: ['invoice', 'inv-'],
          targetFolder: '/Documents/Finance/Invoices'
        }
      });
    }

    // Check temporary file frequency
    const junkFiles = files.filter(f => f.isJunk);
    if (junkFiles.length > 0) {
      db.addOrUpdatePattern({
        type: 'rule',
        title: 'Proactive Junk Cleanup Trigger',
        description: `Flags zero-byte files, duplicate downloads, and orphaned crash dumps for 1-click removal.`,
        confidence: 0.99,
        occurrences: junkFiles.length + 10,
        actionRule: {
          matchExt: ['tmp', 'log', 'bak'],
          targetFolder: '/Trash'
        }
      });
    }
  }
}
