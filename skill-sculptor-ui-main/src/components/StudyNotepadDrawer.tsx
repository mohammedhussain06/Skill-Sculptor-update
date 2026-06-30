import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, FileText, Download, Printer, Edit3, Eye, Bold, Code, List, Heading, CheckSquare, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudyNotepadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapId: string;
  stepIdx: number;
  stepTitle: string;
}

export function StudyNotepadDrawer({ isOpen, onClose, roadmapId, stepIdx, stepTitle }: StudyNotepadDrawerProps) {
  const [noteText, setNoteText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `notes_${roadmapId}_${stepIdx}`;

  // Load notes on open
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(storageKey);
      setNoteText(saved || '');
    }
  }, [isOpen, storageKey]);

  // Auto-save logic with 500ms debounce
  const handleTextChange = (val: string) => {
    setNoteText(val);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(storageKey, val);
      setIsSaving(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Markdown Formatter helper inserts token at cursor position
  const insertMarkdownToken = (token: string, placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const selected = text.substring(start, end) || placeholder;
    const after = text.substring(end, text.length);

    const replacement = token.includes('$1') 
      ? token.replace('$1', selected) 
      : `${token}${selected}`;

    const newText = `${before}${replacement}${after}`;
    handleTextChange(newText);

    // Reposition cursor after inserting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Convert markdown to rich HTML safely
  const parseMarkdownToHtml = (mdText: string) => {
    if (!mdText.trim()) {
      return `<p class="text-muted-foreground italic text-sm">No notes written yet. Start typing in the "Write" tab, or use formatting shortcuts above!</p>`;
    }

    let html = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-extrabold text-foreground mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-black text-foreground mt-5 mb-2 border-b border-border/40 pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-foreground mt-6 mb-3 border-b border-border/70 pb-1.5">$1</h1>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre class="bg-muted p-4 rounded-xl text-xs font-mono my-3 border border-border/50 text-foreground overflow-x-auto"><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary font-bold">$1</code>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-muted-foreground">$1</em>');

    // Checkboxes (Tasks)
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 text-xs font-semibold text-success my-1"><span>✓</span><span class="line-through opacity-70">$1</span></div>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground my-1"><span>○</span><span>$1</span></div>');

    // Unordered lists
    html = html.replace(/^- (.*$)/gim, '<li class="list-disc ml-4 my-1 pl-1 text-xs text-muted-foreground">$1</li>');

    // Paragraph splits
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<div') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p class="my-2 leading-relaxed text-sm text-foreground/90">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');

    return html;
  };

  // Export Notes as markdown file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([noteText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Clean step title for filename
    const cleanTitle = stepTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `level_${stepIdx + 1}_${cleanTitle}_notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print notes using hidden iframe trick (prints ONLY the notes with premium clean styles)
  const handlePrintNotes = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const htmlContent = parseMarkdownToHtml(noteText);
    const cleanTitle = `Level ${stepIdx + 1} - ${stepTitle} Study Notes`;

    doc.write(`
      <html>
        <head>
          <title>${cleanTitle}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1a1a1a;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 24px; border-bottom: 2px solid #eaeaea; padding-bottom: 8px; margin-top: 30px; }
            h2 { font-size: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 6px; margin-top: 25px; }
            h3 { font-size: 16px; margin-top: 20px; }
            pre { background: #f6f8fa; padding: 16px; border-radius: 8px; font-family: monospace; overflow-x: auto; font-size: 13px; border: 1px solid #e1e4e8; }
            code { background: rgba(27,31,35,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
            p { font-size: 14px; margin-bottom: 16px; }
            li { font-size: 14px; }
            .header-info { margin-bottom: 40px; border-bottom: 3px double #ddd; padding-bottom: 15px; }
            .header-info p { margin: 4px 0; color: #555; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1 style="margin: 0; border: 0; padding: 0;">${cleanTitle}</h1>
            <p>SkillSculptor study campaign workspace notes.</p>
            <p>Printed on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div>${htmlContent}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return createPortal(
    <>
      {/* Drawer Overlay Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[500px] bg-card border-l border-border/80 shadow-2xl flex flex-col transition-all duration-300 transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-sm sm:text-base font-black text-foreground truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Level {stepIdx + 1} Study Notes
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-1">
              For: {stepTitle}
            </p>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab switchers and actions toolbar */}
        <div className="px-4 py-2 border-b border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-2.5">
          {/* Tab Controller */}
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab('write')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all",
                activeTab === 'write' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Write
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all",
                activeTab === 'preview' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              onClick={handleDownloadMarkdown}
              className="w-7 h-7 rounded-md border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Download Notes (.md)"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handlePrintNotes}
              className="w-7 h-7 rounded-md border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Print Notes / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Formatting Shortcuts Toolbar (Write tab only) */}
        {activeTab === 'write' && (
          <div className="px-4 py-1.5 border-b border-border/40 bg-card flex flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => insertMarkdownToken('**$1**', 'boldtext')}
              className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              title="Bold text"
            >
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => insertMarkdownToken('### ', 'Heading')}
              className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground animate-none"
              title="Heading 3"
            >
              <Heading className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => insertMarkdownToken('- [ ] ', 'Task')}
              className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              title="Task checklist"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => insertMarkdownToken('- ', 'List item')}
              className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              title="Unordered list"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => insertMarkdownToken('```javascript\n$1\n```', 'code')}
              className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              title="Code block"
            >
              <Code className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Main Note Canvas Area */}
        <div className="flex-1 min-h-0 bg-card">
          {activeTab === 'write' ? (
            <textarea
              ref={textareaRef}
              value={noteText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Write down your level study notes here...

Use formatting shortcuts above or Markdown directly:
# Header 1
## Header 2
**Bold Text**
- [ ] Checklist items
\`code blocks\`
`}
              className="w-full h-full p-4 sm:p-5 text-sm font-medium bg-card text-foreground placeholder:text-muted-foreground/50 border-0 outline-none resize-none focus:ring-0 focus:outline-none focus:border-0 font-sans"
              style={{ lineHeight: '1.6' }}
            />
          ) : (
            <div 
              className="w-full h-full p-5 sm:p-6 overflow-y-auto prose dark:prose-invert max-w-none prose-sm"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(noteText) }}
            />
          )}
        </div>

        {/* Drawer Footer Status */}
        <div className="p-3 border-t border-border flex items-center justify-between text-[10px] font-bold text-muted-foreground bg-muted/10 uppercase tracking-wider px-4 shrink-0">
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Saving draft...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>Draft Saved to local workspace</span>
              </>
            )}
          </div>
          <div>
            {noteText.length} Characters
          </div>
        </div>

      </div>
    </>
    , document.body
  );
}
