/**
 * List icons are stored as either:
 * - a plain string (legacy / emoji), or
 * - `lucide:<PascalCaseName>` for Lucide symbols from the bookmark-list picker.
 */
export const LUCIDE_LIST_ICON_PREFIX = "lucide:" as const;

/** Favoriten, Auszeichnung, Status */
const LUCIDE_LIST_FAVORITES = [
  "Star",
  "Heart",
  "Sparkles",
  "Zap",
  "Flame",
  "Flag",
  "Trophy",
  "Medal",
  "Award",
  "Gem",
  "Crown",
  "Target",
  "Lightbulb",
  "Eye",
  "Palette",
  "Activity",
  "Shield",
] as const;

/** Listen, Lesen, Ablage */
const LUCIDE_LIST_BOOKS = [
  "Bookmark",
  "BookMarked",
  "BookOpen",
  "BookCopy",
  "List",
  "ListChecks",
  "LayoutGrid",
  "Layers",
  "Library",
  "Newspaper",
  "Rss",
  "FileText",
  "ClipboardList",
  "NotebookPen",
  "Inbox",
  "Archive",
  "Folder",
  "FolderOpen",
  "Package",
  "Box",
  "Link2",
] as const;

/** Kalender & Zeit */
const LUCIDE_LIST_TIME = [
  "Calendar",
  "CalendarDays",
  "AlarmClock",
  "Sun",
  "Moon",
] as const;

/** Zuhause, Kommunikation, Netz */
const LUCIDE_LIST_HOME = [
  "Home",
  "Key",
  "Lock",
  "Mail",
  "Phone",
  "MessageCircle",
  "Users",
  "Bell",
  "Globe",
  "Wifi",
  "Router",
] as const;

/** Arbeit & Technik */
const LUCIDE_LIST_WORK = [
  "Briefcase",
  "Laptop",
  "Smartphone",
  "Cpu",
  "Code",
  "Terminal",
  "Database",
  "Server",
  "Settings",
  "Scale",
  "HardDrive",
  "PenLine",
  "Mic",
  "BarChart3",
  "Banknote",
] as const;

/** Medien */
const LUCIDE_LIST_MEDIA = [
  "Camera",
  "Film",
  "Music",
  "Image",
  "Images",
  "Video",
  "Videotape",
  "Gamepad2",
] as const;

/** Transport & Orte */
const LUCIDE_LIST_TRANSPORT = [
  "Car",
  "Bus",
  "Train",
  "Plane",
  "PlaneTakeoff",
  "Ship",
  "Truck",
  "Bike",
  "MapPin",
  "Mountain",
  "TreePine",
  "Anchor",
  "Sailboat",
  "Umbrella",
  "Compass",
] as const;

/** Natur & Wetter */
const LUCIDE_LIST_NATURE = [
  "Cloud",
  "Snowflake",
  "Waves",
  "Leaf",
  "Flower2",
] as const;

/** Essen & Trinken */
const LUCIDE_LIST_FOOD = [
  "Coffee",
  "Wine",
  "Pizza",
  "Cherry",
  "Apple",
  "Cookie",
  "Candy",
  "IceCream",
  "Egg",
] as const;

/** Tiere, Naturkunde, Sonstiges */
const LUCIDE_LIST_LIFE = [
  "Dog",
  "Cat",
  "Bug",
  "Brain",
  "Gift",
  "GraduationCap",
  "Pin",
  "Rocket",
] as const;

/** Einkauf & Geld */
const LUCIDE_LIST_SHOP = [
  "Wallet",
  "ShoppingBag",
  "ShoppingCart",
  "ShoppingBasket",
] as const;

/** Weitere nützliche Symbole */
const LUCIDE_LIST_MORE = ["Bluetooth", "Tag", "Wrench"] as const;

/** Curated Lucide icons (grouped for UX; storage is still `lucide:Name`). */
export const BOOKMARK_LIST_LUCIDE_ICON_NAMES = [
  ...LUCIDE_LIST_FAVORITES,
  ...LUCIDE_LIST_BOOKS,
  ...LUCIDE_LIST_TIME,
  ...LUCIDE_LIST_HOME,
  ...LUCIDE_LIST_WORK,
  ...LUCIDE_LIST_MEDIA,
  ...LUCIDE_LIST_TRANSPORT,
  ...LUCIDE_LIST_NATURE,
  ...LUCIDE_LIST_FOOD,
  ...LUCIDE_LIST_LIFE,
  ...LUCIDE_LIST_SHOP,
  ...LUCIDE_LIST_MORE,
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
