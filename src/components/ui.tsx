import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cx } from '../lib/utils';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fade_.15s_ease]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]',
          wide ? 'max-w-6xl' : 'max-w-md',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button className="btn-icon -mr-2" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn bg-rose-600 text-white hover:bg-rose-700" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export function PromptDialog({
  open,
  title,
  initial,
  onSubmit,
  onCancel,
  confirmLabel = 'Save',
}: {
  open: boolean;
  title: string;
  initial: string;
  onSubmit: (v: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setValue(initial);
      setTimeout(() => ref.current?.select(), 30);
    }
  }, [open, initial]);
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!value.trim()} onClick={() => onSubmit(value.trim())}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <input
        ref={ref}
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSubmit(value.trim())}
      />
    </Modal>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-slate-300',
      )}
    >
      <span
        className={cx(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
}: {
  trigger: (open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div
          className={cx(
            'absolute z-40 mt-2 min-w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
  hint,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon && <span className="shrink-0 text-current opacity-70">{icon}</span>}
      <span className="flex-1">
        {children}
        {hint && <span className="block text-xs text-slate-400 font-normal">{hint}</span>}
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition',
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-xl bg-slate-900 text-white text-sm px-4 py-2.5 shadow-2xl">
      {message}
    </div>
  );
}
