import "./WEngines.css";
import { useState, useEffect } from "react";
import { agents } from "@/data/agents";
import { wEngines } from "@/data/wengines";
import { getWEngineStats, calculateUnifiedStats } from "@/utils/statScaling";
import { MAIN_STATS_BY_SLOT } from "@/constants/discMainBySlot";
import { SUB_RANGES_S } from "@/constants/discRanges";
import { generateMainValue, subValueFromRolls } from "@/utils/discUtils";
import type { DriveDisc, StatKey } from "@/types/DriveDisc";
import discSets from "@/data/discSets.json";
import { getActiveSets } from "@/utils/setDetection";
import ModalSelector from "@/components/ModalSelector";
//import "../styles/modal.css";
//import "../styles/marquee.css";
//import DiagonalMarquee from "@/components/DiagonalMarquee";
import NeonSelect from "@/components/NeonSelect";
import type { SavedBuild } from "@/types/SavedBuild";
import {
  loadAllBuilds,
  createBuild,
  updateBuild,
  duplicateBuild,
  deleteBuild,
  renameBuild,
} from "@/utils/savedBuilds";
import MindscapeSelector from "@/components/MindscapeSelector";
import { useSidebar } from "@/components/SidebarContext";
import CustomPrompt from "@/components/CustomPrompt";

import { useSession } from "@/context/SessionContext";

export default function BuildCreator() {
  const ATTRIBUTE_COLORS: Record<string, string> = {
    physical: "#FFDD35FF",
    fire: "#FF4D25FF",
    ice: "#94F3F3FF",
    electric: "#36A9FCFF",
    ether: "#FF4684FF",
    wind: "#A6C5FD",
  };

  const { wEnginesSession, setWEnginesSession } = useSession();
  const selectedId = wEnginesSession.selectedAgentId || agents[0].id;
  const coreLevel = wEnginesSession.coreLevel;
  const selectedEngineId = wEnginesSession.selectedEngineId;
  const activeBuildId = wEnginesSession.activeBuildId;
  const selectedAgent = agents.find((a) => a.id === selectedId)!;
  const isRupture = selectedAgent.specialty === "Rupture";
  const selectedEngine =
    wEngines.find((w) => w.id === selectedEngineId) ?? null;
  const engineStats = selectedEngine
    ? getWEngineStats(selectedEngine)
    : { base: 0, adv: 0 };

  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null);
  const [skinReady, setSkinReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [localMindscapes, setLocalMindscapes] = useState<string[]>([]);

  const emptySubstats = () =>
    Array(4)
      .fill(null)
      .map(() => ({ type: null, rolls: 0, value: 0 }));

  const [discs, setDiscs] = useState<Record<number, DriveDisc>>({
    1: {
      slot: 1,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: emptySubstats(),
    },
    2: {
      slot: 2,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: emptySubstats(),
    },
    3: {
      slot: 3,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: emptySubstats(),
    },
    4: {
      slot: 4,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: emptySubstats(),
    },
    5: {
      slot: 5,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: emptySubstats(),
    },
    6: {
      slot: 6,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: emptySubstats(),
    },
  });

  useEffect(() => {
    if (!wEnginesSession.selectedAgentId) {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      setWEnginesSession((prev) => ({
        ...prev,
        selectedAgentId: randomAgent.id,
      }));
    }
  }, []);

  useEffect(() => {
    const allBuilds = loadAllBuilds();
    setSavedBuilds(allBuilds);
    if (activeBuildId) {
      const activeBuild = allBuilds.find((b) => b.id === activeBuildId);
      if (activeBuild) {
        setDiscs(structuredClone(activeBuild.discs));
        setLocalMindscapes(activeBuild.activeMindscapes || []);
        setSelectedSkinId(activeBuild.skinId || "default");
      } else {
        setSelectedSkinId("default");
      }
    } else {
      setSelectedSkinId("default");
    }
    setSkinReady(true);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      const freshBuilds = loadAllBuilds();
      setSavedBuilds(freshBuilds);
      if (activeBuildId) {
        const freshBuild = freshBuilds.find((b) => b.id === activeBuildId);
        if (freshBuild) {
          setLocalMindscapes(freshBuild.activeMindscapes || []);
        }
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [activeBuildId]);

  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [engineModalOpen, setEngineModalOpen] = useState(false);
  const [activeSetSlot, setActiveSetSlot] = useState<number | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentImportSlot, setCurrentImportSlot] = useState<number | null>(
    null,
  );
  const [savedDisks, setSavedDisks] = useState<DriveDisc[]>([]);
  const [mindscapeModalOpen, setMindscapeModalOpen] = useState(false);
  const [tempMindscapes, setTempMindscapes] = useState<string[]>([]);

  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    type: "prompt" | "confirm";
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (value?: string) => void;
  }>({
    isOpen: false,
    type: "prompt",
    title: "",
    onConfirm: () => {},
  });

  // Abrir prompt personalizado
  const openPrompt = (
    type: "prompt" | "confirm",
    title: string,
    message?: string,
    defaultValue?: string,
    placeholder?: string,
    onConfirm: (value?: string) => void,
  ) => {
    setPromptState({
      isOpen: true,
      type,
      title,
      message,
      defaultValue,
      placeholder,
      onConfirm,
    });
  };

  // Cerrar prompt (cancelar)
  const closePrompt = () => {
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const saved = localStorage.getItem("diskInventory");
    if (saved) {
      try {
        setSavedDisks(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading saved disks:", error);
      }
    }
  }, []);

  const openImportModal = (slot: number) => {
    setCurrentImportSlot(slot);
    setImportModalOpen(true);
  };

  const importDisk = (disk: DriveDisc) => {
    if (currentImportSlot === null) return;

    const cleanDisk: DriveDisc = {
      slot: currentImportSlot,
      rarity: "S",
      setId: disk.setId || "",
      main: {
        type: disk.main.type,
        value: disk.main.value,
      },
      substats: disk.substats.map((sub) => ({
        type: sub.type || null,
        rolls: sub.rolls || 0,
        value: sub.value || 0,
      })),
      name: disk.name?.trim() || `Disk Slot ${currentImportSlot}`,
      id: disk.id || crypto.randomUUID(),
      createdAt: disk.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    updateDisc(currentImportSlot, () => cleanDisk);
    setImportModalOpen(false);
    setCurrentImportSlot(null);
    markDirty();
    alert(`Disk imported to Slot ${currentImportSlot}!`);
  };

  function updateDisc(slot: number, updater: (old: DriveDisc) => DriveDisc) {
    setDiscs((prev) => ({ ...prev, [slot]: updater(prev[slot]) }));
    markDirty();
  }

  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (isSidebarOpen && importModalOpen) {
      setImportModalOpen(false);
      setCurrentImportSlot(null);
    }
  }, [isSidebarOpen, importModalOpen]);

  function isRecommended(statName: string) {
    return selectedAgent.recommendedStats?.stats?.includes(statName);
  }

  function markDirty() {
    if (activeBuildId) setIsDirty(true);
  }

  const unifiedStats = calculateUnifiedStats(
    selectedAgent,
    selectedEngine,
    coreLevel,
    discs,
  );

  const sheerForce = isRupture ? unifiedStats.sheerForce : null;

  const ATTRIBUTE_LABELS: Record<string, string> = {
    fire: "Fire DMG Bonus",
    ice: "Ice DMG Bonus",
    ether: "Ether DMG Bonus",
    physical: "Physical DMG Bonus",
    electric: "Electric DMG Bonus",
    wind: "Wind DMG Bonus",
  };

  const attributeColor =
    ATTRIBUTE_COLORS[selectedAgent.attribute.toLowerCase()] || null;

  function highlightAttributeDmg(element?: string) {
    const key = element || selectedAgent.attribute.toLowerCase();
    if (key === "lumiflux") {
      return { color: selectedAgent.themeColor || "#FEDBF3" };
    }
    const color = ATTRIBUTE_COLORS[key];
    return color ? { color: color } : {};
  }

  const ENGINE_STAT_LABELS: Record<string, string> = {
    "ATK%": "ATK%",
    "HP%": "HP%",
    "DEF%": "DEF%",
    "Impact%": "Impact",
    "Energy Regen%": "Energy Regen",
    "CRIT Rate%": "CRIT Rate",
    "CRIT DMG%": "CRIT DMG",
    "PEN Ratio%": "PEN Ratio",
  };

  const initialStats = calculateUnifiedStats(
    selectedAgent,
    null,
    0,
    {},
    {},
    {},
    undefined,
    {},
    0,
    undefined,
    [],
  );

  const baseStats = {
    hp: initialStats.hp,
    atk: initialStats.atk,
    def: initialStats.def,
    impact: initialStats.impact,
    critRate: initialStats.critRate,
    critDmg: initialStats.critDmg,
    anomalyProficiency: initialStats.anomalyProficiency,
    anomalyMastery: initialStats.anomalyMastery,
    penRatio: initialStats.penRatio,
    pen: initialStats.pen,
    energyRegen: initialStats.energyRegen,
    attributeDmgBonus:
      initialStats.attributeDmgBonus[selectedAgent.attribute.toLowerCase()],
  };

  const addedStats = {
    hp: unifiedStats.hp - baseStats.hp,
    atk: unifiedStats.atk - baseStats.atk,
    def: unifiedStats.def - baseStats.def,
    impact: unifiedStats.impact - baseStats.impact,
    critRate: unifiedStats.critRate - baseStats.critRate,
    critDmg: unifiedStats.critDmg - baseStats.critDmg,
    anomalyProficiency:
      unifiedStats.anomalyProficiency - baseStats.anomalyProficiency,
    anomalyMastery: unifiedStats.anomalyMastery - baseStats.anomalyMastery,
    penRatio: unifiedStats.penRatio - baseStats.penRatio,
    pen: unifiedStats.pen - baseStats.pen,
    energyRegen: unifiedStats.energyRegen - baseStats.energyRegen,
    attributeDmgBonus:
      unifiedStats.attributeDmgBonus[selectedAgent.attribute.toLowerCase()] -
      baseStats.attributeDmgBonus,
  };

  const accumulatedCoreStats = (() => {
    const sum: Record<string, number> = {};
    selectedAgent.coreEnhancement.forEach((lvl) => {
      if (lvl.level <= coreLevel) {
        Object.entries(lvl.stats).forEach(([key, value]) => {
          sum[key] = (sum[key] ?? 0) + value;
        });
      }
    });
    return sum;
  })();

  const CORE_STAT_LABELS: Record<string, string> = {
    atkFlat: "ATK",
    atkPercent: "ATK%",
    penRatio: "PEN Ratio",
    hpFlat: "HP",
    hpPercent: "HP%",
    defFlat: "DEF",
    defPercent: "DEF%",
    impact: "Impact",
    impactPercent: "Impact%",
    critRate: "CRIT Rate",
    critDmg: "CRIT DMG",
    energyRegenFlat: "Energy Regen",
    energyRegenPercent: "Energy Regen%",
    anomalyProficiency: "Anomaly Proficiency",
    anomalyMastery: "Anomaly Mastery",
  };

  const formatStatName = (key: string) => {
    if (CORE_STAT_LABELS[key]) return CORE_STAT_LABELS[key];
    return key
      .replace(/Flat$/, "")
      .replace(/Percent$/, "")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^./, (c) => c.toUpperCase());
  };

  const recommended = selectedAgent.recommendedStats?.stats || [];
  const theme = selectedAgent.themeColor || "#ffffff";

  const emptyObjectsStyle = {
    backgroundImage: `linear-gradient( to right bottom, ${theme}11, ${theme}22, ${theme}55, ${theme}22, ${theme}11 )`,
  };

  function highlightIfRecommended(statName: string) {
    if (recommended.includes(statName)) {
      return {
        color: selectedAgent.themeColor || "#f7ba57",
        fontWeight: "bold",
      };
    }
    return {};
  }

  function handleSaveNewBuild() {
    const defaultName = `${selectedAgent.displayName} Build`;
    openPrompt(
      "prompt",
      "Save Build",
      "Enter a name for your new build:",
      defaultName,
      "Build name...",
      (name) => {
        if (!name || !name.trim()) return;
        const build: SavedBuild = {
          id: crypto.randomUUID(),
          name: name.trim(),
          agentId: selectedId,
          engineId: selectedEngineId,
          coreLevel,
          discs: structuredClone(discs),
          activeMindscapes: localMindscapes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          skinId: selectedSkinId,
        };
        createBuild(build);
        setWEnginesSession((prev) => ({ ...prev, activeBuildId: build.id }));
        setIsDirty(false);
        setSavedBuilds(loadAllBuilds());
      },
    );
  }

  function handleUpdateBuild() {
    if (!activeBuildId) return;
    updateBuild(activeBuildId, {
      engineId: selectedEngineId,
      coreLevel,
      discs: structuredClone(discs),
      activeMindscapes: localMindscapes,
      skinId: selectedSkinId,
    });
    setIsDirty(false);
    setSavedBuilds(loadAllBuilds());
  }

  function handleDuplicateBuild() {
    if (!activeBuildId) return;
    const duplicated = duplicateBuild(activeBuildId);
    if (!duplicated) return;
    setWEnginesSession((prev) => ({ ...prev, activeBuildId: duplicated.id }));
    setIsDirty(false);
    setSavedBuilds(loadAllBuilds());
  }

  function handleRenameBuild() {
    if (!activeBuildId) return;
    const current = savedBuilds.find((b) => b.id === activeBuildId);
    if (!current) return;

    openPrompt(
      "prompt",
      "Rename Build",
      "Enter the new name for this build:",
      current.name,
      "Build name...",
      (newName) => {
        if (newName && newName.trim()) {
          const trimmed = newName.trim();
          if (trimmed === current.name) return;
          renameBuild(activeBuildId, trimmed);
          setSavedBuilds(loadAllBuilds());
        }
      },
    );
  }

  function handleDeleteBuild(buildId: string, e: React.MouseEvent) {
    e.stopPropagation();
    openPrompt(
      "confirm",
      "Delete Build",
      "Are you sure you want to delete this build? This action cannot be undone.",
      undefined,
      undefined,
      () => {
        const saved = localStorage.getItem("savedBuilds");
        if (saved) {
          const builds: SavedBuild[] = JSON.parse(saved);
          const filtered = builds.filter((b) => b.id !== buildId);
          localStorage.setItem("savedBuilds", JSON.stringify(filtered));
        }
        setSavedBuilds((prev) => prev.filter((b) => b.id !== buildId));
        if (activeBuildId === buildId) {
          setWEnginesSession((prev) => ({ ...prev, activeBuildId: null }));
        }
      },
    );
  }

  function handleLoadBuild(build: SavedBuild) {
    setWEnginesSession((prev) => ({
      ...prev,
      selectedAgentId: build.agentId,
      selectedEngineId: build.engineId,
      coreLevel: build.coreLevel,
      activeBuildId: build.id,
    }));
    setDiscs(structuredClone(build.discs));
    setLocalMindscapes(build.activeMindscapes || []);
    setIsDirty(false);
    setSelectedSkinId(build.skinId || "default");
    setSkinReady(true);
  }

  const currentSkin =
    selectedAgent.skins?.find((s) => s.id === selectedSkinId) ??
    selectedAgent.skins?.[0];

  const getEffectiveElementalBonus = (stats: UnifiedStats) => {
    const entries = Object.entries(stats.attributeDmgBonus)
      .filter(([key]) => key !== "lumiflux")
      .map(([key, value]) => ({ key, value }));

    if (entries.every((e) => e.value === 0)) {
      return { key: "lumiflux", value: 0 };
    }

    const best = entries.reduce((a, b) => (a.value >= b.value ? a : b));
    return best;
  };

  const getElementLabel = (key: string) => {
    const labels: Record<string, string> = {
      fire: "Fire DMG Bonus",
      ice: "Ice DMG Bonus",
      electric: "Electric DMG Bonus",
      physical: "Physical DMG Bonus",
      ether: "Ether DMG Bonus",
      wind: "Wind DMG Bonus",
      lumiflux: "Lumiflux DMG Bonus",
    };
    return labels[key] || key;
  };

  return (
    <div
      className="page-wrapper"
      style={{ ...emptyObjectsStyle, "--theme": theme }}
    >
      <div className="build-creator-container">
        {/* MARQUEE 
        <DiagonalMarquee
          text={selectedAgent.displayName}
          selectedAgent={selectedAgent}
        />*/}
        {/* --- AGENT CARD --- */}
        <div className="block agent-card-block">
          <div className="agent-card-wrapper" style={emptyObjectsStyle}>
            <div className="agent-card_identity">
              {selectedAgent.fullName && (
                <div className="agent-card_identity_full-name">
                  {selectedAgent.fullName}
                </div>
              )}
              <div className="agent-card_identity_display-name">
                <img
                  src={`/resources/images/icons/rarities/${selectedAgent.rarity}.png`}
                  alt={selectedAgent.rarity}
                />
                <span>{selectedAgent.displayName}</span>
              </div>
            </div>
            <div className="agent-card_traits">
              <div>
                <img
                  src={`/resources/images/icons/factions/${selectedAgent.faction}.png`}
                />
                <span>{selectedAgent.faction}</span>
              </div>
              <div>
                <img
                  src={`/resources/images/icons/specialties/${selectedAgent.specialty}.png`}
                />
                <span>{selectedAgent.specialty}</span>
              </div>
              <div>
                <img
                  src={`/resources/images/icons/attributes/${selectedAgent.attributeIcon}.png`}
                />
                <span>{selectedAgent.attributeIcon}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- AGENT SELECTOR --- */}
        <div className="block agent-selection-block">
          <div className="agent-selection-wrapper" style={emptyObjectsStyle}>
            <div className="agent-selection_selector">
              <label className="flex-center">Agent:</label>
              <button type="button" onClick={() => setAgentModalOpen(true)}>
                {selectedAgent ? selectedAgent.name : "Select agent..."}
              </button>
            </div>
            <div className="agent-selection_controls">
              <button onClick={handleSaveNewBuild} disabled={!!activeBuildId}>
                Save Build
              </button>
              <button
                onClick={handleUpdateBuild}
                disabled={!activeBuildId || !isDirty}
              >
                Update Build
              </button>
              <button onClick={handleDuplicateBuild} disabled={!activeBuildId}>
                Copy Build
              </button>
              <button onClick={handleRenameBuild} disabled={!activeBuildId}>
                Rename Build
              </button>
            </div>
            <div className="agent-selection_loader">
              <NeonSelect
                value={
                  activeBuildId
                    ? savedBuilds.find((b) => b.id === activeBuildId)?.name
                    : "Load build..."
                }
                options={savedBuilds.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
                theme={theme}
                variant="default"
                onChange={(buildId) => {
                  const build = savedBuilds.find((b) => b.id === buildId);
                  if (build) handleLoadBuild(build);
                }}
              />
              <button
                onClick={(e) => handleDeleteBuild(activeBuildId, e)}
                disabled={!activeBuildId}
                title="Delete current build"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* CUSTOM PROMPT MODAL */}
          <CustomPrompt
            isOpen={promptState.isOpen}
            type={promptState.type}
            title={promptState.title}
            message={promptState.message}
            defaultValue={promptState.defaultValue}
            placeholder={promptState.placeholder}
            confirmLabel={promptState.type === "confirm" ? "Delete" : "Save"}
            cancelLabel={promptState.type === "confirm" ? "Cancel" : "Cancel"}
            onConfirm={promptState.onConfirm}
            onCancel={closePrompt}
            theme={theme}
          />

          {/* AGENT MODAL */}
          <ModalSelector
            open={agentModalOpen}
            title="Select Agent"
            className="agent-modal"
            theme={selectedAgent.themeColor}
            sections={[
              {
                title: "Attack Agents",
                items: agents
                  .filter((a) => a.specialty === "Attack")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    img: `/resources/images/agents/icons/${a.id} (2).png`,
                  })),
              },
              {
                title: "Anomaly Agents",
                items: agents
                  .filter((a) => a.specialty === "Anomaly")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    img: `/resources/images/agents/icons/${a.id} (2).png`,
                  })),
              },
              {
                title: "Defense Agents",
                items: agents
                  .filter((a) => a.specialty === "Defense")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    img: `/resources/images/agents/icons/${a.id} (2).png`,
                  })),
              },
              {
                title: "Stun Agents",
                items: agents
                  .filter((a) => a.specialty === "Stun")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    img: `/resources/images/agents/icons/${a.id} (2).png`,
                  })),
              },
              {
                title: "Support Agents",
                items: agents
                  .filter((a) => a.specialty === "Support")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    img: `/resources/images/agents/icons/${a.id} (2).png`,
                  })),
              },
              {
                title: "Rupture Agents",
                items: agents
                  .filter((a) => a.specialty === "Rupture")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    img: `/resources/images/agents/icons/${a.id} (2).png`,
                  })),
              },
            ]}
            onClose={() => setAgentModalOpen(false)}
            onSelect={(id) => {
              const newAgentId = id as string;
              setWEnginesSession((prev) => ({
                ...prev,
                selectedAgentId: newAgentId,
                coreLevel: 0,
                selectedEngineId: "",
                activeBuildId: null,
              }));
              setDiscs({
                1: {
                  slot: 1,
                  rarity: "S",
                  setId: "",
                  main: { type: null, value: 0 },
                  substats: emptySubstats(),
                },
                2: {
                  slot: 2,
                  rarity: "S",
                  setId: "",
                  main: { type: null, value: 0 },
                  substats: emptySubstats(),
                },
                3: {
                  slot: 3,
                  rarity: "S",
                  setId: "",
                  main: { type: null, value: 0 },
                  substats: emptySubstats(),
                },
                4: {
                  slot: 4,
                  rarity: "S",
                  setId: "",
                  main: { type: null, value: 0 },
                  substats: emptySubstats(),
                },
                5: {
                  slot: 5,
                  rarity: "S",
                  setId: "",
                  main: { type: null, value: 0 },
                  substats: emptySubstats(),
                },
                6: {
                  slot: 6,
                  rarity: "S",
                  setId: "",
                  main: { type: null, value: 0 },
                  substats: emptySubstats(),
                },
              });
              setSelectedSkinId("default");
              setSkinReady(true);
              setAgentModalOpen(false);
            }}
          />
        </div>

        {/* MINDSCAPES SELECTOR */}
        <div className="block agent-mindscapes-block">
          <div className="agent-mindscapes-wrapper" style={emptyObjectsStyle}>
            <div className="agent-mindscapes_title">
              <h2 className="transform-title">Mindscape Cinema</h2>
              <div className="divider" style={{ backgroundColor: theme }} />
            </div>
            <div className="agent-mindscapes_content flex-center">
              <MindscapeSelector
                agent={selectedAgent}
                theme={theme}
                activeBuildId={activeBuildId}
                savedBuilds={savedBuilds}
                selectedEngineId={selectedEngineId}
                coreLevel={coreLevel}
                discs={discs}
                localMindscapes={localMindscapes}
                onLocalMindscapesChange={setLocalMindscapes}
                onMarkDirty={markDirty}
              />
            </div>
          </div>
        </div>

        {/* AGENT BACKGROUND */}
        <div className="block agent-portrait-block">
          {skinReady && selectedSkinId && (
            <div
              className="agent-portrait-wrapper"
              style={{
                backgroundImage: `url(/resources/images/agents/fullbody/${
                  currentSkin?.img || selectedAgent.id + ".png"
                })`,
              }}
            >
              <div className="agent-portrait_effect"></div>
              <div className="skin-selector">
                {(selectedAgent.skins ?? [{ id: "default" }]).map((skin) => (
                  <span
                    key={skin.id}
                    className={`dot ${selectedSkinId === skin.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedSkinId(skin.id);
                      markDirty();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AGENT STATS */}
        <div className="block agent-stats-block">
          <div className="agent-stats-wrapper" style={emptyObjectsStyle}>
            <div className="agent-stats_title">
              <h2 className="transform-title">Stats</h2>
              <div className="divider" style={{ backgroundColor: theme }}></div>
            </div>
            <div className="agent-stats_left-columm">
              <p style={highlightIfRecommended("HP")}>
                HP: {Math.round(unifiedStats.hp)} <br />
                <span className="stat-sub">
                  ({Math.round(baseStats.hp)} + {Math.round(addedStats.hp)})
                </span>
              </p>
              <p style={highlightIfRecommended("ATK")}>
                ATK: {Math.round(unifiedStats.atk)} <br />
                <span className="stat-sub">
                  ({Math.round(baseStats.atk)} + {Math.round(addedStats.atk)})
                </span>
              </p>
              <p style={highlightIfRecommended("DEF")}>
                DEF: {Math.round(unifiedStats.def)} <br />
                <span className="stat-sub">
                  ({Math.round(baseStats.def)} + {Math.round(addedStats.def)})
                </span>
              </p>
              <p style={highlightIfRecommended("Impact")}>
                Impact: {Math.round(unifiedStats.impact)} <br />
                <span className="stat-sub">
                  ({Math.round(baseStats.impact)} +{" "}
                  {Math.round(addedStats.impact)})
                </span>
              </p>
              <p style={highlightIfRecommended("CRIT Rate")}>
                CRIT Rate: {(unifiedStats.critRate * 100).toFixed(1)}% <br />
                <span className="stat-sub">
                  ({(baseStats.critRate * 100).toFixed(1)}% +{" "}
                  {(addedStats.critRate * 100).toFixed(1)}%)
                </span>
              </p>
              <p style={highlightIfRecommended("CRIT DMG")}>
                CRIT DMG: {(unifiedStats.critDmg * 100).toFixed(1)}% <br />
                <span className="stat-sub">
                  ({(baseStats.critDmg * 100).toFixed(1)}% +{" "}
                  {(addedStats.critDmg * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
            <div className="agent-stats_right-column">
              <p style={highlightIfRecommended("Anomaly Proficiency")}>
                Anomaly Proficiency:{" "}
                {Math.round(unifiedStats.anomalyProficiency)} <br />
                <span className="stat-sub">
                  ({Math.round(baseStats.anomalyProficiency)} +{" "}
                  {Math.round(addedStats.anomalyProficiency)})
                </span>
              </p>
              <p style={highlightIfRecommended("Anomaly Mastery")}>
                Anomaly Mastery: {Math.floor(unifiedStats.anomalyMastery)}{" "}
                <br />
                <span className="stat-sub">
                  ({Math.round(baseStats.anomalyMastery)} +{" "}
                  {Math.round(addedStats.anomalyMastery)})
                </span>
              </p>
              <p
                className={isRupture ? "stat-disabled" : ""}
                style={highlightIfRecommended("PEN Ratio")}
              >
                PEN Ratio: {(unifiedStats.penRatio * 100).toFixed(1)}%
              </p>
              <p
                className={isRupture ? "stat-disabled" : ""}
                style={highlightIfRecommended("PEN")}
              >
                PEN: {Math.round(unifiedStats.pen)} <br />
              </p>
              {isRupture ? (
                <p style={highlightIfRecommended("Sheer Force")}>
                  Sheer Force: {sheerForce} <br />
                  <span className="stat-sub"></span>
                </p>
              ) : (
                <p style={highlightIfRecommended("Energy Regen")}>
                  Energy Regen: {unifiedStats.energyRegen.toFixed(2)} <br />
                  <span className="stat-sub">
                    ({baseStats.energyRegen.toFixed(2)} +{" "}
                    {addedStats.energyRegen.toFixed(2)})
                  </span>
                </p>
              )}
              {/* Para Remielle, mostrar el mayor bono elemental */}
              {selectedAgent.id === "remielle" ? (
                (() => {
                  const best = getEffectiveElementalBonus(unifiedStats);
                  return (
                    <p style={highlightAttributeDmg(best.key)}>
                      {getElementLabel(best.key)}:{" "}
                      {(best.value * 100).toFixed(1)}%
                    </p>
                  );
                })()
              ) : (
                <p style={highlightAttributeDmg()}>
                  {ATTRIBUTE_LABELS[selectedAgent.attribute.toLowerCase()] ??
                    "Attribute DMG Bonus"}
                  :{" "}
                  {(
                    unifiedStats.attributeDmgBonus[
                      selectedAgent.attribute.toLowerCase()
                    ] * 100
                  ).toFixed(1)}
                  %
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CORE PASSIVE */}
        <div className="block agent-passive-block">
          <div
            className="agent-passive-wrapper"
            style={{ ...emptyObjectsStyle, "--theme": theme }}
          >
            <div className="agent-passive_title">
              <h2 className="flex-center transform-title">Core Passive</h2>
              <div className="divider" style={{ backgroundColor: theme }}></div>
            </div>
            <div className="agent-passive_selector flex-center">
              <div className="agent-passive_selector_content">
                {["A", "B", "C", "D", "E", "F"].map((label, index) => {
                  const level = index + 1;
                  const isActive = coreLevel >= level;
                  const isCurrent = coreLevel === level;
                  return (
                    <div
                      key={label}
                      data-label={label}
                      className={
                        "flex-center agent-passive_selector_node " +
                        (isActive ? "active " : "inactive ") +
                        (isCurrent ? "current " : "")
                      }
                      onClick={() => {
                        setWEnginesSession((prev) => ({
                          ...prev,
                          coreLevel: level,
                        }));
                        markDirty();
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="agent-passive_subtitle">
              <h2 className="flex-center transform-title">Total Bonus</h2>
              <div className="divider" style={{ backgroundColor: theme }}></div>
            </div>
            <div className="agent-passive_summary flex-center">
              {Object.entries(accumulatedCoreStats)
                .filter(([_, v]) => v !== 0)
                .map(([key, value]) => {
                  const label = formatStatName(key);
                  const lowerKey = key.toLowerCase();
                  const isPercent =
                    lowerKey.includes("percent") ||
                    lowerKey.includes("ratio") ||
                    lowerKey.includes("rate") ||
                    lowerKey.includes("dmg");
                  const isEnergyRegen = lowerKey.includes("energyregen");
                  return (
                    <p key={key}>
                      {label}:{" "}
                      {isPercent
                        ? (value * 100).toFixed(1) + "%"
                        : isEnergyRegen
                          ? value.toFixed(2) + "/s"
                          : Math.round(value)}
                    </p>
                  );
                })}
            </div>
          </div>
        </div>

        {/* W-ENGINE */}
        <div className="block w-engine-selector-block">
          <div className="w-engine-selector-wrapper" style={emptyObjectsStyle}>
            <div>
              <h2 className="w-engine-selector_title transform-title">
                W-Engine
              </h2>
              <div className="divider" style={{ backgroundColor: theme }}></div>
            </div>
            <div className="w-engine-selector_content">
              <label>W-Engine:</label>
              <button
                style={{ "--theme": theme }}
                onClick={() => setEngineModalOpen(true)}
              >
                {selectedEngineId
                  ? wEngines.find((w) => w.id === selectedEngineId)?.name
                  : "None"}
              </button>
            </div>
            {selectedEngine ? (
              <>
                <div className="w-engine-selector_summmary">
                  <div className="w-engine-selector_preview flex-center">
                    <img
                      src={`/resources/images/wengines/${selectedEngine.id}.png`}
                      alt={selectedEngine.name}
                    />
                    <div className="shine-small"></div>
                  </div>
                  <div className="w-engine-selector_info">
                    <p className="w-engine-selector_info_name">
                      <strong>{selectedEngine.name}</strong>
                    </p>
                    <div
                      className="divider"
                      style={{ backgroundColor: theme }}
                    ></div>
                    <p className="w-engine-selector_info_text">
                      Specialty: {selectedEngine.specialty}
                    </p>
                    <p className="w-engine-selector_info_text">Bonus Stats:</p>
                    <p className="w-engine-selector_info_text">
                      - {selectedEngine.baseStatType}:{" "}
                      {selectedEngine.stats.base}
                    </p>
                    <p className="w-engine-selector_info_text">
                      -{" "}
                      {ENGINE_STAT_LABELS[selectedEngine.advancedStatType] ??
                        selectedEngine.advancedStatType}{" "}
                      :{" "}
                      {selectedEngine.advancedStatType.includes("%")
                        ? (selectedEngine.stats.advanced * 100).toFixed(1) + "%"
                        : selectedEngine.stats.advanced}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-wengine">
                <p className="active-sets_content_text transform-title">
                  NO W-ENGINE SELECTED.
                </p>
              </div>
            )}
          </div>

          {/* ENGINE MODAL */}
          <ModalSelector
            open={engineModalOpen}
            title="Select W-Engine"
            className="engine-modal"
            theme={selectedAgent.themeColor}
            sections={[
              {
                title: "Attack",
                items: wEngines
                  .filter((e) => e.specialty === "Attack")
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    img: `/resources/images/wengines/${w.id}.png`,
                  })),
              },
              {
                title: "Anomaly",
                items: wEngines
                  .filter((w) => w.specialty === "Anomaly")
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    img: `/resources/images/wengines/${w.id}.png`,
                  })),
              },
              {
                title: "Defense",
                items: wEngines
                  .filter((e) => e.specialty === "Defense")
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    img: `/resources/images/wengines/${w.id}.png`,
                  })),
              },
              {
                title: "Stun",
                items: wEngines
                  .filter((e) => e.specialty === "Stun")
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    img: `/resources/images/wengines/${w.id}.png`,
                  })),
              },
              {
                title: "Support",
                items: wEngines
                  .filter((e) => e.specialty === "Support")
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    img: `/resources/images/wengines/${w.id}.png`,
                  })),
              },
              {
                title: "Rupture",
                items: wEngines
                  .filter((e) => e.specialty === "Rupture")
                  .map((w) => ({
                    id: w.id,
                    name: w.name,
                    img: `/resources/images/wengines/${w.id}.png`,
                  })),
              },
            ]}
            onClose={() => setEngineModalOpen(false)}
            onSelect={(id) => {
              setWEnginesSession((prev) => ({
                ...prev,
                selectedEngineId: id as string,
              }));
              markDirty();
              setEngineModalOpen(false);
            }}
          />
        </div>

        {/* ACTIVE SETS */}
        <div className="block active-sets-block">
          <div className="active-sets-wrapper" style={emptyObjectsStyle}>
            <div className="active-sets_title">
              <h2 className="transform-title">Active Sets</h2>
              <div className="divider" style={{ backgroundColor: theme }}></div>
            </div>
            <div className="active-sets_content">
              {(() => {
                const active = getActiveSets(discs);
                if (active.length === 0)
                  return (
                    <p className="active-sets_content_text transform-title">
                      No active sets.
                    </p>
                  );
                return active.map((a) => {
                  const info = (discSets as any[]).find(
                    (x) => x.id === a.setId,
                  );
                  return (
                    <div className="active-sets_content_card" key={a.setId}>
                      <img
                        src={`/resources/images/sets/${a.setId}.png`}
                        alt={info?.name}
                      />
                      <div className="active-sets_content_card_info">
                        <div className="active-sets_content_card_info_title">
                          {info?.name ?? a.setId}
                          <span> (x{a.pieces})</span>
                        </div>
                        {a.effect2 && info?.description2 && (
                          <div className="active-sets_content_card_info_description">
                            <span className="active-sets_content_card_info_tag">
                              2-piece
                            </span>
                            {"  "}
                            {info.description2}
                          </div>
                        )}
                        {a.effect4 && info?.description4 && (
                          <div className="active-sets_content_card_info_description">
                            <span className="active-sets_content_card_info_tag">
                              4-piece
                            </span>{" "}
                            {info.description4}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* DRIVE DISCS */}
        <div className="drive-dics-block">
          {Object.values(discs).map((disc) => {
            const slotToClass: Record<number, string> = {
              1: "slot-1",
              2: "slot-2",
              3: "slot-3",
              4: "slot-4",
              5: "slot-5",
              6: "slot-6",
            };
            const targetClass = slotToClass[disc.slot];

            return (
              <div
                key={disc.slot}
                className={`slot ${targetClass}`}
                style={emptyObjectsStyle}
              >
                <div className="drive-discs-wrapper">
                  <div className="drive-discs-title transform-title">
                    <h2>Slot {disc.slot}</h2>
                    <div
                      className="divider"
                      style={{ backgroundColor: theme }}
                    ></div>
                  </div>
                  <div className="drive-discs-preview">
                    <div className="drive-discs-icon flex-center">
                      {disc.setId && (
                        <img
                          src={`/resources/images/sets/${disc.setId}-alt.png`}
                          alt={disc.setId}
                        />
                      )}
                    </div>
                    <div className="drive-discs-importer">
                      {/* <button onClick={() => openImportModal(disc.slot)}> IMPORT </button> */}
                      <button
                        disabled
                        style={{ opacity: 0.5, cursor: "not-allowed" }}
                        title="Importación de discos desactivada temporalmente"
                      >
                        IMPORT
                      </button>
                    </div>
                  </div>
                  <div className="drive-discs-selectors">
                    <label>Main Stat:</label>
                    <div className="drive-discs-selectors_main">
                      <NeonSelect
                        value={disc.main.type ?? ""}
                        options={(MAIN_STATS_BY_SLOT[disc.slot] || []).map(
                          (stat) => ({
                            value: stat,
                            label: stat,
                          }),
                        )}
                        theme={selectedAgent.themeColor}
                        variant="main"
                        onChange={(type) => {
                          updateDisc(disc.slot, (old) => ({
                            ...old,
                            main: {
                              type,
                              value: generateMainValue(type, 15),
                            },
                            substats: old.substats.map((s) =>
                              s.type === type
                                ? { type: null, rolls: 0, value: 0 }
                                : s,
                            ),
                          }));
                        }}
                      />
                      {disc.main.type && (
                        <span className="drive-discs-selectors_main_value">
                          {disc.main.type.includes("%")
                            ? (disc.main.value * 100).toFixed(1) + "%"
                            : disc.main.value}
                        </span>
                      )}
                    </div>
                    <label>Set:</label>
                    <button
                      style={{ "--theme": theme }}
                      onClick={() => setActiveSetSlot(disc.slot)}
                    >
                      {disc.setId
                        ? discSets.find((s) => s.id === disc.setId)?.name
                        : "..."}
                    </button>
                  </div>
                  <div className="drive-discs-selectors_subtitle transform-title">
                    <h2>Substats</h2>
                    <div
                      className="divider"
                      style={{ backgroundColor: theme }}
                    ></div>
                  </div>
                  <div className="drive-discs-content">
                    {disc.substats.map((sub, i) => {
                      const isPercent = sub.type?.includes("%");
                      return (
                        <div key={i} className="substats">
                          <NeonSelect
                            value={sub.type ?? ""}
                            theme={selectedAgent.themeColor}
                            variant="substat"
                            options={Object.keys(SUB_RANGES_S).map((s) => {
                              const isMain = s === disc.main.type;
                              const isDuplicate = disc.substats.some(
                                (other, idx) => idx !== i && other.type === s,
                              );
                              return {
                                value: s,
                                label: s,
                                disabled: isMain || isDuplicate,
                              };
                            })}
                            onChange={(type) => {
                              if (!type || type === disc.main.type) return;
                              updateDisc(disc.slot, (old) => {
                                const updated = [...old.substats];
                                updated[i] = {
                                  ...updated[i],
                                  type,
                                  value: subValueFromRolls(
                                    type,
                                    updated[i].rolls,
                                  ),
                                };
                                return { ...old, substats: updated };
                              });
                            }}
                          />
                          <label> + </label>
                          <div className="drive-discs-contents-controls">
                            <button
                              className="drive-discs-contents-controls_roller flex-center"
                              onClick={() => {
                                if (sub.rolls <= 0) return;
                                updateDisc(disc.slot, (old) => {
                                  const updated = [...old.substats];
                                  updated[i] = {
                                    ...updated[i],
                                    rolls: sub.rolls - 1,
                                    value: subValueFromRolls(
                                      updated[i].type,
                                      sub.rolls - 1,
                                    ),
                                  };
                                  return { ...old, substats: updated };
                                });
                              }}
                            >
                              &lt;
                            </button>
                            <span className="drive-discs-contents-controls_indicator">
                              {sub.rolls}
                            </span>
                            <button
                              className="drive-discs-contents-controls_roller flex-center"
                              onClick={() => {
                                if (sub.rolls >= 5) return;
                                updateDisc(disc.slot, (old) => {
                                  const totalCurrentRolls = old.substats.reduce(
                                    (sum, s) => sum + s.rolls,
                                    0,
                                  );
                                  if (totalCurrentRolls + 1 > 5) return old;
                                  const updated = [...old.substats];
                                  updated[i] = {
                                    ...updated[i],
                                    rolls: sub.rolls + 1,
                                    value: subValueFromRolls(
                                      updated[i].type,
                                      sub.rolls + 1,
                                    ),
                                  };
                                  return { ...old, substats: updated };
                                });
                              }}
                            >
                              &gt;
                            </button>
                          </div>
                          <span className="drive-discs-contents-controls_value">
                            →ㅤ{""}
                            {isPercent
                              ? (sub.value * 100).toFixed(2) + "%"
                              : sub.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* GUÍA INFORMATIVA */}
        <div className="block guide-block">
          <div className="guide-wrapper" style={emptyObjectsStyle}>
            {/* GUÍA - SIEMPRE VISIBLE */}
            <div className="guide-header">
              <h2 className="transform-title ">
                Z-Tunner: ZZZ Build Creator Overview
              </h2>
              <div
                className="divider"
                style={{ backgroundColor: theme, marginBottom: "2.5px" }}
              />
            </div>
            <div className="guide-section">
              <div className="guide-grid">
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${theme}CC`,
                    borderRight: `3px solid ${theme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">🚀</span>
                    <h4 className="guide-title"> Getting Started </h4>
                  </div>
                  <p className="guide-text">
                    {" "}
                    Select an agent from the selector to load them into the
                    builder and then equip the W-Engine and Drive Discs that
                    best complement their kit. Not sure where to start? Try
                    replicating your current in-game setup and then experiment
                    from there!{" "}
                  </p>
                  <p className="guide-tip">
                    {" "}
                    💡 Tip: Click "SAVE BUILD" once you're happy with a setup.
                    You can use "COPY BUILD" to create multiple variations
                    too.{" "}
                  </p>
                </div>
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${theme}CC`,
                    borderRight: `3px solid ${theme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">💾</span>
                    <h4 className="guide-title"> Managing Your Builds </h4>
                  </div>
                  <p className="guide-text">
                    {" "}
                    Use the buttons above to save, update, duplicate, or rename
                    your builds. The dropdown lets you quickly switch and manage
                    saved configurations, making it easy to compare their
                    differences later in the Damage Calculator.{" "}
                  </p>
                  <p className="guide-tip">
                    {" "}
                    💡 Tip: If the "SAVE BUILD" or "UPDATE BUILD" buttons become
                    active, be sure to click them to avoid losing any
                    changes.{" "}
                  </p>
                </div>
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${theme}CC`,
                    borderRight: `3px solid ${theme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">📀</span>
                    <h4 className="guide-title"> Drive Discs System </h4>
                  </div>
                  <p className="guide-text">
                    {" "}
                    The Drive Disc system works just like it does in-game,
                    including all disc sets, main stats, and up to five substat
                    rolls for each slot. This makes it the perfect opportunity
                    to check if Elfy actually gave you something worth keeping
                    for once.{" "}
                  </p>
                  <p className="guide-tip">
                    {" "}
                    💡 Tip: Use the "IMPORT" button to choose and load discs you
                    have previously created in the Disk Creator page.{" "}
                  </p>
                </div>
                <div
                  className="guide-card"
                  style={{
                    borderLeft: `3px solid ${theme}CC`,
                    borderRight: `3px solid ${theme}CC`,
                  }}
                >
                  <div className="guide-card-header">
                    <span className="guide-icon">🎬</span>
                    <h4 className="guide-title"> Mindscape Cinemas </h4>
                  </div>
                  <p className="guide-text">
                    {" "}
                    All agents have their Mindscape Cinemas available in the
                    Build Creator. Simply click any node to add them to your
                    build, as they will be useful later in the Damage Calculator
                    to help you determine whether the investment is really worth
                    it.{" "}
                  </p>
                  <p className="guide-tip">
                    {" "}
                    💡 Tip: Mindscape Cinema selections are saved separately for
                    each build, so you can freely experiment with them.{" "}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER  */}
        <div className="block footer-block">
          <div className="footer-wrapper" style={emptyObjectsStyle}>
            <div
              className="social-footer"
              style={{
                backgroundColor: `color-mix(in srgb, ${theme} 12%, transparent)`,
                border: `1px solid ${theme}22`,
                borderRadius: "10px",
                padding: "12px 20px",
              }}
            >
              <div className="social-footer-content">
                <div className="social-footer-left">
                  <span className="social-copyright">© 2026 Z-TUNNER</span>
                  <span className="social-version">v1.0.0</span>
                </div>

                <div className="social-links">
                  {/* Discord */}
                  <a
                    href="https://discord.gg/tu-invite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    title="Join our Discord"
                  >
                    <svg
                      className="social-icon"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>Discord</span>
                  </a>

                  {/* Cafecito / Donaciones */}
                  <a
                    href="https://cafecito.app/tuusuario"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link donation"
                    title="Buy me a coffee"
                  >
                    <span className="donation-icon">☕</span>
                    <span>Cafecito</span>
                  </a>

                  {/* Ko-fi (alternativa) */}
                  <a
                    href="https://ko-fi.com/ztunner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link donation"
                    title="Support me on Ko-fi"
                  >
                    <span>🎁</span>
                    <span>Donate</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SET MODAL */}
        <ModalSelector
          open={activeSetSlot !== null}
          title={
            activeSetSlot !== null ? `Select Set for Slot ${activeSetSlot}` : ""
          }
          className="set-modal"
          theme={selectedAgent.themeColor}
          options={discSets.map((s) => ({
            id: s.id,
            name: s.name,
            img: `/resources/images/sets/${s.id}.png`,
          }))}
          onClose={() => setActiveSetSlot(null)}
          onSelect={(id) => {
            if (activeSetSlot === null) return;
            updateDisc(activeSetSlot, (old) => ({
              ...old,
              setId: id as string,
            }));
            setActiveSetSlot(null);
          }}
        />

        {/* IMPORT MODAL */}
        {importModalOpen && currentImportSlot && (
          <div className="modal-overlay">
            <div
              className="modal-content-wrapper"
              style={{ border: `2px solid ${theme}` }}
            >
              <div className="modal-header">
                <h3 className="modal-header-title" style={{ color: theme }}>
                  Import Disk for Slot {currentImportSlot}
                </h3>
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setCurrentImportSlot(null);
                  }}
                  className="modal-header-button"
                >
                  ✕
                </button>
              </div>
              {savedDisks.length === 0 ? (
                <div className="modal-empy_state">
                  <div className="modal-empy_state-icon">📀</div>
                  <h4 className="modal-empy_state-text">
                    No disks in inventory
                  </h4>
                  <p>
                    Go to the Disk Creator page to create and save disks first!
                  </p>
                  <button
                    onClick={() => {
                      window.location.href = "/disks";
                    }}
                    className="modal-empy_state-button"
                    style={{
                      backgroundColor: theme,
                    }}
                  >
                    Go to Disk Creator
                  </button>
                </div>
              ) : (
                <div className="modal-disc_importer-overlay">
                  {savedDisks
                    .filter((disk) => disk.slot === currentImportSlot)
                    .map((disk) => (
                      <div
                        key={disk.id}
                        onClick={() => importDisk(disk)}
                        className="modal-disc_importer-card"
                        style={{
                          border: `2px solid ${theme}66`,
                        }}
                      >
                        <div className="modal-disc_importer-card-header">
                          <div className="modal-disc_importer-card-icon">
                            {disk.setId && (
                              <img
                                src={`/resources/images/sets/${disk.setId}.png`}
                                alt={disk.setId}
                                className="modal-disc_importer-card-png"
                              />
                            )}
                          </div>

                          <div className="modal-disc_importer-card-info">
                            <h4 className="modal-disc_importer-card-title">
                              {disk.name || "Unnamed Disk"}
                            </h4>

                            <div className="modal-disc_importer-card-subtitle">
                              {discSets.find((s) => s.id === disk.setId)
                                ?.name || disk.setId}
                            </div>
                          </div>

                          <div className="modal-disc_importer-card-slot_indicator">
                            Slot {disk.slot}
                          </div>
                        </div>
                        <div className="modal-disc_importer-summary">
                          <span className="modal-disc_importer-summary-tag">
                            {disk.main.type}
                          </span>
                          <span
                            className="modal-disc_importer-summary-number"
                            style={{ color: theme }}
                          >
                            {disk.main.type?.includes("%")
                              ? (disk.main.value * 100).toFixed(1) + "%"
                              : disk.main.value}
                          </span>
                        </div>
                        <div>
                          {disk.substats
                            .filter((sub) => sub.type)
                            .slice(0, 4)
                            .map((sub, i) => (
                              <div
                                className="modal-disc_importer-stat_row"
                                key={i}
                                style={{
                                  borderBottom:
                                    i < 3 ? "1px solid #333" : "none",
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div className="modal-disc_importer-stat_row-label">
                                    {sub.type}
                                  </div>
                                  <div className="modal-disc_importer-stat_row-inline-info">
                                    {Array.from({ length: 5 }).map(
                                      (_, rollIndex) => (
                                        <div
                                          key={rollIndex}
                                          className="modal-disc_importer-stat_row-dot"
                                          style={{
                                            backgroundColor:
                                              rollIndex < sub.rolls
                                                ? rollIndex === 4
                                                  ? "#FF9800"
                                                  : theme
                                                : "#333",
                                            border:
                                              rollIndex < sub.rolls
                                                ? "1px solid transparent"
                                                : "1px solid #555",
                                          }}
                                        />
                                      ),
                                    )}
                                    <span className="modal-disc_importer-stat_row-tag">
                                      +{sub.rolls}
                                    </span>
                                  </div>
                                </div>
                                <span className="modal-disc_importer-stat_row-value">
                                  {sub.type?.includes("%")
                                    ? (sub.value * 100).toFixed(2) + "%"
                                    : sub.value}
                                </span>
                              </div>
                            ))}
                          <div className="modal-disc_importer-stat_row-summary">
                            <span style={{ color: "#ccc", fontSize: "11px" }}>
                              📊 Disk Summary
                            </span>
                            <span
                              className="modal-disc_importer-stat_row-roll-badge"
                              style={{
                                color:
                                  disk.substats.reduce(
                                    (sum, s) => sum + s.rolls,
                                    0,
                                  ) === 5
                                    ? "#94ee97"
                                    : "#f5e285",
                                border:
                                  disk.substats.reduce(
                                    (sum, s) => sum + s.rolls,
                                    0,
                                  ) === 5
                                    ? "1px solid #94ee97"
                                    : "1px solid #f5e285",
                              }}
                            >
                              {disk.substats.reduce(
                                (sum, s) => sum + s.rolls,
                                0,
                              )}
                              /5
                            </span>
                          </div>
                        </div>
                        <div
                          className="modal-disc_importer-stat_row-footer-text"
                          style={{
                            color: theme,
                          }}
                        >
                          Click to Import →
                        </div>
                      </div>
                    ))}
                  {savedDisks.filter((disk) => disk.slot === currentImportSlot)
                    .length === 0 && (
                    <div className="modal-disc_importer-overlay-message">
                      <p>No disks saved for Slot {currentImportSlot}.</p>
                    </div>
                  )}
                </div>
              )}
              {/*<div className="modal-disc_importer-stat_row-footer">
                <button
                  onClick={() => {
                    window.location.href = "/disks";
                  }}
                  className="modal-disc_importer-stat_row-action-button"
                  style={{
                    border: `1px solid ${theme}`,
                  }}
                >
                  ➕ Create New Disk in Disk Creator
                </button>
              </div>*/}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
