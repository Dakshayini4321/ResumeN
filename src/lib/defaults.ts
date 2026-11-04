import type {
  ListItemMap,
  ListKey,
  Resume,
  ResumeData,
  SectionMeta,
  SectionType,
} from '../types/resume';
import { uid } from './utils';

export const SECTION_LABELS: Record<SectionType, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  achievements: 'Achievements',
  references: 'References',
  volunteering: 'Volunteering',
  custom: 'Custom Section',
};

export const BUILTIN_ORDER: Exclude<SectionType, 'custom'>[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
  'volunteering',
  'references',
];

export const makeSection = (type: SectionType, title?: string): SectionMeta => ({
  id: type === 'custom' ? `custom-${uid()}` : type,
  type,
  title: title ?? SECTION_LABELS[type],
  visible: true,
});

export const emptyItem: { [K in ListKey]: () => ListItemMap[K] } = {
  experience: () => ({
    id: uid(),
    position: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  }),
  education: () => ({
    id: uid(),
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    grade: '',
    description: '',
  }),
  skills: () => ({ id: uid(), name: '', level: 4 }),
  projects: () => ({ id: uid(), name: '', role: '', link: '', startDate: '', endDate: '', description: '' }),
  certifications: () => ({ id: uid(), name: '', issuer: '', date: '', link: '' }),
  languages: () => ({ id: uid(), name: '', proficiency: 'Professional' }),
  achievements: () => ({ id: uid(), title: '', date: '', description: '' }),
  references: () => ({ id: uid(), name: '', position: '', company: '', email: '', phone: '' }),
  volunteering: () => ({
    id: uid(),
    role: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  }),
};

export const emptyCustomItem = () => ({ id: uid(), title: '', subtitle: '', date: '', description: '' });

export function emptyData(): ResumeData {
  return {
    personal: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      photo: '',
    },
    summary: '',
    sections: BUILTIN_ORDER.map((t) => makeSection(t)),
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    references: [],
    volunteering: [],
    custom: {},
  };
}

export function sampleData(): ResumeData {
  return {
    personal: {
      fullName: 'Alexandra Morgan',
      jobTitle: 'Senior Product Manager',
      email: 'alex.morgan@email.com',
      phone: '+1 (555) 284-1937',
      location: 'San Francisco, CA',
      website: 'alexmorgan.io',
      linkedin: 'linkedin.com/in/alexmorgan',
      github: '',
      photo: '',
    },
    summary:
      'Senior Product Manager with 9+ years of experience building B2B SaaS and data products used by more than 2 million people. Proven record of taking products from zero to $10M+ ARR, leading cross-functional teams of up to 25, and turning customer research into roadmaps that move revenue, retention and NPS. Combines strong analytical skills (SQL, experimentation, pricing) with a hands-on, design-led approach to product discovery. Known for clear communication with executives, building high-trust teams and mentoring the next generation of product managers.',
    sections: [...BUILTIN_ORDER.map((t) => makeSection(t)), { id: SAMPLE_CUSTOM_ID, type: 'custom', title: 'Publications & Speaking', visible: true }],
    experience: [
      {
        id: uid(),
        position: 'Senior Product Manager, Analytics Platform',
        company: 'Brightwave Analytics',
        location: 'San Francisco, CA',
        startDate: '2021-03',
        endDate: '',
        current: true,
        description:
          'Lead product for the self-serve analytics platform (4 squads, 25 engineers, designers and data scientists) serving 1,800+ enterprise customers.\n' +
          '- Launched the self-serve analytics suite from concept to GA in 9 months, growing ARR by $6.4M within 18 months of launch\n' +
          '- Defined a 3-year product vision and quarterly OKRs across three product lines, aligning engineering, sales and marketing around a single roadmap\n' +
          '- Reduced logo churn by 23% by introducing guided onboarding, in-app health scores and proactive success alerts\n' +
          '- Introduced continuous discovery practices (weekly customer interviews, opportunity trees), cutting time-to-validated-idea from 6 weeks to 2\n' +
          '- Partnered with the CFO on a new usage-based packaging model, lifting average contract value by 18%',
      },
      {
        id: uid(),
        position: 'Product Manager, Billing & Monetization',
        company: 'Nimbus Cloud',
        location: 'Seattle, WA',
        startDate: '2018-01',
        endDate: '2021-02',
        current: false,
        description:
          '- Owned the billing and subscriptions platform processing $120M in annual revenue across 40 countries\n' +
          '- Shipped usage-based pricing and self-serve plan upgrades, increasing expansion revenue by 31% year over year\n' +
          '- Cut failed-payment revenue loss by $2.1M per year with smart retries, card updater and dunning emails\n' +
          '- Built a customer feedback pipeline with sales and support that fed 60% of the roadmap items shipped in 2020\n' +
          '- Hired and mentored two associate product managers, both promoted within 18 months',
      },
      {
        id: uid(),
        position: 'Associate Product Manager',
        company: 'Lumen Labs',
        location: 'New York, NY',
        startDate: '2016-07',
        endDate: '2017-12',
        current: false,
        description:
          '- Ran 40+ onboarding and pricing experiments, lifting trial-to-paid conversion from 4.1% to 6.8%\n' +
          '- Built the first company-wide KPI dashboards, used daily by 200+ employees across finance, marketing and success\n' +
          '- Coordinated the launch of enterprise single sign-on, adopted by 85% of enterprise accounts within two quarters',
      },
      {
        id: uid(),
        position: 'Business Analyst',
        company: 'Vertex Consulting',
        location: 'Chicago, IL',
        startDate: '2014-06',
        endDate: '2016-06',
        current: false,
        description:
          '- Delivered market sizing, pricing and competitive analyses for Fortune 500 clients in retail, telecom and financial services\n' +
          '- Built a pricing model that informed a $40M product-line restructuring for a national retailer',
      },
    ],
    education: [
      {
        id: uid(),
        degree: 'MBA, Technology Management',
        institution: 'University of Washington, Foster School of Business',
        location: 'Seattle, WA',
        startDate: '2016-09',
        endDate: '2018-06',
        current: false,
        grade: 'Dean’s List; Evening MBA program',
        description: '- Concentration in product management and data-driven decision making\n- President, Product Management Club (300+ members)',
      },
      {
        id: uid(),
        degree: 'B.S. Economics, Minor in Computer Science',
        institution: 'University of Illinois Urbana-Champaign',
        location: 'Urbana-Champaign, IL',
        startDate: '2010-09',
        endDate: '2014-05',
        current: false,
        grade: 'GPA 3.8 / 4.0 — Magna Cum Laude',
        description: '',
      },
    ],
    skills: [
      { id: uid(), name: 'Product Strategy & Vision', level: 5 },
      { id: uid(), name: 'Roadmapping & OKRs', level: 5 },
      { id: uid(), name: 'Customer Discovery', level: 5 },
      { id: uid(), name: 'Pricing & Packaging', level: 4 },
      { id: uid(), name: 'SQL & Data Analysis', level: 4 },
      { id: uid(), name: 'A/B Testing', level: 4 },
      { id: uid(), name: 'Agile / Scrum', level: 5 },
      { id: uid(), name: 'Stakeholder Management', level: 5 },
      { id: uid(), name: 'Go-to-Market Planning', level: 4 },
      { id: uid(), name: 'Figma & Prototyping', level: 3 },
      { id: uid(), name: 'Amplitude / Mixpanel', level: 4 },
      { id: uid(), name: 'Jira & Confluence', level: 4 },
    ],
    projects: [
      {
        id: uid(),
        name: 'Open Metrics Toolkit',
        role: 'Creator & Maintainer',
        link: 'github.com/alexm/open-metrics',
        startDate: '2022-01',
        endDate: '2022-08',
        description:
          '- Open-source library of standard SaaS KPI definitions (activation, retention, NRR) with ready-made SQL\n- Adopted by 40+ startups; 1,200+ GitHub stars',
      },
      {
        id: uid(),
        name: 'The PM Interview Handbook',
        role: 'Author',
        link: 'pmhandbook.dev',
        startDate: '2023-01',
        endDate: '2023-06',
        description: '- Free online guide with 60 worked case studies, read by 25,000+ aspiring product managers',
      },
    ],
    certifications: [
      { id: uid(), name: 'Certified Scrum Product Owner (CSPO)', issuer: 'Scrum Alliance', date: '2020-05', link: '' },
      { id: uid(), name: 'Google Data Analytics Professional Certificate', issuer: 'Google', date: '2022-02', link: '' },
      { id: uid(), name: 'Pragmatic Institute Certified (PMC-III)', issuer: 'Pragmatic Institute', date: '2019-09', link: '' },
    ],
    languages: [
      { id: uid(), name: 'English', proficiency: 'Native' },
      { id: uid(), name: 'Spanish', proficiency: 'Professional' },
      { id: uid(), name: 'French', proficiency: 'Intermediate' },
    ],
    achievements: [
      {
        id: uid(),
        title: 'Product Leader of the Year — Brightwave Analytics',
        date: '2023-12',
        description: 'Company-wide award for leading the most successful product launch in the company’s history.',
      },
      {
        id: uid(),
        title: 'President’s Club — Nimbus Cloud',
        date: '2020-01',
        description: 'One of 12 employees (out of 900) recognized for exceptional revenue impact.',
      },
    ],
    references: [
      {
        id: uid(),
        name: 'Daniel Reyes',
        position: 'VP of Product',
        company: 'Brightwave Analytics',
        email: 'd.reyes@brightwave.example',
        phone: '+1 (555) 410-2280',
      },
      {
        id: uid(),
        name: 'Priya Nair',
        position: 'Director of Engineering',
        company: 'Nimbus Cloud',
        email: 'priya.nair@nimbus.example',
        phone: '',
      },
    ],
    volunteering: [
      {
        id: uid(),
        role: 'Product Mentor',
        organization: 'Code for Good',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: '',
        current: true,
        description:
          '- Mentor 6 early-career product managers per cohort from underrepresented backgrounds through a 12-week program\n- 80% of mentees landed product roles within six months',
      },
      {
        id: uid(),
        role: 'Board Member, Digital Operations',
        organization: 'Bay Area Food Bank',
        location: 'Oakland, CA',
        startDate: '2018-03',
        endDate: '2021-12',
        current: false,
        description: '- Led a volunteer-scheduling app rollout that doubled weekend volunteer turnout',
      },
    ],
    custom: {
      [SAMPLE_CUSTOM_ID]: [
        {
          id: uid(),
          title: '“Designing Metrics That Matter”',
          subtitle: 'Mind the Product — published article',
          date: '2022-09',
          description: 'How to choose a north-star metric and supporting input metrics for B2B products.',
        },
        {
          id: uid(),
          title: 'Pricing Is a Product Feature',
          subtitle: 'SaaS Product Summit, San Francisco — conference talk',
          date: '2023-04',
          description: 'Talk to 600+ attendees on running safe pricing experiments in B2B SaaS.',
        },
      ],
    },
  };
}

const SAMPLE_CUSTOM_ID = 'custom-sample-publications';

/**
 * Brings any stored resume up to the current schema: fills missing keys and
 * converts legacy custom "Volunteering" sections into the built-in section.
 */
export function normalizeResume(r: Resume): Resume {
  const base = emptyData();
  const data = { ...base, ...r.data, personal: { ...base.personal, ...r.data?.personal } };
  data.custom = { ...(data.custom ?? {}) };
  let sections = [...(data.sections ?? base.sections)];

  if (!sections.some((s) => s.type === 'volunteering')) {
    const legacy = sections.find((s) => s.type === 'custom' && /^volunteer/i.test(s.title.trim()));
    if (legacy) {
      const items = data.custom[legacy.id] ?? [];
      data.volunteering = [
        ...data.volunteering,
        ...items.map((c) => ({
          id: c.id,
          role: c.title,
          organization: c.subtitle,
          location: '',
          startDate: c.date,
          endDate: '',
          current: false,
          description: c.description,
        })),
      ];
      delete data.custom[legacy.id];
      sections = sections.map((s) => (s.id === legacy.id ? { ...makeSection('volunteering', s.title), visible: s.visible } : s));
    } else {
      const refIdx = sections.findIndex((s) => s.type === 'references');
      const sec = makeSection('volunteering');
      if (refIdx >= 0) sections.splice(refIdx, 0, sec);
      else sections.push(sec);
    }
  }
  data.sections = sections;

  const defaults: Resume['settings'] = {
    fontFamily: '',
    accentColor: '',
    fontScale: 'medium',
    showPhoto: true,
    photoShape: '',
    lineSpacing: 'normal',
  };
  const settings: Resume['settings'] = { ...defaults, ...(r.settings as Partial<Resume['settings']>) };
  return { ...r, templateId: TEMPLATE_ALIASES[r.templateId] ?? r.templateId, settings, data };
}

/** Templates that were removed map onto their closest remaining design. */
export const TEMPLATE_ALIASES: Record<string, string> = {
  aurora: 'elegant',
  portrait: 'prestige',
  studio: 'horizon',
};

export const DEFAULT_TEMPLATE = 'classic';

export function createResume(name: string, withSample = false, templateId = DEFAULT_TEMPLATE): Resume {
  const now = Date.now();
  return {
    id: uid(),
    name,
    templateId,
    createdAt: now,
    updatedAt: now,
    settings: {
      fontFamily: '', // '' = use the template's recommended font
      accentColor: '', // '' = use the template's recommended color
      fontScale: 'medium',
      showPhoto: true,
      photoShape: '', // '' = template default
      lineSpacing: 'normal',
    },
    data: withSample ? sampleData() : emptyData(),
  };
}
