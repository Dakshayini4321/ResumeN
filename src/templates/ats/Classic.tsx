import { ContactLine, CvSection, Page, visibleSections, type TemplateCtx } from '../shared';

/** ATS 1 — Classic: centered serif header, uppercase headings over full-width rules. */
export default function Classic({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="cv-flow px-[17mm] py-[15mm] text-[#1f2328]">
      <header className="text-center">
        <h1 className="text-[2.2em] font-bold leading-tight" style={{ color: accent }}>
          {p.fullName || 'Your Name'}
        </h1>
        {p.jobTitle && <div className="text-[1.1em] mt-[0.15em]">{p.jobTitle}</div>}
        <ContactLine data={data} sep=" | " sepClass="text-[#888]" className="mt-[0.5em] text-[0.92em] text-[#444]" />
      </header>
      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[1.1em]"
          heading={
            <h2 className="cv-heading text-[1.02em] font-bold uppercase tracking-[0.1em] pb-[0.2em] border-b-[1.5px]" style={{ color: accent, borderColor: accent }}>
              {s.title}
            </h2>
          }
          look={{ style: 'right', accent, skillStyle: 'inline', languagesInline: true, titleClass: 'font-bold', subtitleClass: 'italic', muted: '#444' }}
        />
      ))}
    </Page>
  );
}
