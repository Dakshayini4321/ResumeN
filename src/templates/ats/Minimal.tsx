import { ContactLine, CvSection, Page, visibleSections, type TemplateCtx } from '../shared';

/** ATS 4 — Minimal: generous whitespace, light name, quiet small headings, dash bullets. */
export default function Minimal({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="cv-flow px-[19mm] py-[16mm] text-[#27272a]">
      <header>
        <h1 className="text-[2.4em] font-light tracking-tight leading-tight text-[#18181b]">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <div className="text-[1.1em] mt-[0.15em] text-[#52525b]">{p.jobTitle}</div>}
        <ContactLine data={data} sep="    " className="mt-[0.8em] text-[0.88em] text-[#52525b] whitespace-pre-wrap" />
      </header>
      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[1.35em]"
          heading={
            <h2 className="cv-heading text-[0.84em] font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>
              {s.title}
            </h2>
          }
          look={{
            style: 'stacked',
            accent,
            skillStyle: 'inline',
            languagesInline: true,
            titleClass: 'font-semibold text-[#18181b]',
            subtitleClass: 'text-[#3f3f46]',
            muted: '#71717a',
            bullet: 'dash',
            gap: '0.8em',
          }}
        />
      ))}
    </Page>
  );
}
