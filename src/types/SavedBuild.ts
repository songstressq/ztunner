import type { DriveDisc } from "@/types/DriveDisc";

export interface CustomBaseStats {
  hp?: number;
  atk?: number;
  def?: number;
  impact?: number;
  critRate?: number;
  critDmg?: number;
  anomalyProficiency?: number;
  anomalyMastery?: number;
  penRatio?: number;
  pen?: number;
  energyRegen?: number;
  sheerForce?: number;
  lacerationDmg?: number;
  attributeDmgBonus?: Partial<{
    fire: number;
    ice: number;
    electric: number;
    physical: number;
    ether: number;
    wind: number;
  }>;
  ignoreWEngineStats?: boolean;
  ignoreDiscSetStats?: boolean;
}

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
  customBaseStats?: CustomBaseStats;
};
