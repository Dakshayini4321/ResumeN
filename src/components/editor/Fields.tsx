import type { ReactNode } from 'react';
import { cx } from '../../lib/utils';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="label">{label}</span>
      <input
        className="input disabled:bg-slate-50 disabled:text-slate-400"
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label flex justify-between">
        <span>{label}</span>
        {hint && <span className="font-normal text-slate-400">{hint}</span>}
      </span>
      <textarea
        className="input resize-y leading-relaxed"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function DateRange({
  start,
  end,
  current,
  onChange,
  currentLabel = 'Currently here',
}: {
  start: string;
  end: string;
  current?: boolean;
  onChange: (patch: { startDate?: string; endDate?: string; current?: boolean }) => void;
  currentLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField label="Start date" type="month" value={start} onChange={(v) => onChange({ startDate: v })} />
      <div>
        <TextField
          label="End date"
          type="month"
          value={current ? '' : end}
          disabled={current}
          onChange={(v) => onChange({ endDate: v })}
        />
        {current !== undefined && (
          <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={current}
              onChange={(e) => onChange({ current: e.target.checked })}
            />
            {currentLabel}
          </label>
        )}
      </div>
    </div>
  );
}

export const BULLET_HINT = 'Start a line with “-” for a bullet';
