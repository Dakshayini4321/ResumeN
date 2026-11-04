import { useState } from 'react';
import { Check, ScanSearch, Sparkles } from 'lucide-react';
import type { Resume } from '../types/resume';
import { TEMPLATES, type TemplateCategory } from '../templates/registry';
import { cx } from '../lib/utils';
import { Modal } from './ui';
import { TemplateThumb } from './TemplateThumb';

type Filter = 'all' | TemplateCategory;

export function CategoryBadge({ category }: { category: TemplateCategory }) {
  return category === 'ats' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold">
      <ScanSearch size={11} /> ATS-friendly
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 px-2 py-0.5 text-[11px] font-semibold"
      title="Designed layout with ATS-readable text, standard headings and a logical reading order"
    >
      <Sparkles size={11} /> Professional · ATS-ready
    </span>
  );
}

export function TemplateGallery({
  open,
  onClose,
  resume,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  resume: Resume;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const list = TEMPLATES.filter((t) => filter === 'all' || t.category === filter);
  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All templates', count: TEMPLATES.length },
    { id: 'ats', label: 'ATS-friendly', count: TEMPLATES.filter((t) => t.category === 'ats').length },
    { id: 'professional', label: 'Professional', count: TEMPLATES.filter((t) => t.category === 'professional').length },
  ];

  return (
    <Modal open={open} onClose={onClose} wide title="Choose a template" subtitle="Your content stays the same — switch designs anytime.">
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium border transition',
              filter === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            )}
          >
            {t.label} <span className="opacity-60 ml-1">{t.count}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-4 -mt-2 leading-relaxed">
        Every template uses real selectable text, standard section headings and a name-first reading order, so applicant tracking
        systems can parse it. Single-column ATS templates are the safest choice for strict online job portals; professional
        templates add design for direct applications and networking. Photos are optional everywhere they’re supported.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {list.map((t) => {
          const active = t.id === resume.templateId;
          return (
            <button
              key={t.id}
              onClick={() => {
                onSelect(t.id);
                onClose();
              }}
              className={cx(
                'group text-left rounded-xl border bg-white p-2.5 transition hover:shadow-soft hover:-translate-y-0.5',
                active ? 'border-brand-500 ring-4 ring-brand-500/15' : 'border-slate-200',
              )}
            >
              <div className="relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex justify-center">
                <TemplateThumb resume={resume} templateId={t.id} width={240} />
                {active && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-brand-600 text-white text-[11px] font-semibold px-2 py-1 shadow">
                    <Check size={12} /> Current
                  </span>
                )}
                <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition flex items-end justify-center pb-4">
                  <span className="opacity-0 group-hover:opacity-100 transition btn-primary !text-xs">Use this template</span>
                </span>
              </div>
              <div className="px-1 pt-3 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <CategoryBadge category={t.category} />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
