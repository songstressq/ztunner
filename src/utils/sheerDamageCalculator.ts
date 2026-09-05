export function calculateBaseSheerForce(stats: UnifiedStats): number {
  return stats.sheerForce || 0;
}

export function calculateSheerDamageFromForce(
  sheerForce: number,
  multiplier: number,
  bonuses: {
    dmgBonus: number;
    flatBonus: number;
    critDmg: number;
    critRate: number;
  },
): { normal: number; critical: number; average: number } {
  const baseDamage = (multiplier / 100) * sheerForce;
  const damageWithBonus = baseDamage * (1 + bonuses.dmgBonus);
  const finalDamage = damageWithBonus + bonuses.flatBonus;
  const criticalDamage = finalDamage * (1 + bonuses.critDmg);
  const averageDamage =
    finalDamage * (1 - bonuses.critRate) + criticalDamage * bonuses.critRate;

  return {
    normal: Math.round(finalDamage),
    critical: Math.round(criticalDamage),
    average: Math.round(averageDamage),
  };
}
