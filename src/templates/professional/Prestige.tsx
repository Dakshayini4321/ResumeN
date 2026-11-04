import { CvSection, Page, Photo, contactItems, visibleSections, type TemplateCtx } from '../shared';
import { ContactIcon } from './ContactIcon';

const DISPLAY = "'Libre Baskerville', Georgia, serif";

/** Professional 3 — Prestige: accent edge strip on every page, serif display name, timeline history. */
export default function Prestige({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;

  return (
    <Page ctx={ctx} className="cv-flow pl-[17mm] pr-[14mm] py-[14mm] text-[#2a2a2a]" bg={`linear-gradient(to right, ${accent} 0, ${accent} 5mm, #fff 5mm)`}>
      <header className="flex items-start justify-between gap-[1.5em]">
        <div className="min-w-0">
          <h1 className="text-[2.35em] leading-[1.15] font-bold text-[#1a1a1a]" style={{ fontFamily: DISPLAY }}>
            {p.fullName || 'Your Name'}
          </h1>
          {p.jobTitle && (
            <div className="mt-[0.35em] text-[1.1em] font-medium" style={{ color: accent }}>
              {p.jobTitle}
            </div>
          )}
        </div>
        <Photo ctx={ctx} size="6.4em" />
      </header>

      <div className="mt-[1em] grid grid-cols-2 gap-x-[1.2em] gap-y-[0.45em] py-[0.7em] border-y text-[0.86em]" style={{ borderColor: `${accent}40` }}>
        {contactItems(data).map((c) => (
          <div key={c.key} className="flex items-center gap-[0.55em] min-w-0">
            <span className="w-[1.8em] h-[1.8em] rounded-full flex items-center justify-center shrink-0" style={{ background: `${accent}14` }}>
              <ContactIcon kind={c.key} color={accent} size="0.95em" />
            </span>
            <span className="min-w-0 break-all">{c.href ? <a href={c.href}>{c.value}</a> : c.value}</span>
          </div>
        ))}
      </div>

      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[1.3em]"
          heading={
            <h2 className="cv-heading flex items-center gap-[0.8em] text-[1.25em] font-bold text-[#1a1a1a]" style={{ fontFamily: DISPLAY }}>
              {s.title}
              <span className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} aria-hidden />
            </h2>
          }
          look={{
            style: ['experience', 'education', 'projects', 'volunteering'].includes(s.type) ? 'timeline' : 'right',
            accent,
            skillStyle: 'tags',
            languagesInline: true,
            titleClass: 'font-bold text-[#1a1a1a]',
            subtitleClass: 'font-medium',
            subtitleColor: accent,
            muted: '#6b6b6b',
            bullet: 'accent',
          }}
        />
      ))}
    </Page>
  );
}
