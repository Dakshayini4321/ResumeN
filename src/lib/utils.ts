export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 12)
    : Math.random().toString(36).slice(2, 14);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM' -> 'Jan 2024'. Free text is returned unchanged. */
export function formatDate(value: string): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : m[1];
}

export function formatRange(start: string, end: string, current?: boolean): string {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export type DescBlock = { type: 'bullets'; items: string[] } | { type: 'para'; text: string };

/** Lines starting with -, *, • become bullet lists; other lines become paragraphs. */
export function parseDescription(text: string): DescBlock[] {
  const blocks: DescBlock[] = [];
  if (!text) return blocks;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = /^[-*•▪●]\s*(.*)$/.exec(line);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'bullets') last.items.push(bullet[1]);
      else blocks.push({ type: 'bullets', items: [bullet[1]] });
    } else {
      blocks.push({ type: 'para', text: line });
    }
  }
  return blocks;
}

export function stripUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

export function hrefFor(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  return `https://${url}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(name: string): string {
  return (name || 'resume').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'resume';
}

/** Resize an uploaded image to keep localStorage usage small. */
export function resizeImage(file: File, max = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unsupported'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString();
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
