import type { Resume } from '../types/resume';
import { createResume, sampleData } from './defaults';
import { uid } from './utils';

/**
 * Stress-test data: the standard sample plus long descriptions, extra roles,
 * a custom section and every section populated. Used by the #/render test route.
 */
export function longSampleResume(templateId: string, withPhoto: boolean): Resume {
  const r = createResume('Stress test', true, templateId);
  const d = sampleData();
  d.summary +=
    ' Known for building high-trust teams, simplifying complex domains into intuitive experiences, and partnering closely with engineering, design, marketing and sales to deliver outcomes that matter to customers and the business alike.';
  d.experience.push(
    {
      id: uid(),
      position: 'Associate Product Manager — Growth & Monetization Platform',
      company: 'Lumen Labs International Holdings',
      location: 'New York, NY',
      startDate: '2014-06',
      endDate: '2016-05',
      current: false,
      description:
        '- Ran 40+ pricing and onboarding experiments across web and mobile, lifting trial-to-paid conversion from 4.1% to 6.8% within two quarters while keeping refund rates flat\n- Built the first self-serve analytics dashboards used daily by 200+ employees across finance, marketing and customer success, replacing a weekly manual reporting process\n- Coordinated a cross-functional launch with legal, security and support teams for an enterprise single sign-on feature adopted by 85% of enterprise accounts\n- Wrote a supercalifragilisticexpialidociously-long-unbroken-identifier-to-test-wrapping-behaviour-in-narrow-columns',
    },
    {
      id: uid(),
      position: 'Product Intern',
      company: 'Orbit Mobile',
      location: 'Austin, TX',
      startDate: '2013-06',
      endDate: '2013-09',
      current: false,
      description:
        'Supported the mobile team with competitive research, usability studies and backlog grooming.\n- Synthesised 30 user interviews into a prioritised opportunity map\n- Shipped two small features end-to-end with a senior engineer',
    },
  );
  d.skills.push(
    { id: uid(), name: 'Pricing & Packaging', level: 4 },
    { id: uid(), name: 'Go-to-Market Strategy', level: 4 },
    { id: uid(), name: 'Data Visualization', level: 3 },
    { id: uid(), name: 'Python', level: 2 },
  );
  d.languages.push({ id: uid(), name: 'French', proficiency: 'Intermediate' });
  d.projects.push({
    id: uid(),
    name: 'PM Interview Handbook',
    role: 'Author',
    link: 'pmhandbook.dev',
    startDate: '2023-01',
    endDate: '2023-06',
    description: '- Free guide read by 25,000+ aspiring product managers\n- Includes 60 worked case studies and templates',
  });
  d.volunteering.push({
    id: uid(),
    role: 'Board Member',
    organization: 'Bay Area Food Bank',
    location: 'Oakland, CA',
    startDate: '2018-03',
    endDate: '2021-12',
    current: false,
    description: '- Led a digital volunteer-scheduling initiative that doubled weekend volunteer turnout',
  });
  const customId = `custom-${uid()}`;
  d.sections.push({ id: customId, type: 'custom', title: 'Publications', visible: true });
  d.custom[customId] = [
    {
      id: uid(),
      title: 'Designing Metrics That Matter',
      subtitle: 'Mind the Product',
      date: '2022-09',
      description: 'Article on choosing north-star metrics for B2B products.',
    },
  ];
  if (withPhoto) d.personal.photo = makePlaceholderPhoto();
  r.data = d;
  return r;
}

/** The exact "Start from example" CV, optionally with a placeholder photo. */
export function exampleResume(templateId: string, withPhoto: boolean): Resume {
  const r = createResume('Example CV', true, templateId);
  if (withPhoto) r.data.personal.photo = makePlaceholderPhoto();
  return r;
}

function makePlaceholderPhoto(): string {
  const c = document.createElement('canvas');
  c.width = 300;
  c.height = 360;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 300, 360);
  g.addColorStop(0, '#cbd5e1');
  g.addColorStop(1, '#64748b');
  x.fillStyle = g;
  x.fillRect(0, 0, 300, 360);
  x.fillStyle = '#f1f5f9';
  x.beginPath();
  x.arc(150, 140, 62, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.ellipse(150, 360, 120, 110, 0, 0, Math.PI * 2);
  x.fill();
  return c.toDataURL('image/jpeg', 0.85);
}
