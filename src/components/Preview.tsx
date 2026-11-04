import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { Resume } from '../types/resume';
import { ResumeRenderer, getTemplate } from '../templates/registry';

const MM = 96 / 25.4;
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;

/**
 * Print uses zero page margins; each template's column padding is repeated at the top and
 * bottom of every page. In the continuous preview, page 1 therefore holds (297 - bottom) mm
 * and every following page (297 - top - bottom) mm of content.
 */
function pageMetrics(pad: { top: number; bottom: number }) {
  const first = (297 - pad.bottom) * MM;
  const next = (297 - pad.top - pad.bottom) * MM;
  return {
    first,
    next,
    bottomPad: pad.bottom * MM,
    pagesFor: (h: number) => (h <= first + 2 ? 1 : 1 + Math.ceil((h - first - 2) / next)),
    breakAt: (i: number) => first + next * i, // y of the i-th break (0-based)
  };
}

export function Preview({ resume }: { resume: Resume }) {
  const metrics = pageMetrics(getTemplate(resume.templateId).flowPad);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(800);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // measure natural content height to compute page count
  const measure = () => {
    const page = pageRef.current?.querySelector<HTMLElement>('.cv-page');
    if (!page) return;
    const prev = page.style.minHeight;
    page.style.minHeight = '0';
    const h = page.offsetHeight;
    page.style.minHeight = prev;
    setPages(metrics.pagesFor(h));
  };
  useLayoutEffect(measure, [resume]);
  useEffect(() => {
    document.fonts?.ready.then(measure);
    const page = pageRef.current?.querySelector<HTMLElement>('.cv-page');
    if (!page) return;
    const ro = new ResizeObserver(() => measure());
    // observe inner content (first child) so font swaps trigger re-measure
    Array.from(page.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.templateId]);

  const fit = Math.min(1.25, Math.max(0.3, (containerW - 48) / PAGE_W));
  const scale = zoom === 'fit' ? fit : zoom;
  // last page is shown at full sheet height so the preview always ends on a whole page
  const totalH = pages === 1 ? PAGE_H : metrics.breakAt(pages - 2) + metrics.next + metrics.bottomPad;

  return (
    <div className="relative h-full flex flex-col">
      <div ref={containerRef} className="flex-1 overflow-auto scrollbar-thin">
        <div className="py-6 flex justify-center" style={{ minWidth: PAGE_W * scale + 48 }}>
          <div style={{ width: PAGE_W * scale, height: totalH * scale }} className="relative shrink-0">
            <div
              ref={pageRef}
              className="origin-top-left absolute top-0 left-0 shadow-page bg-white"
              style={{ transform: `scale(${scale})`, width: PAGE_W, ['--min-h' as string]: `${totalH}px` }}
            >
              <div className="preview-host">
                <ResumeRenderer resume={resume} />
              </div>
              {Array.from({ length: pages - 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: metrics.breakAt(i) }}
                >
                  <div className="border-t-2 border-dashed border-rose-400/70" />
                  <span className="absolute right-2 -top-3 bg-rose-500 text-white text-[11px] font-semibold rounded px-1.5 py-0.5">
                    Page {i + 2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-soft px-2 py-1 text-xs text-slate-600">
        <button className="btn-icon !w-7 !h-7" onClick={() => setZoom(Math.max(0.3, +(scale - 0.1).toFixed(2)))} title="Zoom out">
          <Minus size={14} />
        </button>
        <span className="w-12 text-center tabular-nums font-medium">{Math.round(scale * 100)}%</span>
        <button className="btn-icon !w-7 !h-7" onClick={() => setZoom(Math.min(2, +(scale + 0.1).toFixed(2)))} title="Zoom in">
          <Plus size={14} />
        </button>
        <button
          className={`btn-icon !w-7 !h-7 ${zoom === 'fit' ? '!text-brand-600' : ''}`}
          onClick={() => setZoom('fit')}
          title="Fit to width"
        >
          <Maximize2 size={13} />
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <span className="px-1.5 font-medium">
          {pages} page{pages > 1 ? 's' : ''} · A4
        </span>
      </div>
    </div>
  );
}
