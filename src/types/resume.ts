/**
 * Centralized resume data model.
 * Every template renders from this single structure — content is entered once
 * and re-used by all templates, the DOCX exporter and the PDF/print renderer.
 */

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'references'
  | 'volunteering'
  | 'custom';

export interface SectionMeta {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photo: string; // data URL ('' when none)
}

export interface ExperienceItem {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string; // 'YYYY-MM'
  endDate: string;
  current: boolean;
  description: string; // lines beginning with '-' or '•' become bullets
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  grade: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 1-5
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  link: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
}

export interface VolunteeringItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CustomItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

export type FontScale = 'small' | 'medium' | 'large';
export type PhotoShape = 'circle' | 'rounded' | 'square';

export interface ResumeSettings {
  fontFamily: string; // key from FONT_OPTIONS ('' = template default)
  accentColor: string; // '' = template default
  fontScale: FontScale;
  showPhoto: boolean;
  photoShape: PhotoShape | ''; // '' = template default
  lineSpacing: 'compact' | 'normal' | 'relaxed';
}

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  sections: SectionMeta[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  achievements: AchievementItem[];
  references: ReferenceItem[];
  volunteering: VolunteeringItem[];
  custom: Record<string, CustomItem[]>; // keyed by custom SectionMeta.id
}

export interface Resume {
  id: string;
  name: string;
  templateId: string;
  createdAt: number;
  updatedAt: number;
  settings: ResumeSettings;
  data: ResumeData;
}

/** Collections that hold a list of entries, keyed by their data property name. */
export type ListKey =
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'references'
  | 'volunteering';

export type ListItemMap = {
  volunteering: VolunteeringItem;
  experience: ExperienceItem;
  education: EducationItem;
  skills: SkillItem;
  projects: ProjectItem;
  certifications: CertificationItem;
  languages: LanguageItem;
  achievements: AchievementItem;
  references: ReferenceItem;
};
