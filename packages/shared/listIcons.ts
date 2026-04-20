/**
 * List icons are stored as either:
 * - a plain string (legacy / emoji), or
 * - `lucide:<PascalCaseName>` for Lucide symbols from the bookmark-list picker.
 */
export const LUCIDE_LIST_ICON_PREFIX = "lucide:" as const;

/**
 * Lucide icons grouped for the list picker (order within each group is intentional).
 */
export const BOOKMARK_LIST_ICON_GROUPS = [
  {
    id: "general",
    i18nKey: "icon_group_general",
    icons: [
      "Pin",
      "Tag",
      "Link2",
      "LayoutGrid",
      "Layers",
      "Box",
      "Gift",
      "Eye",
      "Shield",
      "Scale",
      "Clock",
      "Timer",
      "Hourglass",
      "Calendar",
      "Archive",
      "AlarmClock",
      "Bot",
      "Wand2",
    ],
  },
  {
    id: "favorites_mood",
    i18nKey: "icon_group_favorites_mood",
    icons: [
      "Star",
      "Heart",
      "Sparkles",
      "Flame",
      "Zap",
      "ThumbsUp",
      "Smile",
      "Laugh",
      "PartyPopper",
      "Award",
      "Trophy",
      "Medal",
      "Crown",
      "Gem",
      "Flag",
    ],
  },
  {
    id: "home_living",
    i18nKey: "icon_group_home_living",
    icons: [
      "Home",
      "Key",
      "Lock",
      "ShoppingBag",
      "Package",
      "Bed",
      "Sofa",
      "Lamp",
      "Armchair",
      "CookingPot",
      "Shirt",
      "Watch",
      "Glasses",
      "Backpack",
      "Luggage",
      "Umbrella",
      "Wallet",
      "DoorOpen",
    ],
  },
  {
    id: "work_study",
    i18nKey: "icon_group_work_study",
    icons: [
      "Briefcase",
      "Laptop",
      "GraduationCap",
      "Library",
      "FileText",
      "PenLine",
      "BookOpen",
      "BookCopy",
      "BookMarked",
      "Bookmark",
      "List",
      "ListChecks",
      "ClipboardList",
      "Notebook",
      "NotepadText",
      "BookText",
      "ScrollText",
      "Brain",
      "Lightbulb",
      "Folder",
      "FolderOpen",
      "Terminal",
      "Braces",
    ],
  },
  {
    id: "communication",
    i18nKey: "icon_group_communication",
    icons: [
      "Mail",
      "Phone",
      "MessageCircle",
      "Send",
      "Share2",
      "Inbox",
      "Bell",
      "BellRing",
      "Megaphone",
      "Newspaper",
      "Rss",
      "Podcast",
      "Users",
    ],
  },
  {
    id: "media_tech",
    i18nKey: "icon_group_media_tech",
    icons: [
      "Camera",
      "Film",
      "Music",
      "Smartphone",
      "Monitor",
      "Headphones",
      "Mic",
      "Video",
      "Tv",
      "Radio",
      "Wifi",
      "Code",
      "Cpu",
      "Palette",
      "Gamepad2",
      "Bug",
      "Wrench",
      "Settings",
      "Cog",
      "Printer",
      "Cuboid",
      "ScanLine",
      "PenTool",
      "Shapes",
      "LayoutTemplate",
      "Microscope",
    ],
  },
  {
    id: "nature_weather",
    i18nKey: "icon_group_nature_weather",
    icons: [
      "Sun",
      "Moon",
      "Cloud",
      "CloudRain",
      "Snowflake",
      "Leaf",
      "TreePine",
      "Mountain",
      "Waves",
      "Flower2",
      "Rainbow",
      "Sprout",
      "Bean",
      "Vegan",
      "Dna",
    ],
  },
  {
    id: "travel_places",
    i18nKey: "icon_group_travel_places",
    icons: [
      "Plane",
      "PlaneTakeoff",
      "Train",
      "TrainFront",
      "Bus",
      "Car",
      "Truck",
      "Ship",
      "Sailboat",
      "Anchor",
      "MapPin",
      "Compass",
      "Globe",
      "Globe2",
      "Earth",
      "Landmark",
      "Hotel",
      "Castle",
      "Tent",
      "Caravan",
      "Fuel",
      "Map",
      "ParkingCircle",
      "Rocket",
      "Skull",
      "Swords",
      "Ghost",
    ],
  },
  {
    id: "food_drink",
    i18nKey: "icon_group_food_drink",
    icons: [
      "Pizza",
      "Coffee",
      "Wine",
      "Apple",
      "Banana",
      "Candy",
      "Cherry",
      "Cookie",
      "Croissant",
      "Donut",
      "Egg",
      "Grape",
      "IceCream",
      "Milk",
      "Sandwich",
      "Soup",
      "UtensilsCrossed",
    ],
  },
  {
    id: "sports_hobby",
    i18nKey: "icon_group_sports_hobby",
    icons: [
      "Bike",
      "Dumbbell",
      "Volleyball",
      "Target",
      "Activity",
      "Fish",
      "Bird",
      "Dog",
      "Cat",
      "Baby",
      "PersonStanding",
      "Paintbrush",
      "Guitar",
      "Footprints",
    ],
  },
  {
    id: "health_buildings",
    i18nKey: "icon_group_health_buildings",
    icons: [
      "Stethoscope",
      "Hospital",
      "Ambulance",
      "School",
      "Church",
      "Store",
      "Factory",
      "Construction",
      "HardHat",
      "TrafficCone",
    ],
  },
] as const;

export type BookmarkListLucideIconName =
  (typeof BOOKMARK_LIST_ICON_GROUPS)[number]["icons"][number];

const ALLOWED_LUCIDE_ICON_NAMES = new Set<string>(
  BOOKMARK_LIST_ICON_GROUPS.flatMap((g) => [...g.icons]),
);

export const BOOKMARK_LIST_LUCIDE_ICON_NAMES: readonly BookmarkListLucideIconName[] =
  Array.from(ALLOWED_LUCIDE_ICON_NAMES) as BookmarkListLucideIconName[];

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

export function isAllowedLucideListIconName(
  name: string,
): name is BookmarkListLucideIconName {
  return ALLOWED_LUCIDE_ICON_NAMES.has(name);
}

/**
 * Emoji shown for Lucide list icons in API `icon` (e.g. titles like `${icon} ${name}` on
 * older clients). Icons in the same picker group share one emoji so we avoid leaking
 * `lucide:Name` into plain-text UIs.
 */
const LUCIDE_LIST_ICON_GROUP_FALLBACK_EMOJI: Record<
  (typeof BOOKMARK_LIST_ICON_GROUPS)[number]["id"],
  string
> = {
  general: "📌",
  favorites_mood: "⭐",
  home_living: "🏠",
  work_study: "📚",
  communication: "💬",
  media_tech: "🖥️",
  nature_weather: "🌿",
  travel_places: "✈️",
  food_drink: "🍽️",
  sports_hobby: "⚽",
  health_buildings: "🏥",
};

function lucideListIconDisplayEmoji(name: BookmarkListLucideIconName): string {
  for (const g of BOOKMARK_LIST_ICON_GROUPS) {
    if ((g.icons as readonly string[]).includes(name)) {
      return LUCIDE_LIST_ICON_GROUP_FALLBACK_EMOJI[g.id];
    }
  }
  return "📋";
}

/**
 * Maps a stored list `icon` column to API fields: `icon` is always safe to prefix before
 * a list name (emoji); `symbolicIcon` is set when the list uses a Lucide symbol (`lucide:…`).
 */
export function bookmarkListIconToApiFields(storedIcon: string): {
  icon: string;
  symbolicIcon?: string;
} {
  if (!isLucideListIcon(storedIcon)) {
    return { icon: storedIcon };
  }
  const name = lucideListIconName(storedIcon);
  if (!name || !isAllowedLucideListIconName(name)) {
    return { icon: "📋", symbolicIcon: storedIcon };
  }
  return {
    icon: lucideListIconDisplayEmoji(name),
    symbolicIcon: storedIcon,
  };
}

/** Token passed to `ListIcon` / edit forms: Lucide storage string or emoji. */
export function bookmarkListIconTokenForUi(list: {
  icon: string;
  symbolicIcon?: string | null;
}): string {
  return list.symbolicIcon ?? list.icon;
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
