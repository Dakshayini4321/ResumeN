import { ContactLine, CvSection, Page, visibleSections, type TemplateCtx } from '../shared';

/** ATS 5 — Compact: dense layout with tinted heading bars; fits long careers on fewer pages. */
export default function Compact({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="cv-flow px-[13mm] py-[12mm] text-[#1f2937]" style={{ fontSize: '0.94em' }}>
      <header className="border-b-2 pb-[0.45em]" style={{ borderColor: accent }}>
        <h1 className="text-[1.95em] font-bold leading-tight" style={{ color: accent }}>
          {p.fullName || 'Your Name'}
        </h1>
        {p.jobTitle && <div className="text-[1.05em] font-semibold text-[#374151]">{p.jobTitle}</div>}
        <ContactLine data={data} sep=" · " className="mt-[0.15em] text-[0.9em] text-[#374151]" />
      </header>
      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[0.8em]"
          heading={
            <h2 className="cv-heading text-[0.95em] font-bold uppercase tracking-[0.06em] px-[0.55em] py-[0.15em]" style={{ color: accent, background: `${accent}14` }}>
              {s.title}
            </h2>
          }
          look={{ style: 'compact', accent, skillStyle: 'inline', languagesInline: true, titleClass: 'font-bold', muted: '#4b5563', gap: '0.45em' }}
        />
      ))}
    </Page>
  );
}
