"use client";

import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  Archive,
  Bell,
  BookOpen,
  Bookmark,
  Bot,
  Box,
  Brain,
  Briefcase,
  Camera,
  Car,
  ClipboardList,
  Cloud,
  Code,
  Coffee,
  Compass,
  Database,
  Film,
  Flag,
  Flame,
  Folder,
  FolderOpen,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Image,
  Inbox,
  Laptop,
  Layers,
  Leaf,
  Library,
  Lightbulb,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  Moon,
  Music,
  Newspaper,
  Package,
  Palette,
  Pin,
  Plane,
  Radio,
  Rocket,
  Rss,
  Search,
  Server,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Tag,
  TreePine,
  Trophy,
  Umbrella,
  User,
  Users,
  Video,
  Wrench,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getLucideIconNameFromListIcon,
  isLucideListIcon,
} from "@karakeep/shared/listIcon";

/** Curated Lucide icons available when creating or editing a list (order = grid order). */
export const LIST_LUCIDE_ICONS_FOR_PICKER: { name: string; Icon: LucideIcon }[] =
  [
    { name: "Star", Icon: Star },
    { name: "Heart", Icon: Heart },
    { name: "Bookmark", Icon: Bookmark },
    { name: "BookOpen", Icon: BookOpen },
    { name: "Library", Icon: Library },
    { name: "Folder", Icon: Folder },
    { name: "FolderOpen", Icon: FolderOpen },
    { name: "ClipboardList", Icon: ClipboardList },
    { name: "List", Icon: List },
    { name: "Inbox", Icon: Inbox },
    { name: "Archive", Icon: Archive },
    { name: "Tag", Icon: Tag },
    { name: "Flag", Icon: Flag },
    { name: "Home", Icon: Home },
    { name: "Briefcase", Icon: Briefcase },
    { name: "GraduationCap", Icon: GraduationCap },
    { name: "Lightbulb", Icon: Lightbulb },
    { name: "Zap", Icon: Zap },
    { name: "Sparkles", Icon: Sparkles },
    { name: "Rocket", Icon: Rocket },
    { name: "Globe", Icon: Globe },
    { name: "Code", Icon: Code },
    { name: "Music", Icon: Music },
    { name: "Film", Icon: Film },
    { name: "Image", Icon: Image },
    { name: "Newspaper", Icon: Newspaper },
    { name: "Rss", Icon: Rss },
    { name: "ShoppingCart", Icon: ShoppingCart },
    { name: "Plane", Icon: Plane },
    { name: "Car", Icon: Car },
    { name: "Coffee", Icon: Coffee },
    { name: "Gamepad2", Icon: Gamepad2 },
    { name: "Trophy", Icon: Trophy },
    { name: "Gift", Icon: Gift },
    { name: "Flame", Icon: Flame },
    { name: "Leaf", Icon: Leaf },
    { name: "TreePine", Icon: TreePine },
    { name: "Sun", Icon: Sun },
    { name: "Moon", Icon: Moon },
    { name: "Cloud", Icon: Cloud },
    { name: "Umbrella", Icon: Umbrella },
    { name: "Anchor", Icon: Anchor },
    { name: "Palette", Icon: Palette },
    { name: "Camera", Icon: Camera },
    { name: "Video", Icon: Video },
    { name: "Mic", Icon: Mic },
    { name: "Smartphone", Icon: Smartphone },
    { name: "Laptop", Icon: Laptop },
    { name: "Search", Icon: Search },
    { name: "Users", Icon: Users },
    { name: "User", Icon: User },
    { name: "Pin", Icon: Pin },
    { name: "MapPin", Icon: MapPin },
    { name: "Compass", Icon: Compass },
    { name: "Layers", Icon: Layers },
    { name: "Package", Icon: Package },
    { name: "Box", Icon: Box },
    { name: "Database", Icon: Database },
    { name: "Server", Icon: Server },
    { name: "Wrench", Icon: Wrench },
    { name: "Bell", Icon: Bell },
    { name: "Mail", Icon: Mail },
    { name: "MessageCircle", Icon: MessageCircle },
    { name: "Radio", Icon: Radio },
    { name: "Bot", Icon: Bot },
    { name: "Brain", Icon: Brain },
  ];

const LUCIDE_LIST_ICONS_BY_NAME: Record<string, LucideIcon> =
  Object.fromEntries(
    LIST_LUCIDE_ICONS_FOR_PICKER.map(({ name, Icon }) => [name, Icon]),
  );

export function ListIcon({
  icon,
  className,
  emojiClassName,
}: {
  icon: string;
  className?: string;
  /** Applied to emoji icons only (Lucide uses `className`). */
  emojiClassName?: string;
}) {
  if (isLucideListIcon(icon)) {
    const name = getLucideIconNameFromListIcon(icon);
    const Lucide = name ? LUCIDE_LIST_ICONS_BY_NAME[name] : undefined;
    const IconComponent = Lucide ?? Folder;
    return (
      <IconComponent
        className={cn("size-4 shrink-0 stroke-[1.5]", className)}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn("inline-flex shrink-0 text-lg leading-none", emojiClassName)}
      aria-hidden
    >
      {icon}
    </span>
  );
}
