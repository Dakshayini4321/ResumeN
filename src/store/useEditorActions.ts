import { useMemo } from 'react';
import type {
  CustomItem,
  ListItemMap,
  ListKey,
  PersonalInfo,
  ResumeSettings,
  SectionType,
} from '../types/resume';
import { emptyCustomItem, emptyItem, makeSection } from '../lib/defaults';
import { uid } from '../lib/utils';
import { useResumeStore } from './useResumeStore';

function move<T>(arr: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
  const [it] = arr.splice(from, 1);
  arr.splice(to, 0, it);
}

/** All mutations of the active resume go through these actions (and therefore through undo/redo + autosave). */
export function useEditorActions() {
  const update = useResumeStore((s) => s.update);

  return useMemo(
    () => ({
      setPersonal: <K extends keyof PersonalInfo>(field: K, value: PersonalInfo[K]) =>
        update((r) => {
          r.data.personal[field] = value;
        }, `personal.${field}`),

      setSummary: (value: string) =>
        update((r) => {
          r.data.summary = value;
        }, 'summary'),

      /* ---------- list items ---------- */
      addItem: <K extends ListKey>(key: K): string => {
        const item = emptyItem[key]();
        update((r) => {
          (r.data[key] as ListItemMap[K][]).push(item as ListItemMap[K]);
        });
        return item.id;
      },
      updateItem: <K extends ListKey>(key: K, id: string, patch: Partial<ListItemMap[K]>) =>
        update(
          (r) => {
            const list = r.data[key] as ListItemMap[K][];
            const idx = list.findIndex((i) => i.id === id);
            if (idx >= 0) list[idx] = { ...list[idx], ...patch };
          },
          `${key}.${id}.${Object.keys(patch).join(',')}`,
        ),
      removeItem: (key: ListKey, id: string) =>
        update((r) => {
          (r.data[key] as { id: string }[]) = (r.data[key] as { id: string }[]).filter((i) => i.id !== id);
        }),
      duplicateItem: (key: ListKey, id: string) =>
        update((r) => {
          const list = r.data[key] as { id: string }[];
          const idx = list.findIndex((i) => i.id === id);
          if (idx >= 0) list.splice(idx + 1, 0, { ...list[idx], id: uid() });
        }),
      moveItem: (key: ListKey, id: string, dir: -1 | 1) =>
        update((r) => {
          const list = r.data[key] as { id: string }[];
          const idx = list.findIndex((i) => i.id === id);
          move(list, idx, idx + dir);
        }),

      /* ---------- custom section items ---------- */
      addCustomItem: (sectionId: string): string => {
        const item = emptyCustomItem();
        update((r) => {
          (r.data.custom[sectionId] ??= []).push(item);
        });
        return item.id;
      },
      updateCustomItem: (sectionId: string, id: string, patch: Partial<CustomItem>) =>
        update(
          (r) => {
            const list = r.data.custom[sectionId] ?? [];
            const idx = list.findIndex((i) => i.id === id);
            if (idx >= 0) list[idx] = { ...list[idx], ...patch };
          },
          `custom.${sectionId}.${id}.${Object.keys(patch).join(',')}`,
        ),
      removeCustomItem: (sectionId: string, id: string) =>
        update((r) => {
          r.data.custom[sectionId] = (r.data.custom[sectionId] ?? []).filter((i) => i.id !== id);
        }),
      duplicateCustomItem: (sectionId: string, id: string) =>
        update((r) => {
          const list = r.data.custom[sectionId] ?? [];
          const idx = list.findIndex((i) => i.id === id);
          if (idx >= 0) list.splice(idx + 1, 0, { ...list[idx], id: uid() });
        }),
      moveCustomItem: (sectionId: string, id: string, dir: -1 | 1) =>
        update((r) => {
          const list = r.data.custom[sectionId] ?? [];
          const idx = list.findIndex((i) => i.id === id);
          move(list, idx, idx + dir);
        }),

      /* ---------- sections ---------- */
      renameSection: (id: string, title: string) =>
        update((r) => {
          const s = r.data.sections.find((x) => x.id === id);
          if (s) s.title = title;
        }, `section.title.${id}`),
      toggleSection: (id: string) =>
        update((r) => {
          const s = r.data.sections.find((x) => x.id === id);
          if (s) s.visible = !s.visible;
        }),
      moveSection: (from: number, to: number) =>
        update((r) => {
          move(r.data.sections, from, to);
        }),
      removeSection: (id: string) =>
        update((r) => {
          const s = r.data.sections.find((x) => x.id === id);
          r.data.sections = r.data.sections.filter((x) => x.id !== id);
          // built-in data is kept so re-adding the section restores it; custom data is discarded
          if (s?.type === 'custom') delete r.data.custom[id];
        }),
      addSection: (type: SectionType, title?: string): string => {
        const s = makeSection(type, title);
        update((r) => {
          r.data.sections.push(s);
          if (type === 'custom') r.data.custom[s.id] = [];
        });
        return s.id;
      },

      /* ---------- design ---------- */
      setTemplate: (templateId: string) =>
        update((r) => {
          r.templateId = templateId;
        }),
      setSetting: <K extends keyof ResumeSettings>(key: K, value: ResumeSettings[K]) =>
        update((r) => {
          r.settings[key] = value;
        }, key === 'accentColor' ? 'settings.accent' : undefined),
    }),
    [update],
  );
}

export type EditorActions = ReturnType<typeof useEditorActions>;
