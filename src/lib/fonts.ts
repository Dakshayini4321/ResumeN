export interface FontOption {
  key: string;
  label: string;
  stack: string;
  docx: string; // font name for DOCX export (Word-safe fallback)
  serif?: boolean;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: 'inter', label: 'Inter', stack: "'Inter', Arial, sans-serif", docx: 'Arial' },
  { key: 'arial', label: 'Arial', stack: 'Arial, Helvetica, sans-serif', docx: 'Arial' },
  { key: 'calibri', label: 'Calibri / Carlito', stack: "Calibri, Carlito, 'Segoe UI', Arial, sans-serif", docx: 'Calibri' },
  { key: 'roboto', label: 'Roboto', stack: "'Roboto', Arial, sans-serif", docx: 'Arial' },
  { key: 'lato', label: 'Lato', stack: "'Lato', Arial, sans-serif", docx: 'Calibri' },
  { key: 'opensans', label: 'Open Sans', stack: "'Open Sans', Arial, sans-serif", docx: 'Arial' },
  { key: 'sourcesans', label: 'Source Sans', stack: "'Source Sans 3', Arial, sans-serif", docx: 'Calibri' },
  { key: 'ibmplex', label: 'IBM Plex Sans', stack: "'IBM Plex Sans', Arial, sans-serif", docx: 'Arial' },
  { key: 'montserrat', label: 'Montserrat', stack: "'Montserrat', Arial, sans-serif", docx: 'Arial' },
  { key: 'poppins', label: 'Poppins', stack: "'Poppins', Arial, sans-serif", docx: 'Arial' },
  { key: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif", docx: 'Georgia', serif: true },
  { key: 'times', label: 'Times New Roman', stack: "'Times New Roman', Times, serif", docx: 'Times New Roman', serif: true },
  { key: 'garamond', label: 'EB Garamond', stack: "'EB Garamond', Garamond, Georgia, serif", docx: 'Garamond', serif: true },
  { key: 'merriweather', label: 'Merriweather', stack: "'Merriweather', Georgia, serif", docx: 'Georgia', serif: true },
  { key: 'baskerville', label: 'Libre Baskerville', stack: "'Libre Baskerville', Georgia, serif", docx: 'Georgia', serif: true },
  { key: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', Georgia, serif", docx: 'Georgia', serif: true },
];

export const getFont = (key: string): FontOption =>
  FONT_OPTIONS.find((f) => f.key === key) ?? FONT_OPTIONS[0];

export const ACCENT_PRESETS = [
  '#111827',
  '#1f3a5f',
  '#2547ea',
  '#0f766e',
  '#047857',
  '#7c3aed',
  '#be123c',
  '#b45309',
  '#334155',
  '#0e7490',
];

export const FONT_SCALE_PX: Record<'small' | 'medium' | 'large', number> = {
  small: 12.5,
  medium: 13.5,
  large: 14.5,
};

export const LINE_SPACING: Record<'compact' | 'normal' | 'relaxed', number> = {
  compact: 1.35,
  normal: 1.5,
  relaxed: 1.65,
};
