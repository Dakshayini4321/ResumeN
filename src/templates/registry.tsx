import type { ComponentType } from 'react';
import type { Resume } from '../types/resume';
import { TEMPLATE_ALIASES } from '../lib/defaults';
import { buildCtx, type TemplateCtx, type TemplateDefaults } from './shared';
import Classic from './ats/Classic';
import Modern from './ats/Modern';
import Executive from './ats/Executive';
import Minimal from './ats/Minimal';
import Compact from './ats/Compact';
import Technical from './ats/Technical';
import Academic from './ats/Academic';
import Elegant from './professional/Elegant';
import Horizon from './professional/Horizon';
import Prestige from './professional/Prestige';

export type TemplateCategory = 'ats' | 'professional';

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  tags: string[];
  defaults: TemplateDefaults;
  supportsPhoto: boolean;
  /** Vertical padding (mm) repeated at the top/bottom of every printed page — used for preview page guides. */
  flowPad: { top: number; bottom: number };
  component: ComponentType<{ ctx: TemplateCtx }>;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'classic',
    name: 'Classic',
    category: 'ats',
    description: 'Timeless centered header with ruled section headings.',
    tags: ['Single column', 'Serif'],
    defaults: { font: 'georgia', accent: '#111827' },
    supportsPhoto: false,
    flowPad: { top: 15, bottom: 15 },
    component: Classic,
  },
  {
    id: 'modern',
    name: 'Modern',
    category: 'ats',
    description: 'Clean left-aligned layout with accent headings.',
    tags: ['Single column', 'Sans-serif'],
    defaults: { font: 'inter', accent: '#2547ea' },
    supportsPhoto: false,
    flowPad: { top: 15, bottom: 15 },
    component: Modern,
  },
  {
    id: 'executive',
    name: 'Executive',
    category: 'ats',
    description: 'Authoritative small-caps headings for senior roles.',
    tags: ['Single column', 'Leadership'],
    defaults: { font: 'garamond', accent: '#1f3a5f' },
    supportsPhoto: false,
    flowPad: { top: 11, bottom: 15 },
    component: Executive,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    category: 'ats',
    description: 'Airy, understated design that lets content lead.',
    tags: ['Single column', 'Whitespace'],
    defaults: { font: 'inter', accent: '#475569' },
    supportsPhoto: false,
    flowPad: { top: 16, bottom: 16 },
    component: Minimal,
  },
  {
    id: 'compact',
    name: 'Compact',
    category: 'ats',
    description: 'Dense layout that fits long careers on fewer pages.',
    tags: ['Single column', 'Space-efficient'],
    defaults: { font: 'calibri', accent: '#0f766e' },
    supportsPhoto: false,
    flowPad: { top: 12, bottom: 12 },
    component: Compact,
  },
  {
    id: 'technical',
    name: 'Technical',
    category: 'ats',
    description: 'Labelled contact grid and skill columns for engineers.',
    tags: ['Single column', 'Tech'],
    defaults: { font: 'ibmplex', accent: '#0e7490' },
    supportsPhoto: false,
    flowPad: { top: 15, bottom: 15 },
    component: Technical,
  },
  {
    id: 'academic',
    name: 'Harvard',
    category: 'ats',
    description: 'Traditional academic format, organisation first.',
    tags: ['Single column', 'Serif', 'Graduate'],
    defaults: { font: 'times', accent: '#000000' },
    supportsPhoto: false,
    flowPad: { top: 15, bottom: 15 },
    component: Academic,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'professional',
    description: 'Rich sidebar with circular photo and refined serif display type.',
    tags: ['Two column', 'Photo optional', 'Sidebar'],
    defaults: { font: 'lato', accent: '#1f3a5f', photoShape: 'circle' },
    supportsPhoto: true,
    flowPad: { top: 13, bottom: 13 },
    component: Elegant,
  },
  {
    id: 'horizon',
    name: 'Horizon',
    category: 'professional',
    description: 'Bold color header band with photo and a two-column body.',
    tags: ['Two column', 'Photo optional', 'Bold'],
    defaults: { font: 'poppins', accent: '#0f766e', photoShape: 'rounded' },
    supportsPhoto: true,
    flowPad: { top: 8, bottom: 13 },
    component: Horizon,
  },
  {
    id: 'prestige',
    name: 'Prestige',
    category: 'professional',
    description: 'Accent edge, serif display name, portrait photo and timeline history.',
    tags: ['Timeline', 'Photo optional', 'Serif'],
    defaults: { font: 'sourcesans', accent: '#9a3412', photoShape: 'rounded' },
    supportsPhoto: true,
    flowPad: { top: 14, bottom: 14 },
    component: Prestige,
  },
];

export const getTemplate = (id: string): TemplateDef =>
  TEMPLATES.find((t) => t.id === (TEMPLATE_ALIASES[id] ?? id)) ?? TEMPLATES[0];

/** Renders any resume with any template — the single entry point used by preview, thumbnails and print. */
export function ResumeRenderer({ resume, templateId }: { resume: Resume; templateId?: string }) {
  const t = getTemplate(templateId ?? resume.templateId);
  const ctx = buildCtx(resume, t.defaults, t.supportsPhoto);
  const C = t.component;
  return <C ctx={ctx} />;
}
