import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CloudOff,
  Download,
  Eye,
  FileJson,
  FileText,
  FileType2,
  LayoutTemplate,
  Loader2,
  Palette,
  PenLine,
  Printer,
  Redo2,
  Undo2,
} from 'lucide-react';
import type { Resume } from '../types/resume';
import { useResumeStore } from '../store/useResumeStore';
import { useEditorActions } from '../store/useEditorActions';
import { getTemplate } from '../templates/registry';
import { cvFilename, exportJson, printResume } from '../lib/print';
import { cx } from '../lib/utils';
import { PdfGuide, pdfGuideDismissed } from '../components/PdfGuide';
import { UserMenu } from '../components/account';
import { ContentPanel } from '../components/editor/ContentPanel';
import { DesignPanel } from '../components/editor/DesignPanel';
import { Preview } from '../components/Preview';
import { TemplateGallery } from '../components/TemplateGallery';
import { Dropdown, MenuItem, PromptDialog, Toast } from '../components/ui';

function SaveIndicator() {
  const status = useResumeStore((s) => s.saveStatus);
  if (status === 'saving')
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 size={13} className="animate-spin" /> Saving…
      </span>
    );
  if (status === 'error')
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-rose-600" title="Couldn’t reach the server. Your changes are kept here and retried automatically.">
        <CloudOff size={13} /> Not saved — retrying
      </span>
    );
  return (
    <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-600">
      <Check size={13} /> Saved
    </span>
  );
}

export function EditorPage({ resume, onBack }: { resume: Resume; onBack: () => void }) {
  const actions = useEditorActions();
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);
  const canUndo = useResumeStore((s) => s.history.past.length > 0);
  const canRedo = useResumeStore((s) => s.history.future.length > 0);
  const renameResume = useResumeStore((s) => s.renameResume);

  const [tab, setTab] = useState<'content' | 'design'>('content');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Global undo/redo shortcuts (override native input undo so history stays consistent)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo();
      } else if (k === 'p') {
        e.preventDefault();
        printResume(filenameRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const filename = cvFilename(resume);
  const filenameRef = useRef(filename);
  filenameRef.current = filename;
  const [pdfGuide, setPdfGuide] = useState(false);
  const onPdf = () => {
    if (pdfGuideDismissed()) printResume(filename);
    else setPdfGuide(true);
  };
  const tpl = getTemplate(resume.templateId);

  const onDocx = async () => {
    setExporting(true);
    try {
      const { exportDocx } = await import('../lib/exportDocx'); // lazy-load the docx library
      await exportDocx(resume);
      setToast('DOCX downloaded');
    } catch (e) {
      console.error(e);
      setToast('DOCX export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center gap-2 px-3 sm:px-4 z-30">
        <button className="btn-icon" onClick={onBack} title="All resumes">
          <ArrowLeft size={18} />
        </button>
        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-brand-600 text-white items-center justify-center font-bold text-sm">CV</div>
        <button
          className="group min-w-0 flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-slate-100"
          onClick={() => setRenaming(true)}
          title="Rename"
        >
          <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[260px]">{resume.name}</span>
          <PenLine size={13} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
        </button>
        <SaveIndicator />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="flex items-center">
            <button className="btn-icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo2 size={17} />
            </button>
            <button className="btn-icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
              <Redo2 size={17} />
            </button>
          </div>
          <span className="hidden sm:block h-6 w-px bg-slate-200" />
          <button className="btn-secondary hidden sm:inline-flex" onClick={() => setGalleryOpen(true)}>
            <LayoutTemplate size={16} /> <span className="hidden lg:inline">Templates</span>
            <span className="hidden xl:inline text-slate-400 font-normal">· {tpl.name}</span>
          </button>
          <Dropdown
            trigger={(open) => (
              <button className="btn-primary">
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span className="hidden sm:inline">Download</span>
                <ChevronDown size={14} className={cx('transition-transform', open && 'rotate-180')} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  icon={<FileText size={16} />}
                  hint="Clean A4 PDF · Save as PDF"
                  onClick={() => {
                    close();
                    onPdf();
                  }}
                >
                  Download PDF
                </MenuItem>
                <MenuItem
                  icon={<FileType2 size={16} />}
                  hint="Editable Word document (ATS layout)"
                  onClick={() => {
                    close();
                    onDocx();
                  }}
                >
                  Download DOCX
                </MenuItem>
                <MenuItem
                  icon={<Printer size={16} />}
                  hint="Ctrl+P"
                  onClick={() => {
                    close();
                    printResume(filename);
                  }}
                >
                  Print
                </MenuItem>
                <div className="my-1 border-t border-slate-100" />
                <MenuItem
                  icon={<FileJson size={16} />}
                  hint="Backup you can import later"
                  onClick={() => {
                    close();
                    exportJson(resume);
                  }}
                >
                  Export data (JSON)
                </MenuItem>
              </>
            )}
          </Dropdown>
          <span className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="hidden sm:block">
            <UserMenu onToast={setToast} />
          </div>
        </div>
      </header>

      {/* Mobile view switch */}
      <div className="lg:hidden shrink-0 bg-white border-b border-slate-200 p-2">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          {(['edit', 'preview'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setMobileView(v)}
              className={cx(
                'rounded-md py-1.5 text-sm font-medium inline-flex items-center justify-center gap-1.5',
                mobileView === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
              )}
            >
              {v === 'edit' ? <PenLine size={14} /> : <Eye size={14} />}
              {v === 'edit' ? 'Editor' : 'Preview'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Editor */}
        <aside
          className={cx(
            'w-full lg:w-[46%] xl:w-[44%] 2xl:w-[40%] shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col min-h-0',
            mobileView === 'preview' && 'hidden lg:flex',
          )}
        >
          <div className="px-4 pt-4 shrink-0">
            <div className="inline-flex rounded-lg bg-white border border-slate-200 p-1 shadow-card">
              {(
                [
                  ['content', 'Content', PenLine],
                  ['design', 'Design', Palette],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition',
                    tab === id ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {tab === 'content' ? (
              <ContentPanel resume={resume} actions={actions} />
            ) : (
              <DesignPanel resume={resume} actions={actions} onOpenGallery={() => setGalleryOpen(true)} />
            )}
            <div className="h-10" />
          </div>
        </aside>

        {/* Live preview */}
        <section className={cx('flex-1 min-w-0 bg-slate-100/80', mobileView === 'edit' && 'hidden lg:block')}>
          <Preview resume={resume} />
        </section>
      </div>

      <TemplateGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} resume={resume} onSelect={actions.setTemplate} />
      <PromptDialog
        open={renaming}
        title="Rename resume"
        initial={resume.name}
        onCancel={() => setRenaming(false)}
        onSubmit={(v) => {
          renameResume(resume.id, v);
          setRenaming(false);
        }}
      />
      <PdfGuide
        open={pdfGuide}
        onClose={() => setPdfGuide(false)}
        onContinue={() => {
          setPdfGuide(false);
          printResume(filename);
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
