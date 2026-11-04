import { ContactLine, CvSection, Page, visibleSections, type TemplateCtx } from '../shared';

/** ATS 2 — Modern: left-aligned header, accent headings followed by a hairline rule. */
export default function Modern({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="cv-flow px-[16mm] py-[15mm] text-[#1f2937]">
      <header>
        <h1 className="text-[2.3em] font-bold leading-tight text-[#111827]">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && (
          <div className="text-[1.15em] font-medium mt-[0.1em]" style={{ color: accent }}>
            {p.jobTitle}
          </div>
        )}
        <ContactLine data={data} sep="   " className="mt-[0.55em] text-[0.9em] text-[#4b5563] whitespace-pre-wrap" />
      </header>
      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[1.15em]"
          heading={
            <h2 className="cv-heading flex items-center gap-[0.7em] text-[1.05em] font-bold uppercase tracking-[0.06em]" style={{ color: accent }}>
              <span>{s.title}</span>
              <span className="flex-1 h-px" style={{ background: `${accent}55` }} aria-hidden />
            </h2>
          }
          look={{ style: 'right', accent, skillStyle: 'tags', subtitleClass: 'font-medium text-[#374151]', muted: '#6b7280' }}
        />
      ))}
    </Page>
  );
}
