import type { CSSProperties, ReactNode } from 'react';
import type { PhotoShape, Resume, ResumeData, SectionMeta } from '../types/resume';
import { FONT_SCALE_PX, LINE_SPACING, getFont } from '../lib/fonts';
import { formatDate, formatRange, hrefFor, parseDescription, stripUrl } from '../lib/utils';

/* ================================================================== */
/* Template context                                                    */
/* ================================================================== */

export interface TemplateDefaults {
  font: string;
  accent: string;
  photoShape?: PhotoShape;
}

export interface TemplateCtx {
  resume: Resume;
  data: ResumeData;
  accent: string;
  fontStack: string;
  style: CSSProperties;
  showPhoto: boolean;
  photoShape: PhotoShape;
}

export function buildCtx(resume: Resume, defaults: TemplateDefaults, photoSupported: boolean): TemplateCtx {
  const s = resume.settings;
  const font = getFont(s.fontFamily || defaults.font);
  const accent = s.accentColor || defaults.accent;
  return {
    resume,
    data: resume.data,
    accent,
    fontStack: font.stack,
    showPhoto: photoSupported && s.showPhoto !== false && !!resume.data.personal.photo,
    photoShape: (s.photoShape || defaults.photoShape || 'circle') as PhotoShape,
    style: {
      fontFamily: font.stack,
      fontSize: `${FONT_SCALE_PX[s.fontScale] ?? 13.5}px`,
      lineHeight: LINE_SPACING[s.lineSpacing] ?? 1.5,
      ['--accent' as string]: accent,
    },
  };
}

/* ================================================================== */
/* Content helpers — empty entries never render                        */
/* ================================================================== */

const blank = (v: unknown) => typeof v !== 'string' || v.trim() === '';

/** An entry counts as empty when every user-entered text field is blank. */
export function isEmptyItem(item: object): boolean {
  return Object.entries(item).every(([k, v]) => k === 'id' || k === 'level' || k === 'current' || blank(v));
}

export function sectionHasContent(section: SectionMeta, data: ResumeData): boolean {
  switch (section.type) {
    case 'summary':
      return !blank(data.summary);
    case 'custom':
      return (data.custom[section.id] ?? []).some((i) => !isEmptyItem(i));
    case 'skills':
      return data.skills.some((s) => !blank(s.name));
    case 'languages':
      return data.languages.some((l) => !blank(l.name));
    default:
      return ((data[section.type] as object[]) ?? []).some((i) => !isEmptyItem(i));
  }
}

export const visibleSections = (data: ResumeData): SectionMeta[] =>
  data.sections.filter((s) => s.visible && sectionHasContent(s, data));

export interface ContactItem {
  key: 'email' | 'phone' | 'location' | 'website' | 'linkedin' | 'github';
  label: string;
  value: string;
  href?: string;
}

export function contactItems(data: ResumeData): ContactItem[] {
  const p = data.personal;
  const items: ContactItem[] = [];
  if (p.email.trim()) items.push({ key: 'email', label: 'Email', value: p.email.trim(), href: `mailto:${p.email.trim()}` });
  if (p.phone.trim()) items.push({ key: 'phone', label: 'Phone', value: p.phone.trim(), href: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (p.location.trim()) items.push({ key: 'location', label: 'Location', value: p.location.trim() });
  if (p.website.trim()) items.push({ key: 'website', label: 'Website', value: stripUrl(p.website.trim()), href: hrefFor(p.website.trim()) });
  if (p.linkedin.trim()) items.push({ key: 'linkedin', label: 'LinkedIn', value: stripUrl(p.linkedin.trim()), href: hrefFor(p.linkedin.trim()) });
  if (p.github.trim()) items.push({ key: 'github', label: 'GitHub', value: stripUrl(p.github.trim()), href: hrefFor(p.github.trim()) });
  return items;
}

/** Contact values joined by a separator; each value is kept on one line (no "San Francisco, / CA" splits). */
export function ContactLine({
  data,
  sep = ' | ',
  sepClass = '',
  className = '',
  labels = false,
}: {
  data: ResumeData;
  sep?: string;
  sepClass?: string;
  className?: string;
  labels?: boolean;
}) {
  const items = contactItems(data);
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map((c, i) => (
        <span key={c.key}>
          {i > 0 && <span className={sepClass}>{sep}</span>}
          <span className={c.value.length < 42 ? 'whitespace-nowrap' : 'break-all'}>
            {labels && <span className="font-semibold">{c.label}: </span>}
            {c.href ? <a href={c.href}>{c.value}</a> : c.value}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ================================================================== */
/* Normalized entries — every list section maps onto this shape        */
/* ================================================================== */

export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  link?: string;
  description: string;
  extra?: string;
}

export function toEntries(section: SectionMeta, data: ResumeData): Entry[] {
  const list = (): Entry[] => {
    switch (section.type) {
      case 'experience':
        return data.experience.filter((e) => !isEmptyItem(e)).map((e) => ({
          id: e.id,
          title: e.position,
          subtitle: e.company,
          location: e.location,
          date: formatRange(e.startDate, e.endDate, e.current),
          description: e.description,
        }));
      case 'education':
        return data.education.filter((e) => !isEmptyItem(e)).map((e) => ({
          id: e.id,
          title: e.degree,
          subtitle: e.institution,
          location: e.location,
          date: formatRange(e.startDate, e.endDate, e.current),
          description: e.description,
          extra: e.grade,
        }));
      case 'volunteering':
        return data.volunteering.filter((v) => !isEmptyItem(v)).map((v) => ({
          id: v.id,
          title: v.role,
          subtitle: v.organization,
          location: v.location,
          date: formatRange(v.startDate, v.endDate, v.current),
          description: v.description,
        }));
      case 'projects':
        return data.projects.filter((p) => !isEmptyItem(p)).map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: p.role,
          location: '',
          date: formatRange(p.startDate, p.endDate),
          link: p.link,
          description: p.description,
        }));
      case 'certifications':
        return data.certifications.filter((c) => !isEmptyItem(c)).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.issuer,
          location: '',
          date: formatDate(c.date),
          link: c.link,
          description: '',
        }));
      case 'achievements':
        return data.achievements.filter((a) => !isEmptyItem(a)).map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: '',
          location: '',
          date: formatDate(a.date),
          description: a.description,
        }));
      case 'references':
        return data.references.filter((r) => !isEmptyItem(r)).map((r) => ({
          id: r.id,
          title: r.name,
          subtitle: [r.position, r.company].filter((x) => x.trim()).join(', '),
          location: '',
          date: '',
          description: '',
          extra: [r.email, r.phone].filter((x) => x.trim()).join(' · '),
        }));
      case 'languages':
        return data.languages.filter((l) => !blank(l.name)).map((l) => ({
          id: l.id,
          title: l.name,
          subtitle: l.proficiency,
          location: '',
          date: '',
          description: '',
        }));
      case 'custom':
        return (data.custom[section.id] ?? []).filter((c) => !isEmptyItem(c)).map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          location: '',
          date: formatDate(c.date),
          description: c.description,
        }));
      default:
        return [];
    }
  };
  return list();
}

/* ================================================================== */
/* Primitive renderers                                                 */
/* ================================================================== */

export type BulletStyle = 'disc' | 'dash' | 'square' | 'accent' | 'circle';

/**
 * Bullets use native list markers (not ::before pseudo-elements) so PDF text
 * extraction keeps every bullet in reading order next to its job.
 */
export function Description({ text, className = '', bullet = 'disc' }: { text: string; className?: string; bullet?: BulletStyle }) {
  const blocks = parseDescription(text);
  if (!blocks.length) return null;
  return (
    <div className={`cv-desc ${className}`}>
      {blocks.map((b, i) =>
        b.type === 'para' ? (
          <p key={i} className="cv-line mt-[0.2em]">
            {b.text}
          </p>
        ) : (
          <ul key={i} className={`cv-bullets cv-bullets-${bullet} mt-[0.2em]`}>
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

export function LinkText({ url, className = '' }: { url?: string; className?: string }) {
  if (!url?.trim()) return null;
  return (
    <a href={hrefFor(url)} className={`break-all ${className}`} target="_blank" rel="noreferrer">
      {stripUrl(url)}
    </a>
  );
}

export type EntryStyle = 'right' | 'classic' | 'stacked' | 'timeline' | 'compact';

export interface EntryLook {
  style: EntryStyle;
  accent: string;
  titleClass?: string;
  subtitleClass?: string;
  subtitleColor?: string;
  dateClass?: string;
  muted?: string;
  bullet?: BulletStyle;
  gap?: string;
}

/**
 * One entry. The heading row(s) live in a `cv-keep` block (never split, kept with the
 * first line that follows). `lead` lets a section heading join the first entry's block,
 * so headings are never stranded at the bottom of a page.
 */
export function EntryView({ e, look, lead, first }: { e: Entry; look: EntryLook; lead?: ReactNode; first?: boolean }) {
  const muted = look.muted ?? '#555';
  const titleCls = look.titleClass ?? 'font-semibold';
  const subCls = look.subtitleClass ?? '';
  const subStyle = look.subtitleColor ? { color: look.subtitleColor } : undefined;
  const dateCls = look.dateClass ?? '';
  const gap = first ? '0.3em' : look.gap ?? '0.75em';

  if (look.style === 'timeline') {
    // single reading-order flow: dot + rail on the left, title then date on the same row
    return (
      <div className="cv-entry">
        {lead && <div className="cv-keep-next">{lead}</div>}
        {/* rail = border, dot = positioned span inside a text-free wrapper (positioned text would paint out of reading order in PDFs) */}
        <div className="ml-[0.3em] pl-[1em] border-l" style={{ paddingTop: gap, borderColor: `${look.accent}40` }}>
          <div className={e.description.trim() ? 'cv-keep cv-keep-next' : 'cv-keep'}>
            {/* dot lives inside the unbreakable header so it always moves with its entry */}
            <div className="h-0 overflow-visible" aria-hidden>
              <span className="relative block -left-[1.3em] top-[0.42em] w-[0.6em] h-[0.6em] rounded-full" style={{ background: look.accent }} />
            </div>
            <div className="flex justify-between items-baseline gap-[1em]">
              <div className={`min-w-0 ${titleCls}`}>{e.title}</div>
              {e.date && <div className={`shrink-0 whitespace-nowrap text-[0.88em] ${dateCls}`} style={{ color: muted }}>{e.date}</div>}
            </div>
            {(e.subtitle || e.location) && (
              <div className="flex justify-between items-baseline gap-[1em]">
                <div className={`min-w-0 ${subCls}`} style={subStyle}>{e.subtitle}</div>
                {e.location && <div className="shrink-0 text-[0.88em]" style={{ color: muted }}>{e.location}</div>}
              </div>
            )}
            {e.extra && <div className="text-[0.9em]" style={{ color: muted }}>{e.extra}</div>}
            <LinkText url={e.link} className="text-[0.88em] underline" />
          </div>
          <Description text={e.description} bullet={look.bullet} />
        </div>
      </div>
    );
  }

  if (look.style === 'stacked') {
    return (
      <div className="cv-entry" style={{ paddingTop: lead ? 0 : gap }}>
        <div className={e.description.trim() ? 'cv-keep cv-keep-next' : 'cv-keep'}>
          {lead}
          <div style={lead ? { paddingTop: gap } : undefined}>
            <div className={titleCls}>{e.title}</div>
            {e.subtitle && <div className={subCls} style={subStyle}>{e.subtitle}</div>}
            {(e.date || e.location) && (
              <div className={`text-[0.86em] ${dateCls}`} style={{ color: muted }}>
                {[e.date, e.location].filter(Boolean).join(' · ')}
              </div>
            )}
            {e.extra && <div className="text-[0.88em]" style={{ color: muted }}>{e.extra}</div>}
            <LinkText url={e.link} className="text-[0.86em] underline" />
          </div>
        </div>
        <Description text={e.description} bullet={look.bullet} />
      </div>
    );
  }

  if (look.style === 'compact') {
    const meta = [e.location, e.extra].filter(Boolean);
    return (
      <div className="cv-entry" style={{ paddingTop: lead ? 0 : gap }}>
        <div className={e.description.trim() ? 'cv-keep cv-keep-next' : 'cv-keep'}>
          {lead}
          <div className="flex justify-between gap-[1em]" style={lead ? { paddingTop: gap } : undefined}>
            <div className="min-w-0">
              <span className={titleCls}>{e.title}</span>
              {e.subtitle && <span className={subCls} style={subStyle}>{e.title ? ' — ' : ''}{e.subtitle}</span>}
              {meta.length > 0 && <span style={{ color: muted }}>{' · '}{meta.join(' · ')}</span>}
              {e.link && (
                <span style={{ color: muted }}>
                  {' · '}
                  <LinkText url={e.link} />
                </span>
              )}
            </div>
            {e.date && <div className={`shrink-0 whitespace-nowrap ${dateCls}`} style={{ color: muted }}>{e.date}</div>}
          </div>
        </div>
        <Description text={e.description} bullet={look.bullet} />
      </div>
    );
  }

  if (look.style === 'classic') {
    // Harvard: Organisation — Location / Role — Date
    const org = e.subtitle || e.title;
    const role = e.subtitle ? e.title : '';
    return (
      <div className="cv-entry" style={{ paddingTop: lead ? 0 : gap }}>
        <div className={e.description.trim() ? 'cv-keep cv-keep-next' : 'cv-keep'}>
          {lead}
          <div style={lead ? { paddingTop: gap } : undefined}>
            <div className="flex justify-between items-baseline gap-[1em]">
              <span className={`min-w-0 ${titleCls}`}>{org}</span>
              {e.location && <span className="shrink-0">{e.location}</span>}
            </div>
            {(role || e.date) && (
              <div className="flex justify-between items-baseline gap-[1em]">
                <span className={`min-w-0 ${subCls}`}>{role}</span>
                {e.date && <span className={`shrink-0 whitespace-nowrap ${dateCls}`}>{e.date}</span>}
              </div>
            )}
            {e.extra && <div>{e.extra}</div>}
            <LinkText url={e.link} className="text-[0.92em] underline" />
          </div>
        </div>
        <Description text={e.description} bullet={look.bullet} />
      </div>
    );
  }

  // 'right' (default): title + date on one row, subtitle + location on the next
  return (
    <div className="cv-entry" style={{ paddingTop: lead ? 0 : gap }}>
      <div className={e.description.trim() ? 'cv-keep cv-keep-next' : 'cv-keep'}>
        {lead}
        <div style={lead ? { paddingTop: gap } : undefined}>
          <div className="flex justify-between items-baseline gap-[1em]">
            <div className={`min-w-0 ${titleCls}`}>{e.title}</div>
            {e.date && <div className={`shrink-0 whitespace-nowrap text-[0.9em] ${dateCls}`} style={{ color: muted }}>{e.date}</div>}
          </div>
          {(e.subtitle || e.location) && (
            <div className="flex justify-between items-baseline gap-[1em]">
              <div className={`min-w-0 ${subCls}`} style={subStyle}>{e.subtitle}</div>
              {e.location && <div className="shrink-0 text-[0.9em]" style={{ color: muted }}>{e.location}</div>}
            </div>
          )}
          {e.extra && <div className="text-[0.9em]" style={{ color: muted }}>{e.extra}</div>}
          <LinkText url={e.link} className="text-[0.88em] underline" />
        </div>
      </div>
      <Description text={e.description} bullet={look.bullet} />
    </div>
  );
}

/* ================================================================== */
/* Skills & languages                                                  */
/* ================================================================== */

export type SkillStyle = 'inline' | 'tags' | 'bars' | 'dots' | 'columns' | 'list';

export function SkillsView({ data, style, accent, light = false, sep = ' • ' }: { data: ResumeData; style: SkillStyle; accent: string; light?: boolean; sep?: string }) {
  const skills = data.skills.filter((s) => s.name.trim());
  if (style === 'inline') {
    return (
      <p className="mt-[0.3em]">
        {skills.map((s, i) => (
          <span key={s.id}>
            {i > 0 && sep}
            <span className="whitespace-nowrap">{s.name}</span>
          </span>
        ))}
      </p>
    );
  }
  if (style === 'list') {
    return (
      <ul className="mt-[0.3em] space-y-[0.15em]">
        {skills.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    );
  }
  if (style === 'columns') {
    return (
      <ul className="cv-bullets cv-bullets-disc mt-[0.3em] grid grid-cols-3 gap-x-[1.4em]">
        {skills.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    );
  }
  if (style === 'tags') {
    return (
      <div className="mt-[0.45em] flex flex-wrap gap-[0.4em]">
        {skills.map((s) => (
          <span
            key={s.id}
            className="px-[0.65em] py-[0.12em] rounded-[0.35em] text-[0.9em]"
            style={light ? { background: 'rgba(255,255,255,.14)', color: '#fff' } : { background: `${accent}12`, color: accent, border: `1px solid ${accent}30` }}
          >
            {s.name}
          </span>
        ))}
      </div>
    );
  }
  if (style === 'dots') {
    return (
      <div className="mt-[0.35em] space-y-[0.3em]">
        {skills.map((s) => (
          <div key={s.id} className="cv-keep flex items-center justify-between gap-[0.6em]">
            <span className="min-w-0">{s.name}</span>
            <span className="flex gap-[0.22em] shrink-0" aria-hidden>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="w-[0.5em] h-[0.5em] rounded-full"
                  style={{ background: n <= s.level ? (light ? '#fff' : accent) : light ? 'rgba(255,255,255,.25)' : `${accent}26` }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }
  // bars
  return (
    <div className="mt-[0.35em] space-y-[0.45em]">
      {skills.map((s) => (
        <div key={s.id} className="cv-keep">
          <div className="text-[0.92em]">{s.name}</div>
          <div className="h-[0.3em] rounded-full mt-[0.18em] overflow-hidden" style={{ background: light ? 'rgba(255,255,255,.22)' : `${accent}22` }} aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${(s.level / 5) * 100}%`, background: light ? '#fff' : accent }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LanguagesView({ data, muted, inline }: { data: ResumeData; muted?: string; inline?: boolean }) {
  const langs = data.languages.filter((l) => l.name.trim());
  if (inline) {
    return (
      <p className="mt-[0.3em]">
        {langs.map((l, i) => (
          <span key={l.id}>
            {i > 0 && ' • '}
            <span className="whitespace-nowrap">
              {l.name}
              {l.proficiency && <span style={{ color: muted }}> ({l.proficiency})</span>}
            </span>
          </span>
        ))}
      </p>
    );
  }
  return (
    <div className="mt-[0.3em] space-y-[0.15em]">
      {langs.map((l) => (
        <div key={l.id} className="flex justify-between gap-[0.6em]">
          <span>{l.name}</span>
          {l.proficiency && (
            <span style={{ color: muted }} className="text-[0.92em]">
              {l.proficiency}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* Section                                                              */
/* ================================================================== */

export interface SectionLook extends EntryLook {
  skillStyle: SkillStyle;
  languagesInline?: boolean;
  light?: boolean;
}

/**
 * Renders a section heading + body. The heading is placed inside the first entry's
 * unbreakable block (or together with short bodies) so it never ends up alone at a page bottom.
 */
export function CvSection({
  section,
  data,
  look,
  heading,
  className = '',
  style,
}: {
  section: SectionMeta;
  data: ResumeData;
  look: SectionLook;
  heading: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  let body: ReactNode;
  if (section.type === 'summary') {
    body = (
      <>
        <div className="cv-keep">
          {heading}
          <Description text={firstBlockText(data.summary)} className="mt-[0.3em]" bullet={look.bullet} />
        </div>
        <Description text={restBlocksText(data.summary)} bullet={look.bullet} />
      </>
    );
  } else if (section.type === 'skills') {
    body = (
      <div className="cv-keep-soft">
        {heading}
        <SkillsView data={data} style={look.skillStyle} accent={look.accent} light={look.light} />
      </div>
    );
  } else if (section.type === 'languages') {
    body = (
      <div className="cv-keep">
        {heading}
        <LanguagesView data={data} muted={look.muted} inline={look.languagesInline} />
      </div>
    );
  } else {
    const entries = toEntries(section, data);
    body = entries.map((e, i) => <EntryView key={e.id} e={e} look={look} lead={i === 0 ? heading : undefined} first={i === 0} />);
  }
  return (
    <section className={className} style={style}>
      {body}
    </section>
  );
}

// Summary: keep the heading glued to the first paragraph; the remainder may flow.
function firstBlockText(text: string) {
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => l.trim());
  return idx < 0 ? '' : lines[idx];
}
function restBlocksText(text: string) {
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => l.trim());
  return idx < 0 ? '' : lines.slice(idx + 1).join('\n');
}

/* ================================================================== */
/* Page + photo                                                         */
/* ================================================================== */

/**
 * A4 page. `bg` paints a full-page background layer (sidebars, edge strips) that is
 * repeated on every printed page (position: fixed in print), so colored columns never
 * stop half-way down page 2.
 */
export function Page({
  ctx,
  children,
  className = '',
  style,
  bg,
}: {
  ctx: TemplateCtx;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bg?: string;
}) {
  return (
    <div className="cv-page" style={ctx.style}>
      {bg && <div className="cv-page-bg" style={{ background: bg }} aria-hidden />}
      <div className={`cv-page-content ${className}`} style={style}>
        {children}
      </div>
    </div>
  );
}

const SHAPE_RADIUS: Record<PhotoShape, string> = { circle: '9999px', rounded: '14%', square: '0' };

export function Photo({ ctx, size, className = '', style }: { ctx: TemplateCtx; size: string; className?: string; style?: CSSProperties }) {
  if (!ctx.showPhoto) return null;
  return (
    <img
      src={ctx.data.personal.photo}
      alt={`${ctx.data.personal.fullName || 'Profile'} photo`}
      className={`cv-photo object-cover shrink-0 ${className}`}
      style={{ width: size, height: ctx.photoShape === 'circle' ? size : `calc(${size} * 1.15)`, borderRadius: SHAPE_RADIUS[ctx.photoShape], ...style }}
    />
  );
}
