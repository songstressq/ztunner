export interface EnemyStats {
  def: number;
  defBase: number;
  fireResistance: number;
  iceResistance: number;
  electricResistance: number;
  physicalResistance: number;
  etherResistance: number;
  windResistance?: number;
  critResistance: number;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  type: "boss" | "elite" | "normal" | "dummy";
  enemyType:
    | "Ether Mutant"
    | "Thugs"
    | "Corrupted"
    | "Rebel Soldiers"
    | "Special";
  description: string;
  stats: EnemyStats;
  notes?: string | null;
}
