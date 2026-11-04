import type { SectionType } from '../../types/resume';
import { CvSection, Page, Photo, contactItems, visibleSections, type TemplateCtx } from '../shared';
import { ContactIcon } from './ContactIcon';

const SIDEBAR: SectionType[] = ['skills', 'languages', 'certifications', 'references'];
const DISPLAY = "'Playfair Display', Georgia, serif";

/**
 * Professional 1 — Elegant: dark left sidebar (photo, contact, skills), serif display headings.
 * The main column is first in the document and laid out with row-reverse, so PDF text reads
 * name → summary → experience before the sidebar. The sidebar color repeats on every page.
 */
export default function Elegant({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  const sections = visibleSections(data);
  const side = sections.filter((s) => SIDEBAR.includes(s.type));
  const main = sections.filter((s) => !SIDEBAR.includes(s.type));

  return (
    <Page ctx={ctx} className="flex flex-row-reverse items-stretch text-[#2b2b2b]" bg={`linear-gradient(to right, ${accent} 0, ${accent} 33%, #fff 33%)`}>
      <main className="cv-flow flex-1 min-w-0 px-[9mm] py-[13mm]">
        <header className="pb-[0.9em] mb-[0.2em] border-b" style={{ borderColor: `${accent}33` }}>
          <h1 className="text-[2.6em] leading-[1.1] font-semibold" style={{ fontFamily: DISPLAY, color: accent }}>
            {p.fullName || 'Your Name'}
          </h1>
          {p.jobTitle && <div className="mt-[0.35em] text-[1em] uppercase tracking-[0.08em] text-[#666]">{p.jobTitle}</div>}
        </header>
        {main.map((s) => (
          <CvSection
            key={s.id}
            section={s}
            data={data}
            className="mt-[1.15em]"
            heading={
              <h2
                className="cv-heading text-[1.35em] font-semibold pb-[0.3em]"
                style={{
                  fontFamily: DISPLAY,
                  color: accent,
                  background: `linear-gradient(${accent}, ${accent}) left bottom / 2.4em 2px no-repeat`,
                }}
              >
                {s.title}
              </h2>
            }
            look={{ style: 'right', accent, skillStyle: 'tags', titleClass: 'font-bold text-[#222]', subtitleClass: 'font-medium', muted: '#777', bullet: 'accent' }}
          />
        ))}
      </main>

      <aside className="cv-flow w-[33%] shrink-0 px-[7mm] py-[13mm] text-white/90">
        {ctx.showPhoto && (
          <div className="flex justify-center mb-[1.4em]">
            <Photo ctx={ctx} size="8.5em" style={{ border: '3px solid rgba(255,255,255,.75)' }} />
          </div>
        )}
        <div className="cv-keep">
          <SideHeading>Contact</SideHeading>
          <div className="space-y-[0.5em] text-[0.88em] mt-[0.6em]">
            {contactItems(data).map((c) => (
              <div key={c.key} className="flex items-start gap-[0.6em] min-w-0">
                <span className="mt-[0.22em] shrink-0">
                  <ContactIcon kind={c.key} color="rgba(255,255,255,.85)" />
                </span>
                <span className="min-w-0 break-all">{c.href ? <a href={c.href}>{c.value}</a> : c.value}</span>
              </div>
            ))}
          </div>
        </div>
        {side.map((s) => (
          <CvSection
            key={s.id}
            section={s}
            data={data}
            className="mt-[1.5em] text-[0.92em]"
            heading={<SideHeading>{s.title}</SideHeading>}
            look={{
              style: 'stacked',
              accent: '#ffffff',
              light: true,
              skillStyle: 'bars',
              titleClass: 'font-semibold text-white',
              subtitleClass: 'text-white/80',
              muted: 'rgba(255,255,255,.72)',
              gap: '0.6em',
            }}
          />
        ))}
      </aside>
    </Page>
  );
}

function SideHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="cv-heading text-[0.86em] uppercase tracking-[0.1em] font-semibold text-white pb-[0.35em] border-b border-white/30">{children}</h2>;
}
