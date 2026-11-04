import { Check, LayoutTemplate, RotateCcw } from 'lucide-react';
import type { PhotoShape, Resume } from '../../types/resume';
import type { EditorActions } from '../../store/useEditorActions';
import { ACCENT_PRESETS, FONT_OPTIONS, getFont } from '../../lib/fonts';
import { TEMPLATES, getTemplate } from '../../templates/registry';
import { cx } from '../../lib/utils';
import { Segmented, Toggle } from '../ui';
import { CategoryBadge } from '../TemplateGallery';
import { TemplateThumb } from '../TemplateThumb';

const PHOTO_TEMPLATES = TEMPLATES.filter((t) => t.supportsPhoto)
  .map((t) => t.name)
  .join(', ');

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DesignPanel({ resume, actions, onOpenGallery }: { resume: Resume; actions: EditorActions; onOpenGallery: () => void }) {
  const tpl = getTemplate(resume.templateId);
  const s = resume.settings;
  const effectiveAccent = s.accentColor || tpl.defaults.accent;
  const effectiveFont = s.fontFamily || tpl.defaults.font;

  return (
    <div className="space-y-3">
      <Card
        title="Template"
        action={
          <button className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1" onClick={onOpenGallery}>
            <LayoutTemplate size={13} /> Open gallery
          </button>
        }
      >
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => actions.setTemplate(t.id)}
              className={cx(
                'rounded-lg border p-1 text-left transition hover:border-brand-300',
                t.id === resume.templateId ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200',
              )}
              title={t.description}
            >
              <div className="rounded overflow-hidden border border-slate-100">
                <TemplateThumb resume={resume} templateId={t.id} width={86} />
              </div>
              <div className="text-[11px] font-medium text-slate-700 mt-1 px-0.5 truncate">{t.name}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <CategoryBadge category={tpl.category} />
          <span className="truncate">{tpl.description}</span>
        </div>
      </Card>

      <Card
        title="Accent color"
        action={
          s.accentColor && (
            <button className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1" onClick={() => actions.setSetting('accentColor', '')}>
              <RotateCcw size={12} /> Template default
            </button>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => actions.setSetting('accentColor', c)}
              className="w-8 h-8 rounded-full border-2 border-white shadow ring-1 ring-slate-200 flex items-center justify-center transition hover:scale-110"
              style={{ background: c }}
              title={c}
            >
              {effectiveAccent.toLowerCase() === c && <Check size={14} className="text-white" />}
            </button>
          ))}
          <label className="relative w-8 h-8 rounded-full ring-1 ring-slate-200 overflow-hidden cursor-pointer" title="Custom color"
            style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
            <input
              type="color"
              value={effectiveAccent}
              onChange={(e) => actions.setSetting('accentColor', e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
        {tpl.category === 'ats' && <p className="text-xs text-slate-400 mt-2">Tip: darker colors print best and stay ATS-safe.</p>}
      </Card>

      <Card
        title="Typography"
        action={
          s.fontFamily && (
            <button className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1" onClick={() => actions.setSetting('fontFamily', '')}>
              <RotateCcw size={12} /> Template default
            </button>
          )
        }
      >
        <label className="label">Font family</label>
        <select className="input" value={effectiveFont} onChange={(e) => actions.setSetting('fontFamily', e.target.value)} style={{ fontFamily: getFont(effectiveFont).stack }}>
          <optgroup label="Sans-serif">
            {FONT_OPTIONS.filter((f) => !f.serif).map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
                {f.key === tpl.defaults.font ? ' (recommended)' : ''}
              </option>
            ))}
          </optgroup>
          <optgroup label="Serif">
            {FONT_OPTIONS.filter((f) => f.serif).map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
                {f.key === tpl.defaults.font ? ' (recommended)' : ''}
              </option>
            ))}
          </optgroup>
        </select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <span className="label">Font size</span>
            <Segmented
              value={s.fontScale}
              onChange={(v) => actions.setSetting('fontScale', v)}
              options={[
                { value: 'small', label: 'S' },
                { value: 'medium', label: 'M' },
                { value: 'large', label: 'L' },
              ]}
            />
          </div>
          <div>
            <span className="label">Line spacing</span>
            <Segmented
              value={s.lineSpacing}
              onChange={(v) => actions.setSetting('lineSpacing', v)}
              options={[
                { value: 'compact', label: 'Tight' },
                { value: 'normal', label: 'Normal' },
                { value: 'relaxed', label: 'Airy' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card title="Profile photo">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {tpl.supportsPhoto
              ? resume.data.personal.photo
                ? 'Show your uploaded photo on this template.'
                : 'Optional — upload a photo in Personal Information.'
              : `“${tpl.name}” is an ATS template and never shows a photo. Photos appear in ${PHOTO_TEMPLATES}.`}
          </p>
          <Toggle checked={s.showPhoto} onChange={(v) => actions.setSetting('showPhoto', v)} label="Show photo" />
        </div>
        {tpl.supportsPhoto && (
          <div className="mt-3">
            <span className="label">Photo shape</span>
            <Segmented
              value={(s.photoShape || tpl.defaults.photoShape || 'circle') as PhotoShape}
              onChange={(v) => actions.setSetting('photoShape', v)}
              options={[
                { value: 'circle', label: 'Circle' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'square', label: 'Square' },
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
