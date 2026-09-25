import {
  Drama,
  HelpCircle,
  Image as ImageIcon,
  Megaphone,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const byCode: Record<string, LucideIcon> = {
  MISSION: Target,
  STAGE: Drama,
  FOOD: UtensilsCrossed,
  EXHIBITION: ImageIcon,
  ANNOUNCEMENT: Megaphone,
  ETC: HelpCircle,
};

const kindToCode: Record<string, string> = {
  mission: "MISSION",
  performance: "STAGE",
  food: "FOOD",
  exhibition: "EXHIBITION",
  announcement: "ANNOUNCEMENT",
  other: "ETC",
};

export function getCategoryIcon(code?: string | null): LucideIcon {
  return (code && byCode[code.toUpperCase()]) || HelpCircle;
}

export function getKindIcon(kind?: string | null): LucideIcon {
  return getCategoryIcon(kind ? kindToCode[kind] : undefined);
}
