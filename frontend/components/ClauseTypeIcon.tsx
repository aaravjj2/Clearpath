/**
 * Maps clause types to representative Lucide icons.
 */
import {
  Ban,
  Briefcase,
  DollarSign,
  FileKey,
  Gavel,
  RefreshCw,
  Scale,
  Shield,
  UserX,
} from "lucide-react";
import { ClauseType } from "@/types";

const ICONS: Record<ClauseType, React.ComponentType<{ className?: string }>> = {
  payment: DollarSign,
  termination: Ban,
  liability: Shield,
  privacy: FileKey,
  non_compete: UserX,
  intellectual_property: Briefcase,
  dispute_resolution: Gavel,
  renewal: RefreshCw,
  general: Scale,
};

interface ClauseTypeIconProps {
  type: ClauseType;
  className?: string;
}

export default function ClauseTypeIcon({ type, className = "w-3.5 h-3.5" }: ClauseTypeIconProps) {
  const Icon = ICONS[type] ?? Scale;
  return <Icon className={className} aria-hidden="true" />;
}
