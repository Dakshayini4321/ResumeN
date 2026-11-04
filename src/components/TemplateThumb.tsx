import { memo, useMemo } from 'react';
import type { Resume } from '../types/resume';
import { ResumeRenderer } from '../templates/registry';
import { sampleData } from '../lib/defaults';

const PAGE_W = 793.7; // 210mm @ 96dpi
const PAGE_H = 1122.5; // 297mm

/** Live, scaled-down render of a resume in a given template. Falls back to sample content when empty. */
export const TemplateThumb = memo(function TemplateThumb({
  resume,
  templateId,
  width,
}: {
  resume: Resume;
  templateId: string;
  width: number;
}) {
  const scale = width / PAGE_W;
  const display = useMemo(() => {
    const empty = !resume.data.personal.fullName && resume.data.experience.length === 0;
    return empty ? { ...resume, data: sampleData() } : resume;
  }, [resume]);
  return (
    <div className="relative overflow-hidden bg-white" style={{ width, height: PAGE_H * scale }} aria-hidden>
      <div className="pointer-events-none select-none origin-top-left absolute top-0 left-0" style={{ transform: `scale(${scale})`, width: PAGE_W }}>
        <ResumeRenderer resume={display} templateId={templateId} />
      </div>
    </div>
  );
});
