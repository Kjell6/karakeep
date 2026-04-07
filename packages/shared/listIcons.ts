/**
 * List icons are stored as either:
 * - a plain string (legacy / emoji), or
 * - `lucide:<PascalCaseName>` for Lucide symbols from the bookmark-list picker.
 */
export const LUCIDE_LIST_ICON_PREFIX = "lucide:" as const;

/** Curated Lucide icons available when creating or editing a list (sorted A–Z). */
export const BOOKMARK_LIST_LUCIDE_ICON_NAMES = [
  "Activity",
  "AlarmClock",
  "Archive",
  "Award",
  "Bell",
  "Bike",
  "BookCopy",
  "BookMarked",
  "Bookmark",
  "BookOpen",
  "Box",
  "Brain",
  "Briefcase",
  "Bug",
  "Bus",
  "Camera",
  "Car",
  "Cat",
  "Cloud",
  "Code",
  "Coffee",
  "Compass",
  "Cpu",
  "Crown",
  "Dog",
  "Egg",
  "Eye",
  "FileText",
  "Film",
  "Flag",
  "Flame",
  "Folder",
  "FolderOpen",
  "Gamepad2",
  "Gem",
  "Gift",
  "Globe",
  "GraduationCap",
  "Heart",
  "Home",
  "Inbox",
  "Key",
  "Laptop",
  "Leaf",
  "Layers",
  "LayoutGrid",
  "Library",
  "Lightbulb",
  "Link2",
  "List",
  "ListChecks",
  "Lock",
  "Mail",
  "MapPin",
  "Medal",
  "MessageCircle",
  "Mic",
  "Moon",
  "Mountain",
  "Music",
  "Newspaper",
  "Package",
  "Palette",
  "PenLine",
  "Phone",
  "Pin",
  "Plane",
  "Pizza",
  "Rocket",
  "Rss",
  "Scale",
  "Settings",
  "Shield",
  "Ship",
  "ShoppingBag",
  "Smartphone",
  "Snowflake",
  "Sparkles",
  "Star",
  "Sun",
  "Tag",
  "Target",
  "Train",
  "TreePine",
  "Trophy",
  "Truck",
  "Umbrella",
  "Users",
  "Wallet",
  "Waves",
  "Wine",
  "Wrench",
  "Zap",
] as const;

export type BookmarkListLucideIconName =
  (typeof BOOKMARK_LIST_LUCIDE_ICON_NAMES)[number];

export function isLucideListIcon(icon: string): boolean {
  return icon.startsWith(LUCIDE_LIST_ICON_PREFIX);
}

export function lucideListIconName(icon: string): string | null {
  if (!isLucideListIcon(icon)) {
    return null;
  }
  return icon.slice(LUCIDE_LIST_ICON_PREFIX.length);
}

export function formatLucideListIcon(name: BookmarkListLucideIconName): string {
  return `${LUCIDE_LIST_ICON_PREFIX}${name}`;
}

export function isAllowedLucideListIconName(name: string): name is BookmarkListLucideIconName {
  return (BOOKMARK_LIST_LUCIDE_ICON_NAMES as readonly string[]).includes(name);
}

const MAX_EMOJI_OR_LEGACY_ICON_LENGTH = 64;

export function isValidListIconField(icon: string): boolean {
  if (icon.length === 0 || icon.length > MAX_EMOJI_OR_LEGACY_ICON_LENGTH) {
    return false;
  }
  if (isLucideListIcon(icon)) {
    const name = icon.slice(LUCIDE_LIST_ICON_PREFIX.length);
    return name.length > 0 && isAllowedLucideListIconName(name);
  }
  return true;
}

/** Plain-text fallback for toasts / CLI (no HTML). */
export function listIconToPlainLabel(icon: string): string {
  if (isLucideListIcon(icon)) {
    return lucideListIconName(icon) ?? icon;
  }
  return icon;
}
