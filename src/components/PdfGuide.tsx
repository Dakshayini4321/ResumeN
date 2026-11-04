import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Modal } from './ui';

const KEY = 'cvforge:pdf-guide-dismissed';

export const pdfGuideDismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

type Browser = 'chromium' | 'firefox' | 'safari';
const detectBrowser = (): Browser => {
  const ua = navigator.userAgent;
  if (/firefox|fxios/i.test(ua)) return 'firefox';
  if (/safari/i.test(ua) && !/chrome|chromium|crios|edg|opr/i.test(ua)) return 'safari';
  return 'chromium';
};

/** Browser-specific steps so the saved PDF contains only the CV — no URL, date, title or page numbers. */
const STEPS: Record<Browser, [string, string][]> = {
  chromium: [
    ['Destination', 'Save as PDF'],
    ['Paper size', 'A4'],
    ['Margins', 'Default (or None) — don’t pick Minimum/Custom'],
    ['Scale', 'Default (100%)'],
  ],
  firefox: [
    ['Destination', 'Save to PDF'],
    ['Paper size', 'A4 · Margins: None · Scale: 100%'],
    ['Print headers and footers', 'Off (untick)'],
    ['Print backgrounds', 'On (tick)'],
  ],
  safari: [
    ['Paper size', 'A4 · Scale: 100%'],
    ['Print headers and footers', 'Off (untick)'],
    ['Print backgrounds', 'On (tick)'],
    ['PDF button (bottom left)', 'Save as PDF'],
  ],
};

export function PdfGuide({ open, onClose, onContinue }: { open: boolean; onClose: () => void; onContinue: () => void }) {
  const [dontShow, setDontShow] = useState(true);
  const browser = detectBrowser();
  const go = () => {
    if (dontShow)
      try {
        localStorage.setItem(KEY, '1');
      } catch {
        /* storage unavailable — show again next time */
      }
    onContinue();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Download as PDF"
      subtitle="Your browser’s print dialog opens next."
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <label className="inline-flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
            <input type="checkbox" className="accent-brand-600" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            Don’t show again
          </label>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={go} autoFocus>
              <FileText size={16} /> Continue
            </button>
          </div>
        </div>
      }
    >
      <p className="text-sm text-slate-600">
        The PDF is an exact A4 copy of your preview, with real, selectable text that ATS systems can read. It contains only your CV: no website name,
        link, date or page numbers.
      </p>
      <div className="mt-4 rounded-lg border border-slate-200 divide-y divide-slate-100">
        {STEPS[browser].map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-3 py-2 text-sm">
            <span className="text-slate-500">{k}</span>
            <span className="font-medium text-slate-800 text-right">{v}</span>
          </div>
        ))}
      </div>
      {browser === 'chromium' ? (
        <p className="mt-3 text-xs text-slate-500">
          Chrome and Edge cannot add their headers or footers to this CV, so the “Headers and footers” option has no effect.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          {browser === 'firefox' ? 'Firefox' : 'Safari'} may add the page link, date and page numbers unless headers and footers are switched off. For
          the most reliable result, use Chrome or Edge.
        </p>
      )}
    </Modal>
  );
}
