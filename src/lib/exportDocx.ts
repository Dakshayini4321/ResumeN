import {
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from 'docx';
import type { Resume, SectionMeta } from '../types/resume';
import { getTemplate } from '../templates/registry';
import { contactItems, toEntries, visibleSections } from '../templates/shared';
import { getFont, FONT_SCALE_PX } from './fonts';
import { downloadBlob, parseDescription, safeFilename } from './utils';

/**
 * Builds an ATS-friendly Word document from the same centralized resume data.
 * DOCX uses a clean single-column structure (Word cannot faithfully reproduce
 * CSS layouts), styled with the active template's font and accent color.
 */
export async function exportDocx(resume: Resume): Promise<void> {
  const t = getTemplate(resume.templateId);
  const font = getFont(resume.settings.fontFamily || t.defaults.font).docx;
  const accent = (resume.settings.accentColor || t.defaults.accent).replace('#', '');
  const base = Math.round((FONT_SCALE_PX[resume.settings.fontScale] ?? 13.5) * 0.78 * 2); // px -> half-points
  const data = resume.data;
  const p = data.personal;

  const children: Paragraph[] = [];
  const run = (text: string, opts: Partial<{ bold: boolean; italics: boolean; color: string; size: number }> = {}) =>
    new TextRun({ text, font, size: opts.size ?? base, bold: opts.bold, italics: opts.italics, color: opts.color });

  // Header
  const headerChildren: (TextRun | ImageRun)[] = [];
  if (t.supportsPhoto && resume.settings.showPhoto && p.photo.startsWith('data:image')) {
    try {
      const bytes = Uint8Array.from(atob(p.photo.split(',')[1]), (c) => c.charCodeAt(0));
      headerChildren.push(new ImageRun({ data: bytes, transformation: { width: 84, height: 84 } }));
      headerChildren.push(new TextRun({ text: '', break: 1 }));
    } catch {
      /* skip photo */
    }
  }
  headerChildren.push(run(p.fullName || 'Your Name', { bold: true, size: base * 2.1, color: accent }));
  children.push(new Paragraph({ children: headerChildren, spacing: { after: 40 } }));
  if (p.jobTitle) children.push(new Paragraph({ children: [run(p.jobTitle, { size: base * 1.2 })], spacing: { after: 60 } }));

  const contacts = contactItems(data);
  if (contacts.length) {
    const parts: (TextRun | ExternalHyperlink)[] = [];
    contacts.forEach((c, i) => {
      if (i > 0) parts.push(run('  |  ', { color: '888888' }));
      if (c.href && !c.href.startsWith('tel:')) {
        parts.push(new ExternalHyperlink({ link: c.href, children: [run(c.value, { color: '333333' })] }));
      } else parts.push(run(c.value, { color: '333333' }));
    });
    children.push(new Paragraph({ children: parts, spacing: { after: 160 } }));
  }

  const heading = (title: string) =>
    new Paragraph({
      children: [run(title.toUpperCase(), { bold: true, color: accent, size: base * 1.1 })],
      spacing: { before: 240, after: 80 },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
    });

  const description = (text: string) => {
    for (const b of parseDescription(text)) {
      if (b.type === 'para') children.push(new Paragraph({ children: [run(b.text)], spacing: { after: 40 } }));
      else
        b.items.forEach((it) =>
          children.push(new Paragraph({ children: [run(it)], bullet: { level: 0 }, spacing: { after: 20 } })),
        );
    }
  };

  const rightTab = [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }];

  const renderSection = (s: SectionMeta) => {
    children.push(heading(s.title));
    if (s.type === 'summary') return description(data.summary);
    if (s.type === 'skills') {
      children.push(new Paragraph({ children: [run(data.skills.map((k) => k.name).filter(Boolean).join(' • '))] }));
      return;
    }
    if (s.type === 'languages') {
      const txt = data.languages
        .filter((l) => l.name)
        .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
        .join(' • ');
      children.push(new Paragraph({ children: [run(txt)] }));
      return;
    }
    toEntries(s, data).forEach((e) => {
      children.push(
        new Paragraph({
          tabStops: rightTab,
          keepNext: true,
          spacing: { before: 120 },
          children: [run(e.title, { bold: true }), ...(e.date ? [run(`\t${e.date}`, { color: '555555' })] : [])],
        }),
      );
      if (e.subtitle || e.location)
        children.push(
          new Paragraph({
            tabStops: rightTab,
            keepNext: !!e.description,
            children: [run(e.subtitle, { italics: true }), ...(e.location ? [run(`\t${e.location}`, { color: '555555' })] : [])],
          }),
        );
      if (e.extra) children.push(new Paragraph({ children: [run(e.extra, { color: '555555' })] }));
      if (e.link) children.push(new Paragraph({ children: [run(e.link, { color: '555555' })] }));
      description(e.description);
    });
  };

  visibleSections(data).forEach(renderSection);

  const doc = new Document({
    creator: p.fullName || 'CVForge',
    title: `${p.fullName || 'Resume'} — CV`,
    styles: { default: { document: { run: { font, size: base } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twips
            margin: { top: 900, bottom: 900, left: 1000, right: 1000 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${safeFilename(p.fullName || resume.name)}_CV.docx`);
}
