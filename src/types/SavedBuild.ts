import type { DriveDisc } from "@/types/DriveDisc";

export type SavedBuild = {
  id: string;
  name: string;
  agentId: string;
  engineId: string;
  coreLevel: number;
  discs: Record<number, DriveDisc>;
  updatedAt: number;
  activeMindscapes?: string[];
  skinId?: string;
};
