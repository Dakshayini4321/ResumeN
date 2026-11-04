import { useRef, useState } from 'react';
import { ImagePlus, Trash2, User } from 'lucide-react';
import type { PersonalInfo, Resume } from '../../types/resume';
import type { EditorActions } from '../../store/useEditorActions';
import { TEMPLATES, getTemplate } from '../../templates/registry';
import { resizeImage } from '../../lib/utils';
import { Toggle } from '../ui';
import { TextField } from './Fields';

const FIELDS: { key: keyof PersonalInfo; label: string; placeholder: string; type?: string; full?: boolean }[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'e.g. Alexandra Morgan' },
  { key: 'jobTitle', label: 'Job title', placeholder: 'e.g. Senior Product Manager' },
  { key: 'email', label: 'Email', placeholder: 'name@email.com', type: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+1 555 123 4567', type: 'tel' },
  { key: 'location', label: 'Location', placeholder: 'City, Country' },
  { key: 'website', label: 'Website / Portfolio', placeholder: 'yoursite.com' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/you' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/you' },
];

export function PersonalForm({ resume, actions }: { resume: Resume; actions: EditorActions }) {
  const p = resume.data.personal;
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const tpl = getTemplate(resume.templateId);

  const onFile = async (file?: File) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    if (file.size > 8 * 1024 * 1024) return setError('Image must be under 8 MB.');
    try {
      actions.setPersonal('photo', await resizeImage(file));
    } catch {
      setError('Could not read that image.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : <User className="text-slate-400" size={26} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary !py-1.5 !text-xs" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={14} /> {p.photo ? 'Change photo' : 'Upload photo'}
            </button>
            {p.photo && (
              <button className="btn-ghost !py-1.5 !text-xs text-rose-600" onClick={() => actions.setPersonal('photo', '')}>
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Toggle
              checked={resume.settings.showPhoto}
              onChange={(v) => actions.setSetting('showPhoto', v)}
              label="Show photo"
            />
            <span>
              Show photo{' '}
              {!tpl.supportsPhoto && (
                <span className="text-amber-600">
                  (optional — shown only in {TEMPLATES.filter((t) => t.supportsPhoto).map((t) => t.name).join(', ')})
                </span>
              )}
            </span>
          </div>
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <TextField
            key={f.key}
            label={f.label}
            type={f.type}
            placeholder={f.placeholder}
            value={p[f.key]}
            onChange={(v) => actions.setPersonal(f.key, v)}
          />
        ))}
      </div>
    </div>
  );
}
