import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';
import type { CustomItem, ListItemMap, ListKey, Resume, SectionMeta } from '../../types/resume';
import type { EditorActions } from '../../store/useEditorActions';
import { cx, formatRange } from '../../lib/utils';
import { BULLET_HINT, DateRange, TextArea, TextField } from './Fields';

/* ------------------------------------------------------------------ */
/* Collapsible item card with reorder / duplicate / delete controls    */
/* ------------------------------------------------------------------ */

function ItemCard({
  title,
  subtitle,
  open,
  onToggle,
  onUp,
  onDown,
  onDuplicate,
  onDelete,
  isFirst,
  isLast,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cx('rounded-lg border bg-white transition', open ? 'border-brand-200 ring-4 ring-brand-500/5' : 'border-slate-200')}>
      <div className="flex items-center gap-1 pl-3 pr-1.5 py-1.5">
        <button className="flex-1 min-w-0 flex items-center gap-2 text-left py-1" onClick={onToggle}>
          <ChevronDown size={15} className={cx('shrink-0 text-slate-400 transition-transform', !open && '-rotate-90')} />
          <span className="min-w-0">
            <span className={cx('block truncate text-sm font-medium', title ? 'text-slate-800' : 'text-slate-400 italic')}>
              {title || 'Untitled entry'}
            </span>
            {subtitle && <span className="block truncate text-xs text-slate-500">{subtitle}</span>}
          </span>
        </button>
        <button className="btn-icon !w-7 !h-7" title="Move up" onClick={onUp} disabled={isFirst}>
          <ArrowUp size={14} />
        </button>
        <button className="btn-icon !w-7 !h-7" title="Move down" onClick={onDown} disabled={isLast}>
          <ArrowDown size={14} />
        </button>
        <button className="btn-icon !w-7 !h-7" title="Duplicate" onClick={onDuplicate}>
          <Copy size={14} />
        </button>
        <button className="btn-icon !w-7 !h-7 hover:!text-rose-600 hover:!bg-rose-50" title="Delete" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
      {open && <div className="px-3 pb-4 pt-1 space-y-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/50 transition"
    >
      <Plus size={15} /> {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Per-type field layouts                                              */
/* ------------------------------------------------------------------ */

type FormProps<K extends ListKey> = {
  item: ListItemMap[K];
  set: (patch: Partial<ListItemMap[K]>) => void;
};

const forms: { [K in ListKey]: (p: FormProps<K>) => JSX.Element } = {
  experience: ({ item, set }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField label="Job title" value={item.position} onChange={(v) => set({ position: v })} placeholder="Product Manager" />
        <TextField label="Company" value={item.company} onChange={(v) => set({ company: v })} placeholder="Acme Inc." />
      </div>
      <TextField label="Location" value={item.location} onChange={(v) => set({ location: v })} placeholder="City, Country / Remote" />
      <DateRange start={item.startDate} end={item.endDate} current={item.current} onChange={set} />
      <TextArea
        label="Description & achievements"
        hint={BULLET_HINT}
        rows={5}
        value={item.description}
        onChange={(v) => set({ description: v })}
        placeholder={'- Led a team of 8 to launch ...\n- Increased revenue by 20% ...'}
      />
    </>
  ),
  education: ({ item, set }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField label="Degree / Qualification" value={item.degree} onChange={(v) => set({ degree: v })} placeholder="B.Sc. Computer Science" />
        <TextField label="School / University" value={item.institution} onChange={(v) => set({ institution: v })} placeholder="University name" />
        <TextField label="Location" value={item.location} onChange={(v) => set({ location: v })} />
        <TextField label="Grade / GPA (optional)" value={item.grade} onChange={(v) => set({ grade: v })} placeholder="First Class / GPA 3.8" />
      </div>
      <DateRange start={item.startDate} end={item.endDate} current={item.current} onChange={set} currentLabel="Currently studying" />
      <TextArea label="Details (optional)" hint={BULLET_HINT} rows={3} value={item.description} onChange={(v) => set({ description: v })} />
    </>
  ),
  skills: ({ item, set }) => (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
      <TextField label="Skill" value={item.name} onChange={(v) => set({ name: v })} placeholder="e.g. Project Management" />
      <div>
        <span className="label">Level</span>
        <div className="flex gap-1 h-[38px] items-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => set({ level: n })}
              title={['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][n - 1]}
              className={cx('w-6 h-6 rounded-md border transition', n <= item.level ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300 hover:border-brand-400')}
            />
          ))}
        </div>
      </div>
    </div>
  ),
  projects: ({ item, set }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField label="Project name" value={item.name} onChange={(v) => set({ name: v })} />
        <TextField label="Role (optional)" value={item.role} onChange={(v) => set({ role: v })} />
      </div>
      <TextField label="Link (optional)" value={item.link} onChange={(v) => set({ link: v })} placeholder="github.com/you/project" />
      <DateRange start={item.startDate} end={item.endDate} onChange={set} />
      <TextArea label="Description" hint={BULLET_HINT} rows={3} value={item.description} onChange={(v) => set({ description: v })} />
    </>
  ),
  certifications: ({ item, set }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField label="Certification" value={item.name} onChange={(v) => set({ name: v })} className="sm:col-span-2" />
      <TextField label="Issuer" value={item.issuer} onChange={(v) => set({ issuer: v })} />
      <TextField label="Date" type="month" value={item.date} onChange={(v) => set({ date: v })} />
      <TextField label="Credential link (optional)" value={item.link} onChange={(v) => set({ link: v })} className="sm:col-span-2" />
    </div>
  ),
  languages: ({ item, set }) => (
    <div className="grid grid-cols-2 gap-3">
      <TextField label="Language" value={item.name} onChange={(v) => set({ name: v })} />
      <label className="block">
        <span className="label">Proficiency</span>
        <select className="input" value={item.proficiency} onChange={(e) => set({ proficiency: e.target.value })}>
          {['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
    </div>
  ),
  achievements: ({ item, set }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
        <TextField label="Achievement" value={item.title} onChange={(v) => set({ title: v })} />
        <TextField label="Date" type="month" value={item.date} onChange={(v) => set({ date: v })} />
      </div>
      <TextArea label="Description (optional)" rows={2} value={item.description} onChange={(v) => set({ description: v })} />
    </>
  ),
  volunteering: ({ item, set }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField label="Role" value={item.role} onChange={(v) => set({ role: v })} placeholder="Volunteer Mentor" />
        <TextField label="Organization" value={item.organization} onChange={(v) => set({ organization: v })} placeholder="Charity / NGO" />
      </div>
      <TextField label="Location" value={item.location} onChange={(v) => set({ location: v })} />
      <DateRange start={item.startDate} end={item.endDate} current={item.current} onChange={set} currentLabel="Ongoing" />
      <TextArea label="Description" hint={BULLET_HINT} rows={3} value={item.description} onChange={(v) => set({ description: v })} />
    </>
  ),
  references: ({ item, set }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField label="Name" value={item.name} onChange={(v) => set({ name: v })} />
      <TextField label="Position" value={item.position} onChange={(v) => set({ position: v })} />
      <TextField label="Company" value={item.company} onChange={(v) => set({ company: v })} />
      <TextField label="Email" value={item.email} onChange={(v) => set({ email: v })} />
      <TextField label="Phone" value={item.phone} onChange={(v) => set({ phone: v })} />
    </div>
  ),
};

function itemSummary(key: ListKey, item: ListItemMap[ListKey]): { title: string; subtitle?: string } {
  const i = item as unknown as Record<string, string | boolean | number>;
  switch (key) {
    case 'experience':
      return { title: [i.position, i.company].filter(Boolean).join(' at '), subtitle: formatRange(i.startDate as string, i.endDate as string, i.current as boolean) };
    case 'education':
      return { title: (i.degree as string) || (i.institution as string), subtitle: i.degree ? (i.institution as string) : undefined };
    case 'skills':
      return { title: i.name as string };
    case 'projects':
      return { title: i.name as string, subtitle: i.role as string };
    case 'certifications':
      return { title: i.name as string, subtitle: i.issuer as string };
    case 'languages':
      return { title: i.name as string, subtitle: i.proficiency as string };
    case 'achievements':
      return { title: i.title as string };
    case 'references':
      return { title: i.name as string, subtitle: [i.position, i.company].filter(Boolean).join(', ') };
    case 'volunteering':
      return { title: [i.role, i.organization].filter(Boolean).join(' at '), subtitle: formatRange(i.startDate as string, i.endDate as string, i.current as boolean) };
  }
}

const ADD_LABEL: Record<ListKey, string> = {
  experience: 'Add work experience',
  education: 'Add education',
  skills: 'Add skill',
  projects: 'Add project',
  certifications: 'Add certification',
  languages: 'Add language',
  achievements: 'Add achievement',
  references: 'Add reference',
  volunteering: 'Add volunteering',
};

/* ------------------------------------------------------------------ */
/* List editors                                                        */
/* ------------------------------------------------------------------ */

export function ListEditor<K extends ListKey>({ listKey, resume, actions }: { listKey: K; resume: Resume; actions: EditorActions }) {
  const items = resume.data[listKey] as ListItemMap[K][];
  const [open, setOpen] = useState<Set<string>>(() => new Set(items.length === 1 ? [items[0].id] : []));
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const Form = forms[listKey] as (p: FormProps<K>) => JSX.Element;

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No entries yet.</p>}
      {items.map((item, idx) => {
        const sum = itemSummary(listKey, item);
        return (
          <ItemCard
            key={item.id}
            title={sum.title}
            subtitle={sum.subtitle}
            open={open.has(item.id)}
            onToggle={() => toggle(item.id)}
            onUp={() => actions.moveItem(listKey, item.id, -1)}
            onDown={() => actions.moveItem(listKey, item.id, 1)}
            onDuplicate={() => actions.duplicateItem(listKey, item.id)}
            onDelete={() => actions.removeItem(listKey, item.id)}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
          >
            <Form item={item} set={(patch) => actions.updateItem(listKey, item.id, patch)} />
          </ItemCard>
        );
      })}
      <AddButton
        label={ADD_LABEL[listKey]}
        onClick={() => {
          const id = actions.addItem(listKey);
          setOpen((s) => new Set(s).add(id));
        }}
      />
    </div>
  );
}

export function CustomEditor({ section, resume, actions }: { section: SectionMeta; resume: Resume; actions: EditorActions }) {
  const items: CustomItem[] = resume.data.custom[section.id] ?? [];
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No entries yet.</p>}
      {items.map((item, idx) => (
        <ItemCard
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          open={open.has(item.id)}
          onToggle={() => toggle(item.id)}
          onUp={() => actions.moveCustomItem(section.id, item.id, -1)}
          onDown={() => actions.moveCustomItem(section.id, item.id, 1)}
          onDuplicate={() => actions.duplicateCustomItem(section.id, item.id)}
          onDelete={() => actions.removeCustomItem(section.id, item.id)}
          isFirst={idx === 0}
          isLast={idx === items.length - 1}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Title" value={item.title} onChange={(v) => actions.updateCustomItem(section.id, item.id, { title: v })} />
            <TextField label="Subtitle" value={item.subtitle} onChange={(v) => actions.updateCustomItem(section.id, item.id, { subtitle: v })} />
            <TextField label="Date" type="month" value={item.date} onChange={(v) => actions.updateCustomItem(section.id, item.id, { date: v })} />
          </div>
          <TextArea
            label="Description"
            hint={BULLET_HINT}
            rows={3}
            value={item.description}
            onChange={(v) => actions.updateCustomItem(section.id, item.id, { description: v })}
          />
        </ItemCard>
      ))}
      <AddButton
        label="Add entry"
        onClick={() => {
          const id = actions.addCustomItem(section.id);
          setOpen((s) => new Set(s).add(id));
        }}
      />
    </div>
  );
}

export function SummaryEditor({ resume, actions }: { resume: Resume; actions: EditorActions }) {
  const len = resume.data.summary.length;
  return (
    <TextArea
      label="Summary"
      hint={`${len} characters · aim for 300–600`}
      rows={5}
      value={resume.data.summary}
      onChange={actions.setSummary}
      placeholder="A results-driven professional with X years of experience in ..."
    />
  );
}
