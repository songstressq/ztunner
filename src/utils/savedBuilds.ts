import type { SavedBuild } from "@/types/SavedBuild";

const STORAGE_KEY = "savedBuilds";

export function loadAllBuilds(): SavedBuild[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function loadBuild(id: string): SavedBuild | null {
  return loadAllBuilds().find((b) => b.id === id) ?? null;
}

export function createBuild(build: SavedBuild) {
  const builds = loadAllBuilds();
  builds.push({
    ...build,
    activeMindscapes: build.activeMindscapes || [],
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export function updateBuild(
  id: string,
  partial: Pick<
    SavedBuild,
    "engineId" | "coreLevel" | "discs" | "activeMindscapes"
  >,
) {
  const builds = loadAllBuilds();
  const index = builds.findIndex((b) => b.id === id);
  if (index === -1) return;

  builds[index] = {
    ...builds[index],
    ...structuredClone(partial),
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export function duplicateBuild(id: string): SavedBuild | null {
  const builds = loadAllBuilds();
  const original = builds.find((b) => b.id === id);

  if (!original) return null;

  const duplicated: SavedBuild = {
    ...structuredClone(original),
    id: crypto.randomUUID(),
    name: `${original.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  builds.push(duplicated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));

  return duplicated;
}

export function deleteBuild(id: string) {
  const builds = loadAllBuilds().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export function renameBuild(id: string, newName: string) {
  const builds = loadAllBuilds();
  const index = builds.findIndex((b) => b.id === id);

  if (index === -1) return;

  builds[index] = {
    ...builds[index],
    name: newName,
    updatedAt: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}
