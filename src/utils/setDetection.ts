import type { DriveDisc } from "@/types/DriveDisc";

export function getActiveSets(discs: Record<number, DriveDisc>) {
  const counts: Record<string, number> = {};

  const discList = Object.values(discs);

  for (const disc of discList) {
    if (!disc.setId) continue;
    counts[disc.setId] = (counts[disc.setId] ?? 0) + 1;
  }

  const active: {
    setId: string;
    pieces: number;
    effect2: boolean;
    effect4: boolean;
  }[] = [];

  for (const setId in counts) {
    const pieces = counts[setId];
    active.push({
      setId,
      pieces,
      effect2: pieces >= 2,
      effect4: pieces >= 4,
    });
  }

  return active;
}
