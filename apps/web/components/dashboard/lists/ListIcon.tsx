"use client";

import { cn } from "@/lib/utils";
import type { BookmarkListLucideIconName } from "@karakeep/shared/listIcons";
import {
  isLucideListIcon,
  lucideListIconName,
} from "@karakeep/shared/listIcons";
import {
  Activity,
  AlarmClock,
  Archive,
  Award,
  Bell,
  Bike,
  BookCopy,
  BookMarked,
  Bookmark,
  BookOpen,
  Box,
  Brain,
  Briefcase,
  Bug,
  Bus,
  Camera,
  Car,
  Cat,
  Cloud,
  Code,
  Coffee,
  Compass,
  Cpu,
  Crown,
  Dog,
  Egg,
  Eye,
  FileText,
  Film,
  Flag,
  Flame,
  Folder,
  FolderOpen,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Inbox,
  Key,
  Laptop,
  Leaf,
  Layers,
  LayoutGrid,
  Library,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Music,
  Newspaper,
  Package,
  Palette,
  PenLine,
  Phone,
  Pin,
  Plane,
  Pizza,
  Rocket,
  Rss,
  Scale,
  Settings,
  Shield,
  Ship,
  ShoppingBag,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tag,
  Target,
  Train,
  TreePine,
  Trophy,
  Truck,
  Umbrella,
  Users,
  Wallet,
  Waves,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LUCIDE_LIST_ICONS: Record<
  BookmarkListLucideIconName,
  LucideIcon
> = {
  Activity,
  AlarmClock,
  Archive,
  Award,
  Bell,
  Bike,
  BookCopy,
  BookMarked,
  Bookmark,
  BookOpen,
  Box,
  Brain,
  Briefcase,
  Bug,
  Bus,
  Camera,
  Car,
  Cat,
  Cloud,
  Code,
  Coffee,
  Compass,
  Cpu,
  Crown,
  Dog,
  Egg,
  Eye,
  FileText,
  Film,
  Flag,
  Flame,
  Folder,
  FolderOpen,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Inbox,
  Key,
  Laptop,
  Leaf,
  Layers,
  LayoutGrid,
  Library,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Music,
  Newspaper,
  Package,
  Palette,
  PenLine,
  Phone,
  Pin,
  Plane,
  Pizza,
  Rocket,
  Rss,
  Scale,
  Settings,
  Shield,
  Ship,
  ShoppingBag,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tag,
  Target,
  Train,
  TreePine,
  Trophy,
  Truck,
  Umbrella,
  Users,
  Wallet,
  Waves,
  Wine,
  Wrench,
  Zap,
};

export interface ListIconProps {
  icon: string;
  className?: string;
  /** Lucide stroke width; emojis ignore this. */
  strokeWidth?: number;
}

/**
 * Renders a list icon: either a Lucide symbol (`lucide:Name`) or legacy emoji text.
 */
export function ListIcon({
  icon,
  className,
  strokeWidth = 2,
}: ListIconProps) {
  if (isLucideListIcon(icon)) {
    const name = lucideListIconName(icon) as BookmarkListLucideIconName | null;
    if (!name) {
      return null;
    }
    const Icon = LUCIDE_LIST_ICONS[name];
    if (!Icon) {
      return (
        <span className={cn("text-lg leading-none", className)} title={icon}>
          ?
        </span>
      );
    }
    return (
      <Icon
        aria-hidden
        className={cn("shrink-0", className)}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center text-xl leading-none",
        className,
      )}
      aria-hidden
    >
      {icon}
    </span>
  );
}
