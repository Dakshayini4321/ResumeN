import type { Resume } from '../types/resume';
import { downloadBlob, safeFilename } from './utils';

export function exportJson(resume: Resume) {
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFilename(resume.name)}.cvforge.json`);
}

/** File name / PDF title built only from the user's own data, e.g. "Alex_Morgan_CV". */
export const cvFilename = (resume: Resume) => `${safeFilename(resume.data.personal.fullName || resume.name)}_CV`;

let appTitle: string | null = null;

/**
 * While printing, the document title becomes the CV file name. Browsers use it as the
 * suggested PDF file name and as the PDF "Title" metadata, so the app name never leaks into the file.
 */
export function setPrintTitle(title: string | null) {
  if (title) {
    if (appTitle === null) appTitle = document.title;
    document.title = title;
  } else if (appTitle !== null) {
    document.title = appTitle;
    appTitle = null;
  }
}

/**
 * PDF + print use the browser's print engine on a dedicated #print-root, which yields real,
 * selectable (ATS-parsable) text rather than an image. `@page { margin: 0 }` (index.css) leaves the
 * browser no margin to draw its own URL / date / title / page-number headers and footers in.
 */
export function printResume(filename: string) {
  setPrintTitle(filename);
  const restore = () => {
    setPrintTitle(null);
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  (document.fonts?.ready ?? Promise.resolve()).then(() => setTimeout(() => window.print(), 50));
}
