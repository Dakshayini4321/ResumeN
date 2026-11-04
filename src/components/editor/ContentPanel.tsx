import { useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Briefcase,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  GraduationCap,
  GripVertical,
  HeartHandshake,
  Languages,
  LayoutList,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import type { ListKey, Resume, SectionMeta, SectionType } from '../../types/resume';
import type { EditorActions } from '../../store/useEditorActions';
import { BUILTIN_ORDER, SECTION_LABELS } from '../../lib/defaults';
import { cx } from '../../lib/utils';
import { ConfirmDialog, Dropdown, MenuItem, PromptDialog } from '../ui';
import { PersonalForm } from './PersonalForm';
import { CustomEditor, ListEditor, SummaryEditor } from './SectionForms';

export const SECTION_ICONS: Record<SectionType, typeof User> = {
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderGit2,
  certifications: Award,
  languages: Languages,
  achievements: Trophy,
  references: Users,
  volunteering: HeartHandshake,
  custom: LayoutList,
};

function count(section: SectionMeta, resume: Resume): number | null {
  if (section.type === 'summary') return null;
  if (section.type === 'custom') return (resume.data.custom[section.id] ?? []).length;
  return (resume.data[section.type] as unknown[]).length;
}

function Panel({
  icon,
  title,
  open,
  onToggle,
  children,
  controls,
  badge,
  muted,
  dragProps,
  dragOver,
  onHandleDown,
}: {
  onHandleDown?: () => void;
  icon: ReactNode;
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  controls?: ReactNode;
  badge?: number | null;
  muted?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  dragOver?: boolean;
}) {
  return (
    <div
      {...dragProps}
      className={cx('card transition-shadow', dragOver && 'ring-2 ring-brand-400', muted && 'opacity-60')}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {dragProps ? (
          <span
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
            title="Drag to reorder"
            onMouseDown={onHandleDown}
          >
            <GripVertical size={16} />
          </span>
        ) : (
          <span className="w-4" />
        )}
        <button onClick={onToggle} className="flex-1 min-w-0 flex items-center gap-3 text-left">
          <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">{icon}</span>
          <span className="font-semibold text-[15px] text-slate-800 truncate">{title}</span>
          {badge != null && badge > 0 && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{badge}</span>
          )}
          <ChevronDown size={16} className={cx('ml-auto shrink-0 text-slate-400 transition-transform', !open && '-rotate-90')} />
        </button>
        {controls && <div className="flex items-center">{controls}</div>}
      </div>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

export function ContentPanel({ resume, actions }: { resume: Resume; actions: EditorActions }) {
  const [open, setOpen] = useState<Set<string>>(new Set(['personal']));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<SectionMeta | null>(null);
  const [renaming, setRenaming] = useState<SectionMeta | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);

  const sections = resume.data.sections;
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const missing = BUILTIN_ORDER.filter((t) => !sections.some((s) => s.type === t));

  const body = (s: SectionMeta) => {
    if (s.type === 'summary') return <SummaryEditor resume={resume} actions={actions} />;
    if (s.type === 'custom') return <CustomEditor section={s} resume={resume} actions={actions} />;
    return <ListEditor listKey={s.type as ListKey} resume={resume} actions={actions} />;
  };

  return (
    <div className="space-y-3">
      <Panel icon={<User size={16} />} title="Personal Information" open={open.has('personal')} onToggle={() => toggle('personal')}>
        <PersonalForm resume={resume} actions={actions} />
      </Panel>

      {sections.map((s, idx) => {
        const Icon = SECTION_ICONS[s.type];
        return (
          <Panel
            key={s.id}
            icon={<Icon size={16} />}
            title={s.title}
            badge={count(s, resume)}
            open={open.has(s.id)}
            onToggle={() => toggle(s.id)}
            muted={!s.visible}
            dragOver={overIdx === idx && dragIdx !== idx}
            onHandleDown={() => setArmed(idx)}
            dragProps={{
              // only draggable while the grip handle is pressed, so text selection in inputs keeps working
              draggable: armed === idx,
              onMouseUp: () => setArmed(null),
              onDragStart: (e) => {
                setDragIdx(idx);
                e.dataTransfer.effectAllowed = 'move';
              },
              onDragOver: (e) => {
                if (dragIdx === null) return;
                e.preventDefault();
                setOverIdx(idx);
              },
              onDragLeave: () => setOverIdx((o) => (o === idx ? null : o)),
              onDrop: (e) => {
                e.preventDefault();
                if (dragIdx !== null && dragIdx !== idx) actions.moveSection(dragIdx, idx);
                setDragIdx(null);
                setOverIdx(null);
              },
              onDragEnd: () => {
                setArmed(null);
                setDragIdx(null);
                setOverIdx(null);
              },
            }}
            controls={
              <>
                <button className="btn-icon" title="Rename section" onClick={() => setRenaming(s)}>
                  <Pencil size={14} />
                </button>
                <button className="btn-icon" title={s.visible ? 'Hide from CV' : 'Show on CV'} onClick={() => actions.toggleSection(s.id)}>
                  {s.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button className="btn-icon hidden sm:inline-flex" title="Move up" disabled={idx === 0} onClick={() => actions.moveSection(idx, idx - 1)}>
                  <ArrowUp size={15} />
                </button>
                <button
                  className="btn-icon hidden sm:inline-flex"
                  title="Move down"
                  disabled={idx === sections.length - 1}
                  onClick={() => actions.moveSection(idx, idx + 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button className="btn-icon hover:!text-rose-600 hover:!bg-rose-50" title="Delete section" onClick={() => setToDelete(s)}>
                  <Trash2 size={15} />
                </button>
              </>
            }
          >
            {body(s)}
          </Panel>
        );
      })}

      <Dropdown
        align="left"
        trigger={() => (
          <button className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3.5 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 hover:bg-white transition">
            <Plus size={16} /> Add section
          </button>
        )}
      >
        {(close) => (
          <div className="max-h-80 overflow-auto">
            {missing.map((t) => {
              const Icon = SECTION_ICONS[t];
              return (
                <MenuItem
                  key={t}
                  icon={<Icon size={15} />}
                  onClick={() => {
                    const id = actions.addSection(t);
                    setOpen((o) => new Set(o).add(id));
                    close();
                  }}
                >
                  {SECTION_LABELS[t]}
                </MenuItem>
              );
            })}
            {missing.length > 0 && <div className="my-1 border-t border-slate-100" />}
            <MenuItem
              icon={<BookOpen size={15} />}
              hint="Publications, awards, interests…"
              onClick={() => {
                setAddingCustom(true);
                close();
              }}
            >
              Custom section
            </MenuItem>
          </div>
        )}
      </Dropdown>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete “${toDelete?.title}”?`}
        message={
          toDelete?.type === 'custom'
            ? 'This custom section and all of its entries will be removed. You can undo this with Ctrl+Z.'
            : 'The section will be removed from your CV. Its content is kept, so re-adding it from “Add section” restores everything.'
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) actions.removeSection(toDelete.id);
          setToDelete(null);
        }}
      />
      <PromptDialog
        open={!!renaming}
        title="Rename section"
        initial={renaming?.title ?? ''}
        onCancel={() => setRenaming(null)}
        onSubmit={(v) => {
          if (renaming) actions.renameSection(renaming.id, v);
          setRenaming(null);
        }}
      />
      <PromptDialog
        open={addingCustom}
        title="New custom section"
        initial="Publications"
        confirmLabel="Add section"
        onCancel={() => setAddingCustom(false)}
        onSubmit={(v) => {
          const id = actions.addSection('custom', v);
          setOpen((o) => new Set(o).add(id));
          setAddingCustom(false);
        }}
      />
    </div>
  );
}
