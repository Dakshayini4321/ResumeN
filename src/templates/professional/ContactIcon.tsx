import { Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const ICONS = { email: Mail, phone: Phone, location: MapPin, website: Globe, linkedin: Linkedin, github: Github } as const;

/** Decorative only — the contact value itself is always plain text next to the icon. */
export function ContactIcon({ kind, color, size = '1em' }: { kind: string; color?: string; size?: string }) {
  const Icon = ICONS[kind as keyof typeof ICONS] ?? Globe;
  return <Icon aria-hidden="true" focusable="false" style={{ width: size, height: size, color, flexShrink: 0 }} strokeWidth={2} />;
}
