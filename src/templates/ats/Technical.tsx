import { CvSection, Page, contactItems, visibleSections, type TemplateCtx } from '../shared';

/** ATS 6 — Technical: labelled contact grid, left-bar headings and skill columns, suited to engineering roles. */
export default function Technical({ ctx }: { ctx: TemplateCtx }) {
  const { data, accent } = ctx;
  const p = data.personal;
  return (
    <Page ctx={ctx} className="cv-flow px-[16mm] py-[15mm] text-[#1e293b]">
      <header className="pb-[0.4em]">
        <h1 className="text-[2.2em] font-bold leading-tight text-[#0f172a]">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && (
          <div className="text-[1.1em] font-medium" style={{ color: accent }}>
            {p.jobTitle}
          </div>
        )}
        <div className="mt-[0.5em] text-[0.9em] text-[#334155] grid grid-cols-2 gap-x-[1.5em]">
          {contactItems(data).map((c) => (
            <div key={c.key} className="min-w-0 break-words">
              <span className="font-semibold">{c.label}:</span> {c.href ? <a href={c.href}>{c.value}</a> : c.value}
            </div>
          ))}
        </div>
      </header>
      {visibleSections(data).map((s) => (
        <CvSection
          key={s.id}
          section={s}
          data={data}
          className="mt-[1.1em]"
          heading={
            <h2 className="cv-heading text-[1.05em] font-bold uppercase tracking-[0.06em] border-l-[4px] pl-[0.55em] leading-tight text-[#0f172a]" style={{ borderColor: accent }}>
              {s.title}
            </h2>
          }
          look={{ style: 'right', accent, skillStyle: 'columns', subtitleClass: 'font-medium', muted: '#475569', bullet: 'square' }}
        />
      ))}
    </Page>
  );
}
