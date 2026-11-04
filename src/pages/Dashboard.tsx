import { useRef, useState } from 'react';
import { Copy, FilePlus2, MoreHorizontal, PenLine, Plus, ScanSearch, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import type { Resume } from '../types/resume';
import { clearLegacyLocalResumes, legacyLocalResumes, useResumeStore } from '../store/useResumeStore';
import { useAuthStore } from '../store/useAuthStore';
import { UserMenu } from '../components/account';
import { TEMPLATES, getTemplate } from '../templates/registry';
import { timeAgo } from '../lib/utils';
import { TemplateThumb } from '../components/TemplateThumb';
import { CategoryBadge } from '../components/TemplateGallery';
import { ConfirmDialog, Dropdown, MenuItem, PromptDialog, Toast } from '../components/ui';

export function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const resumes = useResumeStore((s) => s.resumes);
  const create = useResumeStore((s) => s.createResume);
  const duplicate = useResumeStore((s) => s.duplicateResume);
  const rename = useResumeStore((s) => s.renameResume);
  const remove = useResumeStore((s) => s.deleteResume);
  const importResume = useResumeStore((s) => s.importResume);

  const [renaming, setRenaming] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState<Resume | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [legacy, setLegacy] = useState<Resume[]>(legacyLocalResumes);
  const user = useAuthStore((s) => s.user);

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Resume;
      if (!parsed?.data?.personal || !Array.isArray(parsed.data.sections)) throw new Error('invalid');
      const id = importResume(parsed);
      setToast('Resume imported');
      onOpen(id);
    } catch {
      setToast('That file is not a valid CV backup');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const sorted = [...resumes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">CV</div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">CVForge</span>
          <span className="hidden sm:inline text-xs text-slate-400 ml-1">Professional CV Builder</span>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> <span className="hidden sm:inline">Import</span>
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
            <button className="btn-primary" onClick={() => onOpen(create('Untitled CV'))}>
              <Plus size={16} /> <span className="hidden sm:inline">New CV</span>
            </button>
            <span className="hidden sm:block h-6 w-px bg-slate-200 mx-1" />
            <UserMenu onToast={setToast} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {legacy.length > 0 && (
          <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                {legacy.length} CV{legacy.length === 1 ? ' was' : 's were'} found saved in this browser
              </span>{' '}
              from before accounts were added. Import {legacy.length === 1 ? 'it' : 'them'} into your account?
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="btn-ghost"
                onClick={() => {
                  clearLegacyLocalResumes();
                  setLegacy([]);
                }}
              >
                Dismiss
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  legacy.forEach((r) => importResume(r));
                  clearLegacyLocalResumes();
                  setToast(`${legacy.length} CV${legacy.length === 1 ? '' : 's'} imported to your account`);
                  setLegacy([]);
                }}
              >
                Import to my account
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {user?.fullName ? `${user.fullName.split(' ')[0]}’s resumes` : 'Your resumes'}
            </h1>
            <p className="text-slate-500 mt-1">
              Enter your details once — switch between {TEMPLATES.length} templates instantly. Everything autosaves to your private account.
            </p>
          </div>
          <div className="flex gap-2 text-xs whitespace-nowrap shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 font-medium">
              <ScanSearch size={13} /> {TEMPLATES.filter((t) => t.category === 'ats').length} ATS templates
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 text-violet-700 px-3 py-1.5 font-medium">
              <Sparkles size={13} /> {TEMPLATES.filter((t) => t.category === 'professional').length} professional
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Create cards */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => onOpen(create('Untitled CV'))}
              className="flex-1 min-h-[150px] rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/40 transition flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-brand-700 p-6"
            >
              <span className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <FilePlus2 size={22} />
              </span>
              <span className="font-semibold">Blank CV</span>
              <span className="text-xs text-slate-400">Start from scratch</span>
            </button>
            <button
              onClick={() => onOpen(create('Example CV', true))}
              className="flex-1 min-h-[150px] rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-600 to-indigo-700 text-white hover:shadow-soft transition flex flex-col items-center justify-center gap-2 p-6"
            >
              <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Wand2 size={22} />
              </span>
              <span className="font-semibold">Start from example</span>
              <span className="text-xs text-white/70">Pre-filled content to edit</span>
            </button>
          </div>

          {sorted.map((r) => {
            const tpl = getTemplate(r.templateId);
            return (
              <div key={r.id} className="group card overflow-hidden hover:shadow-soft transition">
                <button className="block w-full bg-slate-100 p-4 pb-0 overflow-hidden" onClick={() => onOpen(r.id)}>
                  <div className="mx-auto w-fit shadow-card rounded-t-md overflow-hidden h-[220px] group-hover:-translate-y-1 transition-transform">
                    <TemplateThumb resume={r} templateId={r.templateId} width={200} />
                  </div>
                </button>
                <div className="p-4 flex items-start gap-2 border-t border-slate-100">
                  <button className="flex-1 min-w-0 text-left" onClick={() => onOpen(r.id)}>
                    <div className="font-semibold text-slate-900 truncate">{r.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{tpl.name}</span>·<span>Edited {timeAgo(r.updatedAt)}</span>
                    </div>
                    <div className="mt-2">
                      <CategoryBadge category={tpl.category} />
                    </div>
                  </button>
                  <Dropdown
                    trigger={() => (
                      <button className="btn-icon" aria-label="Resume actions">
                        <MoreHorizontal size={18} />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem icon={<PenLine size={15} />} onClick={() => (close(), onOpen(r.id))}>
                          Open editor
                        </MenuItem>
                        <MenuItem icon={<PenLine size={15} />} onClick={() => (close(), setRenaming(r))}>
                          Rename
                        </MenuItem>
                        <MenuItem
                          icon={<Copy size={15} />}
                          onClick={() => {
                            close();
                            duplicate(r.id);
                            setToast('Resume duplicated');
                          }}
                        >
                          Duplicate
                        </MenuItem>
                        <div className="my-1 border-t border-slate-100" />
                        <MenuItem icon={<Trash2 size={15} />} danger onClick={() => (close(), setDeleting(r))}>
                          Delete
                        </MenuItem>
                      </>
                    )}
                  </Dropdown>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <PromptDialog
        open={!!renaming}
        title="Rename resume"
        initial={renaming?.name ?? ''}
        onCancel={() => setRenaming(null)}
        onSubmit={(v) => {
          if (renaming) rename(renaming.id, v);
          setRenaming(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete “${deleting?.name}”?`}
        message="This resume will be permanently removed from your account. Consider exporting a JSON backup first."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove(deleting.id);
          setDeleting(null);
          setToast('Resume deleted');
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
