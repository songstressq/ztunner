import { useState, useEffect } from "react";
import type { SavedBuild } from "@/types/SavedBuild";

interface UseMindscapesProps {
  savedBuilds: SavedBuild[];
  activeBuildId: string | null;
}

export const useMindscapes = ({
  savedBuilds,
  activeBuildId,
}: UseMindscapesProps) => {
  const [activeMindscapes, setActiveMindscapes] = useState<string[]>([]);

  useEffect(() => {
    if (activeBuildId) {
      const currentBuild = savedBuilds.find((b) => b.id === activeBuildId);
      setActiveMindscapes(currentBuild?.activeMindscapes || []);
    } else {
      setActiveMindscapes([]);
    }
  }, [activeBuildId, savedBuilds]);

  const toggleMindscape = (effectId: string) => {
    const isCurrentlyActive = activeMindscapes.includes(effectId);
    const updated = isCurrentlyActive
      ? activeMindscapes.filter((id) => id !== effectId)
      : [...activeMindscapes, effectId];

    setActiveMindscapes(updated);
    return updated;
  };

  return {
    activeMindscapes,
    toggleMindscape,
  };
};
