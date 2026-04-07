export const LUCIDE_LIST_ICON_PREFIX = "lucide:" as const;

export function isLucideListIcon(icon: string): boolean {
  return icon.startsWith(LUCIDE_LIST_ICON_PREFIX);
}

export function getLucideIconNameFromListIcon(icon: string): string | null {
  if (!isLucideListIcon(icon)) {
    return null;
  }
  return icon.slice(LUCIDE_LIST_ICON_PREFIX.length);
}

export function makeLucideListIcon(iconName: string): string {
  return `${LUCIDE_LIST_ICON_PREFIX}${iconName}`;
}

/** Plain-text title: emoji + name, or name only for Lucide icons (no raw `lucide:` in UI strings). */
export function formatListTitlePlain(icon: string, name: string): string {
  if (isLucideListIcon(icon)) {
    return name;
  }
  return `${icon} ${name}`.trim();
}
