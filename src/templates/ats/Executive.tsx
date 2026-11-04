import { ContactLine, CvSection, Page, visibleSections, type TemplateCtx } from '../shared';

/**
 * ATS 3 — Executive: accent top rule, uppercase serif name, small-caps headings.
 * Letter-spacing is kept ≤0.08em: wider tracking makes PDF text extract as "A L E X …".
 */
export default function Executive({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="text-[#1c1c1c]">
      <div className="h-[6px]" style={{ background: accent }} aria-hidden />
      <div className="cv-flow px-[17mm] pt-[11mm] pb-[15mm]">
        <header>
          <h1 className="text-[2.3em] font-semibold uppercase tracking-[0.08em] leading-tight" style={{ color: accent }}>
            {p.fullName || 'Your Name'}
          </h1>
          {p.jobTitle && <div className="text-[1.12em] tracking-[0.03em] mt-[0.15em] text-[#444]">{p.jobTitle}</div>}
          <ContactLine
            data={data}
            sep="  •  "
            sepClass="text-[#999]"
            className="mt-[0.7em] pt-[0.5em] border-t border-[#d4d4d4] text-[0.9em] text-[#333] whitespace-pre-wrap"
          />
        </header>
        {visibleSections(data).map((s) => (
          <CvSection
            key={s.id}
            section={s}
            data={data}
            className="mt-[1.2em]"
            heading={
              // real uppercase instead of synthesized small-caps (which PDF readers can split into "R EFERENCES")
              <h2
                className="cv-heading text-[1.02em] font-semibold uppercase tracking-[0.06em] pb-[0.2em] border-b"
                style={{ color: accent, borderColor: `${accent}66` }}
              >
                {s.title}
              </h2>
            }
            look={{ style: 'right', accent, skillStyle: 'columns', languagesInline: true, titleClass: 'font-bold', subtitleClass: 'italic text-[#333]', muted: '#555' }}
          />
        ))}
      </div>
    </Page>
  );
}
