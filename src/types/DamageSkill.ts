export type DamageType =
  | "fire"
  | "ice"
  | "electric"
  | "physical"
  | "ether"
  | "wind"
  | "aftershock";
export type SkillType =
  | "basic"
  | "ex"
  | "ultimate"
  | "chain"
  | "core"
  | "special";

export interface SkillLevel {
  level: number;
  multipliers: number[];
}

export interface DamageSkill {
  id: string;
  name: string;
  description?: string;
  skillType:
    | "basic"
    | "dash"
    | "counter"
    | "ex"
    | "ultimate"
    | "chain"
    | "quickAssist"
    | "perfectAssist"
    | "followup"
    | "special"
    | "mindscape";
  damageType:
    | "fire"
    | "ice"
    | "electric"
    | "physical"
    | "ether"
    | "wind"
    | "lumiflux"
    | "aftershock";
  statBase: "atk" | "hp" | "def" | "anomalyMastery";
  hits: Hit[];
  levels: SkillLevel[];
}
