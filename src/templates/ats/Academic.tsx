import { ContactLine, CvSection, Page, visibleSections, type TemplateCtx } from '../shared';

/** ATS 7 — Harvard: centered serif layout, organisation-first entries. */
export default function Academic({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="cv-flow px-[18mm] py-[15mm] text-black">
      <header className="text-center">
        <h1 className="text-[2.05em] font-bold leading-tight" style={{ color: accent }}>
          {p.fullName || 'Your Name'}
        </h1>
        {p.jobTitle && <div className="italic mt-[0.1em]">{p.jobTitle}</div>}
        <ContactLine data={data} sep=" • " className="mt-[0.35em] text-[0.95em]" />
      </header>
      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[1em]"
          heading={
            <h2 className="cv-heading text-center text-[1.05em] font-bold uppercase tracking-[0.08em] border-b border-black pb-[0.1em]" style={{ color: accent }}>
              {s.title}
            </h2>
          }
          look={{
            style: s.type === 'experience' || s.type === 'education' || s.type === 'volunteering' ? 'classic' : 'right',
            accent,
            skillStyle: 'inline',
            languagesInline: true,
            titleClass: 'font-bold',
            subtitleClass: 'italic',
            muted: '#222',
          }}
        />
      ))}
    </Page>
  );
}
