import type { SectionType } from '../../types/resume';
import { CvSection, Page, Photo, contactItems, visibleSections, type TemplateCtx } from '../shared';
import { ContactIcon } from './ContactIcon';

const SIDE: SectionType[] = ['skills', 'languages', 'certifications', 'achievements', 'references'];

/** Professional 2 — Horizon: bold color header band with photo, main column + tinted side column. */
export default function Horizon({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  const sections = visibleSections(data);
  const side = sections.filter((s) => SIDE.includes(s.type));
  const main = sections.filter((s) => !SIDE.includes(s.type));

  return (
    <Page ctx={ctx} className="text-[#1f2937]" bg="linear-gradient(to right, #fff 0, #fff 64%, #f3f5f7 64%)">
      <header className="px-[13mm] py-[10mm] flex items-center gap-[1.6em] text-white" style={{ background: accent }}>
        <Photo ctx={ctx} size="7em" style={{ border: '3px solid rgba(255,255,255,.85)' }} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[2.5em] font-bold leading-[1.1] tracking-tight">{p.fullName || 'Your Name'}</h1>
          {p.jobTitle && <div className="text-[1.15em] font-medium text-white/90 mt-[0.2em]">{p.jobTitle}</div>}
          <div className="mt-[0.8em] flex flex-wrap gap-x-[1.2em] gap-y-[0.35em] text-[0.86em] text-white/95">
            {contactItems(data).map((c) => (
              <span key={c.key} className="inline-flex items-center gap-[0.4em] whitespace-nowrap">
                <ContactIcon kind={c.key} color="#fff" />
                {c.href ? <a href={c.href}>{c.value}</a> : c.value}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="flex items-stretch">
        <main className="cv-flow w-[64%] px-[11mm] pt-[8mm] pb-[13mm]">
          {main.map((s, i) => (
            <CvSection
              key={s.id}
              section={s}
              data={data}
              className={i ? 'mt-[1.15em]' : ''}
              heading={<Heading accent={accent}>{s.title}</Heading>}
              look={{ style: 'right', accent, skillStyle: 'tags', titleClass: 'font-semibold text-[#111827]', subtitleClass: 'font-medium', muted: '#6b7280', bullet: 'accent' }}
            />
          ))}
        </main>
        <aside className="cv-flow w-[36%] px-[7mm] pt-[8mm] pb-[13mm] text-[0.93em]">
          {side.map((s, i) => (
            <CvSection
              key={s.id}
              section={s}
              data={data}
              className={i ? 'mt-[1.15em]' : ''}
              heading={<Heading accent={accent}>{s.title}</Heading>}
              look={{ style: 'stacked', accent, skillStyle: 'dots', titleClass: 'font-semibold', subtitleClass: 'text-[#4b5563]', muted: '#6b7280', gap: '0.6em' }}
            />
          ))}
        </aside>
      </div>
    </Page>
  );
}

function Heading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2 className="cv-heading flex items-center gap-[0.55em] text-[1.06em] font-bold uppercase tracking-[0.06em] text-[#111827]">
      <span className="w-[0.32em] h-[1.05em] rounded-full shrink-0" style={{ background: accent }} aria-hidden />
      {children}
    </h2>
  );
}
