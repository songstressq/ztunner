import { useState, useEffect } from "react";
import type { SavedBuild } from "@/types/SavedBuild";
import type { DriveDisc } from "@/types/DriveDisc";
import { agents } from "@/data/agents";
import { wEngines } from "@/data/wengines";
import discSets from "@/data/discSets.json";
import { calculateUnifiedStats } from "@/utils/statScaling";
import { getActiveSets } from "@/utils/setDetection";
import DiagonalMarquee from "@/components/DiagonalMarquee";
import {
  loadAllBuilds,
  deleteBuild,
  renameBuild,
  duplicateBuild,
} from "@/utils/savedBuilds";
import "@/styles/agents.css";
import NeonSelect from "@/components/NeonSelect";
import { useSession } from "@/context/SessionContext";

const BuildManager = () => {
  const { homeSession } = useSession();
  const theme = "#FF4684FF";
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name" | "agent" | "created" | "updated"
  >("updated");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    refreshBuilds();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAgent, filterSpecialty, sortBy]);

  const refreshBuilds = () => {
    setSavedBuilds(loadAllBuilds());
  };

  const handleDeleteBuild = (buildId: string) => {
    if (!window.confirm("Delete this build? This action cannot be undone."))
      return;
    deleteBuild(buildId);
    refreshBuilds();
  };

  const handleRenameStart = (build: SavedBuild) => {
    setRenamingId(build.id);
    setRenameValue(build.name);
  };

  const handleRenameSave = (buildId: string) => {
    if (renameValue.trim()) {
      renameBuild(buildId, renameValue.trim());
      setRenamingId(null);
      setRenameValue("");
      refreshBuilds();
    }
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDuplicateBuild = (buildId: string) => {
    duplicateBuild(buildId);
    refreshBuilds();
  };

  const handleExportSingle = (build: SavedBuild) => {
    const dataStr = JSON.stringify(build, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute(
      "download",
      `build-${build.name.replace(/\s+/g, "-").toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.json`,
    );
    linkElement.click();
  };

  const handleImportBuilds = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const builds = JSON.parse(content);
          const buildsToImport = Array.isArray(builds) ? builds : [builds];
          if (!buildsToImport.every((b: any) => b.id && b.name && b.agentId)) {
            throw new Error("Invalid build format");
          }
          if (
            window.confirm(
              `Import ${buildsToImport.length} build${buildsToImport.length !== 1 ? "s" : ""}?`,
            )
          ) {
            const currentBuilds = loadAllBuilds();
            const updatedBuilds = [...currentBuilds, ...buildsToImport];
            localStorage.setItem("savedBuilds", JSON.stringify(updatedBuilds));
            refreshBuilds();
            alert("Builds imported successfully!");
          }
        } catch (error) {
          alert("Error importing builds: Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportAll = () => {
    if (savedBuilds.length === 0) {
      alert("No builds to export!");
      return;
    }
    const dataStr = JSON.stringify(savedBuilds, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute(
      "download",
      `all-builds-${new Date().toISOString().split("T")[0]}.json`,
    );
    linkElement.click();
  };

  const handleClearAll = () => {
    if (savedBuilds.length === 0) return;
    if (
      window.confirm(
        `Clear ALL ${savedBuilds.length} builds? This action cannot be undone!`,
      )
    ) {
      localStorage.removeItem("savedBuilds");
      refreshBuilds();
    }
  };

  const filteredBuilds = savedBuilds
    .filter((build) => {
      const agent = agents.find((a) => a.id === build.agentId);
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          build.name.toLowerCase().includes(term) ||
          agent?.displayName.toLowerCase().includes(term) ||
          agent?.fullName?.toLowerCase().includes(term)
        );
      }
      if (filterAgent !== "all" && build.agentId !== filterAgent) return false;
      if (filterSpecialty !== "all" && agent?.specialty !== filterSpecialty)
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "agent":
          const agentA =
            agents.find((ag) => ag.id === a.agentId)?.displayName || "";
          const agentB =
            agents.find((ag) => ag.id === b.agentId)?.displayName || "";
          return agentA.localeCompare(agentB);
        case "created":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "updated":
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

  const totalPages = Math.ceil(filteredBuilds.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentBuilds = filteredBuilds.slice(indexOfFirst, indexOfLast);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getBuildStats = (build: SavedBuild) => {
    const agent = agents.find((a) => a.id === build.agentId);
    const engine = wEngines.find((w) => w.id === build.engineId) || null;
    if (!agent) return null;
    return calculateUnifiedStats(agent, engine, build.coreLevel, build.discs);
  };

  const getActiveSetsForBuild = (discs: Record<number, DriveDisc>) => {
    return getActiveSets(discs);
  };

  const uniqueAgents = Array.from(new Set(savedBuilds.map((b) => b.agentId)))
    .map((agentId) => agents.find((a) => a.id === agentId))
    .filter(Boolean);

  const uniqueSpecialties = Array.from(
    new Set(
      savedBuilds.map((b) => {
        const agent = agents.find((a) => a.id === b.agentId);
        return agent?.specialty;
      }),
    ),
  ).filter(Boolean);

  const stats = {
    total: savedBuilds.length,
    bySpecialty: savedBuilds.reduce(
      (acc, build) => {
        const agent = agents.find((a) => a.id === build.agentId);
        const specialty = agent?.specialty || "Unknown";
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    byAgent: savedBuilds.reduce(
      (acc, build) => {
        acc[build.agentId] = (acc[build.agentId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    totalDisks: savedBuilds.reduce(
      (sum, build) => sum + Object.keys(build.discs).length,
      0,
    ),
  };

  const dominantTheme = homeSession.dominantTheme || theme;
  const dominantEmptyStyle = {
    backgroundImage: `linear-gradient(to right bottom, ${dominantTheme}11, ${dominantTheme}22, ${dominantTheme}55, ${dominantTheme}22, ${dominantTheme}11)`,
  };

  return (
    <div
      className="agents-page-wrapper"
      style={
        {
          "--theme": theme,
          "--dominant-theme": dominantTheme,
        } as React.CSSProperties
      }
    >
      {/* ---- FILA DE BLOQUES: ESTADÍSTICAS + ACCIONES ---- */}
      <div className="agents-row">
        {/* Bloque de estadísticas */}
        <div className="agents-block">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div className="agents-stats-header">
              <h1 className="agents-title">Z-Tunner: ZZZ Build Manager</h1>
              <div className="agents-stats-badge">
                {stats.total} Build{stats.total !== 1 ? "s" : ""}
              </div>
            </div>
            <p className="agents-stats-description">
              Manage your saved character builds, review their configurations,
              and keep everything organized as you create, refine, and
              experiment with different setups throughout Z-Tunner.
            </p>
            <div className="agents-stats-grid">
              <div className="agents-stat-card">
                <div className="agents-stat-label">Total Builds</div>
                <div className="agents-stat-value">{stats.total}</div>
              </div>
              <div className="agents-stat-card">
                <div className="agents-stat-label">Total Disks</div>
                <div className="agents-stat-value">{stats.totalDisks}</div>
              </div>
              <div className="agents-stat-card">
                <div className="agents-stat-label">Unique Agents</div>
                <div className="agents-stat-value">
                  {Object.keys(stats.byAgent).length}
                </div>
              </div>
              <div className="agents-stat-card">
                <div className="agents-stat-label">Most Built</div>
                <div className="agents-stat-value most">
                  {Object.keys(stats.byAgent).length > 0
                    ? (() => {
                        const mostBuilt = Object.entries(stats.byAgent).sort(
                          (a, b) => b[1] - a[1],
                        )[0];
                        const agent = agents.find((a) => a.id === mostBuilt[0]);
                        return `${agent?.displayName || mostBuilt[0]} (${mostBuilt[1]})`;
                      })()
                    : "None"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque de acciones (botones en columna) */}
        <div className="agents-block">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div className="agents-actions-column">
              <button
                onClick={handleExportAll}
                disabled={savedBuilds.length === 0}
                className="agents-action-btn"
              >
                Export All Builds
              </button>
              <button
                onClick={handleImportBuilds}
                className="agents-action-btn"
              >
                Import Builds
              </button>
              <button
                onClick={handleClearAll}
                disabled={savedBuilds.length === 0}
                className="agents-action-btn"
              >
                Clear All Builds
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- BLOQUE DE FILTROS ---- */}
      <div className="agents-block">
        <div className="agents-wrapper" style={dominantEmptyStyle}>
          <div className="agents-filters-grid">
            <div className="agents-filter-group">
              <label>Search Builds:</label>
              <input
                type="text"
                placeholder="Search by name or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="agents-search-input"
              />
            </div>
            <div className="agents-filter-group">
              <label>Filter by Agent:</label>
              <NeonSelect
                value={filterAgent}
                options={[
                  { value: "all", label: "All Agents" },
                  ...uniqueAgents.map((agent) => ({
                    value: agent!.id,
                    label: agent!.displayName,
                  })),
                ]}
                onChange={(value) => setFilterAgent(value)}
                theme={dominantTheme}
                variant="main"
              />
            </div>
            <div className="agents-filter-group">
              <label>Filter by Specialty:</label>
              <NeonSelect
                value={filterSpecialty}
                options={[
                  { value: "all", label: "All Specialties" },
                  ...uniqueSpecialties.map((specialty) => ({
                    value: specialty,
                    label: specialty,
                  })),
                ]}
                onChange={(value) => setFilterSpecialty(value)}
                theme={dominantTheme}
                variant="main"
              />
            </div>
            <div className="agents-filter-group">
              <label>Sort Builds By:</label>
              <NeonSelect
                value={sortBy}
                options={[
                  { value: "updated", label: "Recently Updated" },
                  { value: "created", label: "Newest First" },
                  { value: "name", label: "Name (A-Z)" },
                  { value: "agent", label: "Agent Name" },
                ]}
                onChange={(value) => setSortBy(value as any)}
                theme={dominantTheme}
                variant="main"
              />
            </div>
          </div>
          <div className="agents-filter-count">
            {filteredBuilds.length > 0 ? (
              <>
                Showing {indexOfFirst + 1}–
                {Math.min(indexOfLast, filteredBuilds.length)} of{" "}
                {filteredBuilds.length} build
                {filteredBuilds.length !== 1 ? "s" : ""}
              </>
            ) : (
              <>Showing 0 of 0 builds</>
            )}
          </div>
        </div>
      </div>

      {/* ---- LISTA DE BUILDS (con paginación) ---- */}
      {savedBuilds.length === 0 ? (
        <div className="agents-block">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div className="agents-empty">
              <p className="agents-empty-text">
                You haven't created any builds yet.
              </p>
              <p className="agents-empty-sub">
                Go to the Build Creator to start building your agents.
              </p>
            </div>
          </div>
        </div>
      ) : filteredBuilds.length === 0 ? (
        <div className="agents-block">
          <div className="agents-wrapper" style={dominantEmptyStyle}>
            <div className="agents-empty">
              <h3 className="agents-empty-title">
                No Builds Match Your Filters
              </h3>
              <p className="agents-empty-text">
                Try changing your search terms or filters.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="agents-builds-grid">
            {currentBuilds.map((build) => {
              const agent = agents.find((a) => a.id === build.agentId);
              const engine = wEngines.find((w) => w.id === build.engineId);
              const stats = getBuildStats(build);
              const activeSets = getActiveSetsForBuild(build.discs);
              if (!agent) return null;
              const agentTheme = agent.themeColor || theme;
              const cardEmptyStyle = {
                backgroundImage: `linear-gradient(to right bottom, ${dominantTheme}33, ${agentTheme}21, ${dominantTheme}55, ${agentTheme}21, ${dominantTheme}33)`,
              };

              return (
                <div
                  key={build.id}
                  className="agents-block"
                  style={{ marginBottom: 0 }}
                >
                  <div
                    className="agents-wrapper"
                    style={{ ...cardEmptyStyle, "--theme": agentTheme }}
                  >
                    <div className="agents-build-card">
                      <div className="agents-build-header">
                        <div className="agents-build-identity">
                          <div className="agents-build-avatar">
                            <img
                              src={`{`${import.meta.env.BASE_URL}resources/images/agents/icons/${agent.id}.png`}
                              alt={agent.displayName}
                            />
                          </div>
                          <div>
                            {renamingId === build.id ? (
                              <div className="agents-rename-container">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) =>
                                    setRenameValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleRenameSave(build.id);
                                    if (e.key === "Escape")
                                      handleRenameCancel();
                                  }}
                                  className="agents-rename-input"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRenameSave(build.id)}
                                  className="agents-rename-save"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleRenameCancel}
                                  className="agents-rename-cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <h3 className="agents-build-name">
                                {build.name}
                              </h3>
                            )}
                            <div className="agents-build-tags">
                              <span className="agents-build-tag-agent">
                                {agent.displayName}
                              </span>
                              <span className="agents-build-tag-specialty">
                                {agent.specialty}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="agents-build-actions">
                          <button
                            onClick={() => handleRenameStart(build)}
                            className="agents-build-action-btn rename"
                            title="Rename build"
                          >
                            🏷️
                          </button>
                          <button
                            onClick={() => handleDuplicateBuild(build.id)}
                            className="agents-build-action-btn duplicate"
                            title="Duplicate build"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleExportSingle(build)}
                            className="agents-build-action-btn export"
                            title="Export build"
                          >
                            💾
                          </button>
                          <button
                            onClick={() => handleDeleteBuild(build.id)}
                            className="agents-build-action-btn delete"
                            title="Delete build"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {engine && (
                        <div className="agents-engine">
                          <div className="agents-engine-icon">
                            <img
                              src={`{`${import.meta.env.BASE_URL}resources/images/wengines/${engine.id}.png`}
                              alt={engine.name}
                            />
                          </div>
                          <div>
                            <div className="agents-engine-name">
                              {engine.name}
                            </div>
                            <div className="agents-engine-details">
                              <span>{engine.rarity} Rank</span>
                              <span>•</span>
                              <span>{engine.specialty}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {stats && agent.recommendedStats?.stats && (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "12px",
                            }}
                          >
                            <span style={{ color: "rgba(255,255,255,0.7)" }}>
                              Recommended Stats
                            </span>
                          </div>
                          <div className="agents-recommended-grid">
                            {agent.recommendedStats.stats
                              .slice(0, 4)
                              .map((recommendedStat, index) => {
                                let displayValue = "";

                                if (
                                  recommendedStat.includes("CRIT Rate") ||
                                  recommendedStat === "Crit Rate"
                                ) {
                                  displayValue =
                                    (stats.critRate * 100).toFixed(1) + "%";
                                } else if (
                                  recommendedStat.includes("CRIT DMG") ||
                                  recommendedStat === "Crit Dmg"
                                ) {
                                  displayValue =
                                    (stats.critDmg * 100).toFixed(1) + "%";
                                } else if (
                                  recommendedStat.includes("HP") &&
                                  !recommendedStat.includes("%")
                                ) {
                                  displayValue = Math.round(
                                    stats.hp,
                                  ).toLocaleString();
                                } else if (
                                  recommendedStat.includes("ATK") &&
                                  !recommendedStat.includes("%")
                                ) {
                                  displayValue = Math.round(
                                    stats.atk,
                                  ).toLocaleString();
                                } else if (
                                  recommendedStat.includes("DEF") &&
                                  !recommendedStat.includes("%")
                                ) {
                                  displayValue = Math.round(
                                    stats.def,
                                  ).toLocaleString();
                                } else if (
                                  recommendedStat === "Sheer Force" &&
                                  "sheerForce" in stats
                                ) {
                                  displayValue = Math.round(
                                    (stats as any).sheerForce || 0,
                                  ).toLocaleString();
                                } else if (recommendedStat === "Impact") {
                                  displayValue = Math.round(
                                    stats.impact,
                                  ).toLocaleString();
                                } else if (
                                  recommendedStat === "Anomaly Proficiency"
                                ) {
                                  displayValue = Math.round(
                                    stats.anomalyProficiency,
                                  ).toLocaleString();
                                } else if (
                                  recommendedStat === "Anomaly Mastery"
                                ) {
                                  displayValue = Math.floor(
                                    stats.anomalyMastery,
                                  ).toLocaleString();
                                } else if (recommendedStat === "PEN Ratio") {
                                  displayValue =
                                    (stats.penRatio * 100).toFixed(1) + "%";
                                } else if (recommendedStat === "PEN") {
                                  displayValue = Math.round(
                                    stats.pen,
                                  ).toLocaleString();
                                } else if (recommendedStat === "Energy Regen") {
                                  displayValue = stats.energyRegen.toFixed(2);
                                } else if (
                                  recommendedStat.includes("DMG Bonus")
                                ) {
                                  const attribute =
                                    agent.attribute.toLowerCase();
                                  if (attribute in stats.attributeDmgBonus) {
                                    const bonus =
                                      stats.attributeDmgBonus[
                                        attribute as keyof typeof stats.attributeDmgBonus
                                      ];
                                    displayValue =
                                      (bonus * 100).toFixed(1) + "%";
                                  }
                                }

                                if (!displayValue) {
                                  const directKey = recommendedStat
                                    .toLowerCase()
                                    .replace(/\s+/g, "");
                                  if (directKey in stats) {
                                    const value = (stats as any)[directKey];
                                    displayValue =
                                      typeof value === "number"
                                        ? directKey.includes("rate") ||
                                          directKey.includes("dmg") ||
                                          directKey.includes("ratio")
                                          ? (value * 100).toFixed(1) + "%"
                                          : Math.round(value).toLocaleString()
                                        : String(value);
                                  } else {
                                    displayValue = "N/A";
                                  }
                                }

                                return (
                                  <div
                                    key={index}
                                    className="agents-recommended-item"
                                  >
                                    <div className="agents-recommended-priority">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className="agents-recommended-label">
                                        Priority {index + 1}
                                      </div>
                                      <div className="agents-recommended-stat-name">
                                        {recommendedStat}
                                      </div>
                                    </div>
                                    <span className="agents-recommended-value">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}

                            <div
                              className={`agents-core ${build.coreLevel === 6 ? "max" : ""}`}
                            >
                              <div>
                                <div className="agents-core-label">
                                  Core Passive
                                </div>
                                <div className="agents-core-name">Level</div>
                              </div>
                              <div className="agents-core-level">
                                <span className="agents-core-level-number">
                                  {build.coreLevel}/6
                                </span>
                                {build.coreLevel === 6 && (
                                  <span className="agents-core-max-badge">
                                    MAX
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSets.length > 0 && (
                        <div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.6)",
                              fontSize: "var(--home-14px)",
                              fontWeight: "bold",
                              marginBottom: "10px",
                            }}
                          >
                            Active Sets
                          </div>
                          <div className="agents-active-sets-list">
                            {activeSets.map((set) => {
                              const setInfo = discSets.find(
                                (s) => s.id === set.setId,
                              );
                              return (
                                <div
                                  key={set.setId}
                                  className="agents-active-set-item"
                                >
                                  <img
                                    src={`{`${import.meta.env.BASE_URL}resources/images/sets/${set.setId}.png`}
                                    alt={setInfo?.name}
                                  />
                                  <span className="agents-active-set-name">
                                    {setInfo?.name || set.setId}
                                  </span>
                                  <span className="agents-active-set-pieces">
                                    {set.pieces}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "var(--home-14px)",
                            fontWeight: "bold",
                            marginBottom: "10px",
                          }}
                        >
                          Disks Configuration
                        </div>
                        <div className="agents-disks-grid">
                          {[1, 2, 3, 4, 5, 6].map((slot) => {
                            const disk = build.discs[slot];
                            if (!disk || !disk.setId) return null;
                            return (
                              <div key={slot} className="agents-disk-item">
                                <div className="agents-disk-slot">
                                  Slot {slot}
                                </div>
                                <div className="agents-disk-main">
                                  {disk.main.type || "No Main"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="agents-build-footer">
                        <div>
                          Updated:{" "}
                          {new Date(build.updatedAt).toLocaleDateString()}{" "}
                          {new Date(build.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="agents-build-footer-id">
                          ID: {build.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---- PAGINACIÓN (envuelta en bloque con estilo) ---- */}
          {totalPages > 1 && (
            <div className="agents-block pagination-wrapper">
              <div className="agents-wrapper" style={dominantEmptyStyle}>
                <div className="agents-pagination">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="agents-pagination-btn"
                  >
                    ◀
                  </button>
                  <div className="agents-pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`agents-pagination-page ${page === currentPage ? "active" : ""}`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="agents-pagination-btn"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---- GUÍA / TIPS ---- */}
      <div className="agents-block spacing_a">
        <div className="agents-wrapper" style={dominantEmptyStyle}>
          <div className="guide-header">
            <h2 className="transform-title">
              Z-Tunner: ZZZ Build Manager Overview
            </h2>
            <div
              className="divider"
              style={{ backgroundColor: dominantTheme, marginBottom: "2.5px" }}
            />
          </div>
          <div className="guide-section">
            <div className="agents_guide-grid">
              {/* Tarjeta 1: Export & Backup */}
              <div
                className="guide-card"
                style={{
                  borderLeft: `3px solid ${dominantTheme}CC`,
                  borderRight: `3px solid ${dominantTheme}CC`,
                }}
              >
                <div className="guide-card-header">
                  <span className="guide-icon">💾</span>
                  <h4 className="guide-title">Export & Backup</h4>
                </div>
                <p className="guide-text">
                  Keep your builds safe and synchronized between devices or
                  browsers by exporting them as JSON files with the{" "}
                  <strong>"EXPORT ALL BUILDS"</strong> button. You can also
                  export individual builds, making it easy to create backups
                  before making major changes.
                </p>
                <p className="guide-tip">
                  💡 Tip: Import your exported builds on another device or
                  browser to restore your collection and continue where you left
                  off.
                </p>
              </div>

              {/* Tarjeta 2: Build Overview */}
              <div
                className="guide-card"
                style={{
                  borderLeft: `3px solid ${dominantTheme}CC`,
                  borderRight: `3px solid ${dominantTheme}CC`,
                }}
              >
                <div className="guide-card-header">
                  <span className="guide-icon">📊</span>
                  <h4 className="guide-title">Build Overview</h4>
                </div>
                <p className="guide-text">
                  Review the most important details of your saved builds at a
                  glance, thanks to a quick summary of the configurations and
                  equipment applied to your agents. This makes it easier to
                  inspect and compare your builds without opening them in the
                  Build Creator.
                </p>
                <p className="guide-tip">
                  💡 Tip: Use the displayed recommended stats to quickly spot
                  which areas of a build may need improvement.
                </p>
              </div>

              {/* Tarjeta 3: Build Management */}
              <div
                className="guide-card"
                style={{
                  borderLeft: `3px solid ${dominantTheme}CC`,
                  borderRight: `3px solid ${dominantTheme}CC`,
                }}
              >
                <div className="guide-card-header">
                  <span className="guide-icon">🏗️</span>
                  <h4 className="guide-title">Build Management</h4>
                </div>
                <p className="guide-text">
                  Manage your collection without opening each build
                  individually. Rename or duplicate builds, remove
                  configurations you no longer need, or export those you want to
                  preserve. Use the available filters and sorting options to
                  quickly find the builds you're looking for.
                </p>
                <p className="guide-tip">
                  💡 Tip: Use the search and filters together to narrow down
                  large collections quickly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER  */}
      <div className="agents-block">
        <div className="main_footer-footer_block" style={dominantEmptyStyle}>
          <div
            className="social-footer"
            style={{
              backgroundColor: `color-mix(in srgb, ${dominantTheme} 6%, transparent)`,
              border: `1px solid ${dominantTheme}22`,
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
                  className="manager-social-link"
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
                  className="manager-social-link donation"
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
                  className="manager-social-link donation"
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
    </div>
  );
};

export default BuildManager;
