import { useState, useEffect } from "react";
import type { DriveDisc, StatKey } from "@/types/DriveDisc";
import { MAIN_STATS_BY_SLOT } from "@/constants/discMainBySlot";
import { SUB_RANGES_S } from "@/constants/discRanges";
import { generateMainValue, subValueFromRolls } from "@/utils/discUtils";
import NeonSelect from "@/components/NeonSelect";
import ModalSelector from "@/components/ModalSelector";
import discSets from "@/data/discSets.json";
import DiagonalMarquee from "@/components/DiagonalMarquee";
import { useSession } from "@/context/SessionContext";

const DiscInventory = () => {
  const { homeSession } = useSession();
  const theme = "#36A9FCFF";
  const dominantTheme = homeSession.dominantTheme || theme;

  const showComingSoon = true;

  if (showComingSoon) {
    const dominantTheme = homeSession.dominantTheme || "#36A9FCFF";
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
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          } as React.CSSProperties
        }
      >
        <div
          className="agents-row"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "stretch",
            marginBottom: 0,
          }}
        >
          <div
            className="agents-block"
            style={{
              flex: 1,
              marginBottom: 0,
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <div
              className="agents-wrapper"
              style={{
                ...dominantEmptyStyle,
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px",
                minHeight: "60vh",
              }}
            >
              <div style={{ textAlign: "center", color: "white" }}>
                <h1
                  style={{
                    fontSize: "3rem",
                    textTransform: "uppercase",
                    letterSpacing: "4px",
                    color: dominantTheme,
                  }}
                >
                  Nothing here...
                </h1>
                <p
                  style={{
                    fontSize: "1.2rem",
                    color: "#aaa",
                    maxWidth: "600px",
                    margin: "0 auto",
                  }}
                >
                  The Disc Inventory still needs a little more work.
                  <br />
                  It'll be finished soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [savedDisks, setSavedDisks] = useState<DriveDisc[]>([]);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDiskId, setEditingDiskId] = useState<string | null>(null);
  const initialSlot = parseInt(localStorage.getItem("lastDiskSlot") || "1", 10);
  const validSlot = Math.min(6, Math.max(1, initialSlot));
  const [currentDisk, setCurrentDisk] = useState<DriveDisc>({
    slot: validSlot,
    rarity: "S",
    setId: "",
    main: { type: null, value: 0 },
    substats: Array(4)
      .fill(null)
      .map(() => ({ type: null, rolls: 0, value: 0 })),
    name: "",
  });

  useEffect(() => {
    loadDisks();
  }, []);

  const loadDisks = () => {
    const saved = localStorage.getItem("diskInventory");
    if (saved) {
      try {
        setSavedDisks(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading disks:", error);
      }
    }
  };

  const saveDisk = () => {
    if (!currentDisk.setId) {
      alert("Please select a set for the disk.");
      return;
    }
    if (!currentDisk.main.type) {
      alert("Please select a main stat.");
      return;
    }
    if (isEditing && editingDiskId) {
      const updatedDisks = savedDisks.map((disk) =>
        disk.id === editingDiskId
          ? {
              ...currentDisk,
              id: editingDiskId,
              name: currentDisk.name?.trim() || `Disk Slot ${currentDisk.slot}`,
              updatedAt: Date.now(),
              createdAt: disk.createdAt || Date.now(),
            }
          : disk,
      );
      setSavedDisks(updatedDisks);
      localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
      alert("Disk updated successfully!");
      resetForm();
    } else {
      const diskToSave: DriveDisc = {
        ...currentDisk,
        id: crypto.randomUUID(),
        name: currentDisk.name?.trim() || `Disk Slot ${currentDisk.slot}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updatedDisks = [...savedDisks, diskToSave];
      setSavedDisks(updatedDisks);
      localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
      alert("Disk saved to inventory!");
      resetForm();
    }
  };

  const startEditing = (disk: DriveDisc) => {
    setCurrentDisk({
      ...disk,
      name: disk.name || "",
    });
    setEditingDiskId(disk.id || null);
    setIsEditing(true);
    document.querySelector(".disk-creator-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const duplicateDisk = (disk: DriveDisc) => {
    const duplicated: DriveDisc = {
      ...disk,
      id: crypto.randomUUID(),
      name: `${disk.name || `Disk Slot ${disk.slot}`} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedDisks = [...savedDisks, duplicated];
    setSavedDisks(updatedDisks);
    localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
    alert("Disk duplicated!");
  };

  const deleteDisk = (diskId: string) => {
    if (!window.confirm("Delete this disk from inventory?")) return;
    const updatedDisks = savedDisks.filter((d) => d.id !== diskId);
    setSavedDisks(updatedDisks);
    localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
  };

  useEffect(() => {
    localStorage.setItem("lastDiskSlot", String(currentDisk.slot));
  }, [currentDisk.slot]);

  const resetForm = () => {
    const savedSlot = parseInt(localStorage.getItem("lastDiskSlot") || "1", 10);
    const validSlot = Math.min(6, Math.max(1, savedSlot));
    setCurrentDisk({
      slot: validSlot,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: Array(4)
        .fill(null)
        .map(() => ({ type: null, rolls: 0, value: 0 })),
      name: "",
    });
    setIsEditing(false);
    setEditingDiskId(null);
  };

  const updateCurrentDiskField = (field: keyof DriveDisc, value: any) => {
    if (field === "slot") {
      setCurrentDisk((prev) => ({
        slot: value,
        rarity: "S",
        setId: "",
        main: { type: null, value: 0 },
        substats: Array(4)
          .fill(null)
          .map(() => ({ type: null, rolls: 0, value: 0 })),
        name: prev.name || "",
      }));
    } else {
      setCurrentDisk((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const updateMainStat = (type: StatKey) => {
    const value = generateMainValue(type, 15);
    setCurrentDisk((prev) => ({
      ...prev,
      main: { type, value },
      substats: prev.substats.map((s) =>
        s.type === type ? { type: null, rolls: 0, value: 0 } : s,
      ),
    }));
  };

  const updateSubstat = (
    index: number,
    field: keyof DriveDisc["substats"][0],
    value: any,
  ) => {
    setCurrentDisk((prev) => {
      const updated = [...prev.substats];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      if (field === "type" || field === "rolls") {
        const type = field === "type" ? value : updated[index].type;
        const rolls = field === "rolls" ? value : updated[index].rolls;
        if (type) {
          updated[index].value = subValueFromRolls(type, rolls);
        }
      }
      return {
        ...prev,
        substats: updated,
      };
    });
  };

  const calculateTotalRolls = () => {
    return currentDisk.substats.reduce((sum, s) => sum + s.rolls, 0);
  };

  const getAvailableMainStats = () => {
    return MAIN_STATS_BY_SLOT[currentDisk.slot] || [];
  };

  const renderDiskForm = () => (
    <div
      className="disk-creator-section"
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        padding: "25px",
        border: `2px solid ${theme}44`,
        marginBottom: "30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: theme, margin: 0 }}>
          {isEditing ? "✏️ Edit Disk" : "Create New Disk"}
        </h2>
        {isEditing && (
          <button
            onClick={resetForm}
            style={{
              padding: "8px 16px",
              backgroundColor: "#555",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Nombre personalizado */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            color: "#ccc",
            fontWeight: "bold",
          }}
        >
          Disk Name:
        </label>
        <input
          type="text"
          value={currentDisk.name || ""}
          onChange={(e) => updateCurrentDiskField("name", e.target.value)}
          placeholder="e.g., 'My Best Crit DMG Disk for Slot 1'"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#222",
            border: `2px solid ${theme}66`,
            borderRadius: "6px",
            color: "#fff",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Slot */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            color: "#ccc",
            fontWeight: "bold",
          }}
        >
          Disk Slot:
        </label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6].map((slot) => (
            <button
              key={slot}
              onClick={() => updateCurrentDiskField("slot", slot)}
              style={{
                padding: "12px 0",
                backgroundColor: currentDisk.slot === slot ? theme : "#333",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                flex: "1 0 calc(16.66% - 10px)",
                minWidth: "80px",
                transition: "all 0.2s",
              }}
            >
              Slot {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Disk Set */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            color: "#ccc",
            fontWeight: "bold",
          }}
        >
          Disk Set:
        </label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
          }}
        >
          <button
            onClick={() => setSetModalOpen(true)}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "#222",
              border: `2px solid ${currentDisk.setId ? theme : "#555"}`,
              borderRadius: "6px",
              color: currentDisk.setId ? "#fff" : "#888",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "all 0.2s",
            }}
          >
            <span>
              {currentDisk.setId
                ? discSets.find((s) => s.id === currentDisk.setId)?.name ||
                  currentDisk.setId
                : "Select a set..."}
            </span>
            <span style={{ fontSize: "12px" }}>▼</span>
          </button>
          {currentDisk.setId && (
            <img
              src={`/resources/images/sets/${currentDisk.setId}-alt.png`}
              alt={currentDisk.setId}
              style={{
                width: "44px",
                height: "44px",
                objectFit: "contain",
                borderRadius: "6px",
                backgroundColor: "#1a1a1a",
                padding: "6px",
                border: `1px solid ${theme}44`,
              }}
            />
          )}
        </div>
      </div>

      {/* Main Stat */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            color: "#ccc",
            fontWeight: "bold",
          }}
        >
          Main Stat (Slot {currentDisk.slot}):
        </label>
        <div
          style={{
            backgroundColor: `${theme}11`,
            padding: "20px",
            borderRadius: "8px",
            border: `1px solid ${theme}33`,
          }}
        >
          <NeonSelect
            value={currentDisk.main.type || ""}
            options={getAvailableMainStats()}
            theme={theme}
            variant="main"
            onChange={updateMainStat}
            placeholder="Select main stat..."
          />
          {currentDisk.main.type && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                backgroundColor: "#222",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#ccc", fontSize: "15px" }}>
                Main Stat Value:
              </span>
              <span
                style={{
                  color: theme,
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {currentDisk.main.type.includes("%")
                  ? (currentDisk.main.value * 100).toFixed(1) + "%"
                  : currentDisk.main.value}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Substats */}
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <label
            style={{
              color: "#ccc",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            Substats (Max 5 rolls total):
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                color:
                  calculateTotalRolls() === 5
                    ? "#4CAF50"
                    : calculateTotalRolls() > 5
                      ? "#f44336"
                      : "#ccc",
                fontSize: "14px",
                backgroundColor: calculateTotalRolls() > 5 ? "#331111" : "#222",
                padding: "6px 12px",
                borderRadius: "20px",
                border:
                  calculateTotalRolls() > 5 ? "1px solid #f44336" : "none",
              }}
            >
              Rolls: {calculateTotalRolls()}/5
            </span>
            {calculateTotalRolls() > 5 && (
              <span
                style={{
                  color: "#f44336",
                  fontSize: "12px",
                  backgroundColor: "#331111",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                ⚠️ Too many rolls!
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            backgroundColor: `${theme}11`,
            padding: "20px",
            borderRadius: "8px",
            border: `1px solid ${theme}33`,
          }}
        >
          {currentDisk.substats.map((sub, i) => (
            <div
              key={i}
              style={{
                marginBottom: i < 3 ? "20px" : "0",
                padding: i < 3 ? "0 0 20px 0" : "0",
                borderBottom: i < 3 ? "2px solid #333" : "none",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                {/* Type Selector */}
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      marginBottom: "5px",
                      marginLeft: "5px",
                    }}
                  >
                    Substat {i + 1}
                  </div>
                  <NeonSelect
                    value={sub.type || ""}
                    options={Object.keys(SUB_RANGES_S).map((stat) => ({
                      value: stat,
                      label: stat,
                      disabled:
                        stat === currentDisk.main.type ||
                        currentDisk.substats.some(
                          (s, idx) => idx !== i && s.type === stat,
                        ),
                    }))}
                    theme={theme}
                    variant="substat"
                    onChange={(type) =>
                      updateSubstat(i, "type", type as StatKey)
                    }
                    placeholder={`Select substat ${i + 1}...`}
                  />
                </div>
                {/* Rolls Counter */}
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      marginBottom: "5px",
                      textAlign: "center",
                    }}
                  >
                    Rolls
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => {
                        if (sub.rolls > 0 && calculateTotalRolls() > 0) {
                          updateSubstat(i, "rolls", sub.rolls - 1);
                        }
                      }}
                      disabled={sub.rolls === 0}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: sub.rolls > 0 ? "#333" : "#222",
                        border: `2px solid ${sub.rolls > 0 ? "#555" : "#333"}`,
                        color: sub.rolls > 0 ? "#fff" : "#666",
                        borderRadius: "6px",
                        cursor: sub.rolls > 0 ? "pointer" : "not-allowed",
                        fontSize: "16px",
                        fontWeight: "bold",
                        minWidth: "44px",
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        minWidth: "40px",
                        textAlign: "center",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "18px",
                        backgroundColor: "#222",
                        padding: "8px",
                        borderRadius: "6px",
                      }}
                    >
                      {sub.rolls}
                    </span>
                    <button
                      onClick={() => {
                        if (sub.rolls < 5 && calculateTotalRolls() < 5) {
                          updateSubstat(i, "rolls", sub.rolls + 1);
                        } else if (calculateTotalRolls() >= 5) {
                          alert("Maximum 5 rolls total per disk!");
                        }
                      }}
                      disabled={sub.rolls === 5 || calculateTotalRolls() >= 5}
                      style={{
                        padding: "8px 12px",
                        backgroundColor:
                          sub.rolls < 5 && calculateTotalRolls() < 5
                            ? "#333"
                            : "#222",
                        border: `2px solid ${
                          sub.rolls < 5 && calculateTotalRolls() < 5
                            ? "#555"
                            : "#333"
                        }`,
                        color:
                          sub.rolls < 5 && calculateTotalRolls() < 5
                            ? "#fff"
                            : "#666",
                        borderRadius: "6px",
                        cursor:
                          sub.rolls < 5 && calculateTotalRolls() < 5
                            ? "pointer"
                            : "not-allowed",
                        fontSize: "16px",
                        fontWeight: "bold",
                        minWidth: "44px",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Value Display */}
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      marginBottom: "5px",
                      textAlign: "right",
                    }}
                  >
                    Value
                  </div>
                  {sub.type ? (
                    <div
                      style={{
                        color: "#7EFFDB",
                        fontWeight: "bold",
                        fontSize: "16px",
                        textAlign: "right",
                        backgroundColor: "#222",
                        padding: "10px 15px",
                        borderRadius: "6px",
                        border: "1px solid #333",
                      }}
                    >
                      {sub.type.includes("%")
                        ? (sub.value * 100).toFixed(2) + "%"
                        : sub.value}
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        textAlign: "center",
                        padding: "10px",
                        fontStyle: "italic",
                      }}
                    >
                      Select type
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save/Update Button */}
      <button
        onClick={saveDisk}
        disabled={
          !currentDisk.setId ||
          !currentDisk.main.type ||
          calculateTotalRolls() > 5
        }
        style={{
          width: "100%",
          padding: "16px",
          backgroundColor:
            currentDisk.setId &&
            currentDisk.main.type &&
            calculateTotalRolls() <= 5
              ? isEditing
                ? "#FF9800"
                : theme
              : "#555",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor:
            currentDisk.setId &&
            currentDisk.main.type &&
            calculateTotalRolls() <= 5
              ? "pointer"
              : "not-allowed",
          fontWeight: "bold",
          fontSize: "16px",
          transition: "all 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {isEditing ? (
          <>
            <span>✏️</span> UPDATE DISK
          </>
        ) : (
          <>
            <span>💾</span> SAVE DISK TO INVENTORY
          </>
        )}
      </button>
    </div>
  );

  return (
    <div
      className="page-wrapper"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <DiagonalMarquee
        text="Disk Creator"
        selectedAgent={null}
        customColor={theme}
      />
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* FORMULARIO DE CREACIÓN/EDICIÓN */}
        {renderDiskForm()}

        {/* INVENTARIO DE DISCOS */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: "12px",
            padding: "25px",
            border: `2px solid ${theme}44`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ color: theme, margin: 0 }}>
              Your Disk Inventory
              {isEditing && (
                <span
                  style={{
                    fontSize: "14px",
                    color: "#FF9800",
                    marginLeft: "10px",
                    backgroundColor: "#332200",
                    padding: "4px 10px",
                    borderRadius: "10px",
                  }}
                >
                  Editing Mode
                </span>
              )}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span
                style={{
                  backgroundColor: "#222",
                  color: "#7EFFDB",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                {savedDisks.length} disk{savedDisks.length !== 1 ? "s" : ""}
              </span>
              {savedDisks.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Clear ALL disks from inventory?")) {
                      setSavedDisks([]);
                      localStorage.removeItem("diskInventory");
                      if (isEditing) resetForm();
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#331111",
                    border: "1px solid #662222",
                    color: "#ff6b6b",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {savedDisks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#888",
                backgroundColor: "#222",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>📀</div>
              <h3 style={{ color: "#ccc", marginBottom: "15px" }}>
                {" "}
                No disks yet{" "}
              </h3>
              <p style={{ fontSize: "16px", marginBottom: "5px" }}>
                Create your first disk using the form above!
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  maxWidth: "500px",
                  margin: "0 auto",
                }}
              >
                Disks saved here will be automatically available in the W-Engine
                Builder
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {savedDisks.map((disk, index) => (
                <div
                  key={disk.id}
                  style={{
                    backgroundColor: "#222",
                    borderRadius: "10px",
                    padding: "20px",
                    borderLeft: `5px solid ${theme}`,
                    borderTop: `1px solid ${
                      editingDiskId === disk.id ? "#FF9800" : "#333"
                    }`,
                    position: "relative",
                    transition: "all 0.3s",
                    transform:
                      editingDiskId === disk.id ? "translateY(-5px)" : "none",
                    boxShadow:
                      editingDiskId === disk.id
                        ? "0 10px 25px rgba(255, 152, 0, 0.2)"
                        : "none",
                  }}
                >
                  {editingDiskId === disk.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        right: "20px",
                        backgroundColor: "#FF9800",
                        color: "#000",
                        padding: "4px 12px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        zIndex: 1,
                      }}
                    >
                      ⚡ EDITING
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <h4
                      style={{
                        color: editingDiskId === disk.id ? "#FF9800" : "#fff",
                        margin: 0,
                        fontSize: "16px",
                      }}
                    >
                      {disk.name || `Disk ${index + 1}`}
                    </h4>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => startEditing(disk)}
                        style={{
                          background: "none",
                          border: "none",
                          color:
                            editingDiskId === disk.id ? "#FF9800" : "#2196F3",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor:
                            editingDiskId === disk.id
                              ? "#332200"
                              : "transparent",
                          transition: "all 0.2s",
                        }}
                        title="Edit disk"
                      >
                        {editingDiskId === disk.id ? "✏️" : "🖊️"}
                      </button>
                      <button
                        onClick={() => duplicateDisk(disk)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#9C27B0",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "6px",
                          borderRadius: "6px",
                          transition: "all 0.2s",
                        }}
                        title="Duplicate disk"
                      >
                        ⎘
                      </button>
                      <button
                        onClick={() => deleteDisk(disk.id!)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f44336",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "6px",
                          borderRadius: "6px",
                          transition: "all 0.2s",
                        }}
                        title="Delete disk"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "12px",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    {disk.setId && (
                      <img
                        src={`/resources/images/sets/${disk.setId}.png`}
                        alt={disk.setId}
                        style={{
                          width: "34px",
                          height: "34px",
                          objectFit: "contain",
                          borderRadius: "4px",
                          backgroundColor: "#1a1a1a",
                          padding: "4px",
                          border: `1px solid ${theme}33`,
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#333",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          width: "fit-content",
                        }}
                      >
                        <span style={{ fontSize: "12px" }}>Slot</span>
                        <span
                          style={{
                            backgroundColor: theme,
                            color: "#000",
                            padding: "2px 8px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          {disk.slot}
                        </span>
                      </span>
                      <span
                        style={{
                          backgroundColor: "#333",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          width: "fit-content",
                        }}
                      >
                        {discSets.find((s) => s.id === disk.setId)?.name ||
                          disk.setId}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#1a1a1a",
                      padding: "12px 15px",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #333",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#ccc",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        Main Stat
                      </div>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: "15px",
                          marginTop: "3px",
                        }}
                      >
                        {disk.main.type}
                      </div>
                    </div>
                    <span
                      style={{
                        color: theme,
                        fontWeight: "bold",
                        fontSize: "18px",
                        backgroundColor: "#222",
                        padding: "8px 15px",
                        borderRadius: "6px",
                        border: `1px solid ${theme}44`,
                      }}
                    >
                      {disk.main.type?.includes("%")
                        ? (disk.main.value * 100).toFixed(1) + "%"
                        : disk.main.value}
                    </span>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        color: "#ccc",
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginBottom: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Substats</span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          backgroundColor: "#222",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        Total rolls:{" "}
                        {disk.substats.reduce((sum, s) => sum + s.rolls, 0)}/5
                      </span>
                    </div>
                    <div style={{ fontSize: "13px" }}>
                      {disk.substats
                        .filter((sub) => sub.type)
                        .map((sub, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px",
                              marginBottom: "8px",
                              backgroundColor: "#1a1a1a",
                              borderRadius: "6px",
                              borderLeft: `3px solid ${
                                i % 3 === 0
                                  ? "#7EFFDB"
                                  : i % 3 === 1
                                    ? "#FF6B6B"
                                    : "#4CAF50"
                              }`,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  color: "#fff",
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                }}
                              >
                                {sub.type}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#888",
                                  marginTop: "3px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: "#333",
                                    padding: "1px 6px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  Rolls: {sub.rolls}
                                </span>
                                {sub.rolls === 5 && (
                                  <span
                                    style={{
                                      backgroundColor: "#4CAF50",
                                      color: "#000",
                                      padding: "1px 6px",
                                      borderRadius: "8px",
                                      fontSize: "10px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    MAX
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                color: "#7EFFDB",
                                fontWeight: "bold",
                                fontSize: "15px",
                              }}
                            >
                              {sub.type?.includes("%")
                                ? (sub.value * 100).toFixed(2) + "%"
                                : sub.value}
                            </span>
                          </div>
                        ))}
                      {disk.substats.filter((sub) => sub.type).length === 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#666",
                            fontStyle: "italic",
                            backgroundColor: "#1a1a1a",
                            borderRadius: "6px",
                          }}
                        >
                          No substats configured
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      marginTop: "15px",
                      paddingTop: "10px",
                      borderTop: "1px solid #333",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      Created:{" "}
                      {disk.createdAt
                        ? new Date(disk.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                    <span
                      style={{
                        backgroundColor: "#222",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        color:
                          editingDiskId === disk.id ? "#FF9800" : "#36A9FC",
                      }}
                    >
                      {editingDiskId === disk.id
                        ? "Currently Editing"
                        : "Ready to Use"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedDisks.length > 0 && (
            <div
              style={{
                marginTop: "30px",
                paddingTop: "25px",
                borderTop: "2px solid #333",
              }}
            >
              <h3 style={{ color: theme, marginBottom: "15px" }}>
                Inventory Actions
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    if (window.confirm("Export all disks as JSON file?")) {
                      const dataStr = JSON.stringify(savedDisks, null, 2);
                      const dataUri =
                        "data:application/json;charset=utf-8," +
                        encodeURIComponent(dataStr);
                      const exportFileDefaultName = `disks-backup-${new Date().toISOString().split("T")[0]}.json`;
                      const linkElement = document.createElement("a");
                      linkElement.setAttribute("href", dataUri);
                      linkElement.setAttribute(
                        "download",
                        exportFileDefaultName,
                      );
                      linkElement.click();
                    }
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  💾 Export All Disks as JSON
                </button>
                <button
                  onClick={() => {
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
                          const disks = JSON.parse(content);
                          if (!Array.isArray(disks)) {
                            throw new Error("Invalid format");
                          }
                          if (
                            window.confirm(
                              `Import ${disks.length} disks? This will add to your current inventory.`,
                            )
                          ) {
                            const updatedDisks = [...savedDisks, ...disks];
                            setSavedDisks(updatedDisks);
                            localStorage.setItem(
                              "diskInventory",
                              JSON.stringify(updatedDisks),
                            );
                            alert("Disks imported successfully!");
                          }
                        } catch (error) {
                          alert("Error importing disks: Invalid file format");
                        }
                      };
                      reader.readAsText(file);
                    };
                    input.click();
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#2196F3",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  📥 Import Disks from JSON
                </button>
                <button
                  onClick={() => {
                    if (isEditing) {
                      if (
                        window.confirm(
                          "You are currently editing a disk. Cancel edit and clear inventory?",
                        )
                      ) {
                        resetForm();
                        setSavedDisks([]);
                        localStorage.removeItem("diskInventory");
                      }
                    } else if (
                      window.confirm("Clear ALL disks from inventory?")
                    ) {
                      setSavedDisks([]);
                      localStorage.removeItem("diskInventory");
                    }
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#f44336",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  🗑️ Clear Entire Inventory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div
          style={{
            marginTop: "30px",
            backgroundColor: "#222",
            borderRadius: "10px",
            padding: "25px",
            border: `2px solid ${theme}33`,
          }}
        >
          <h3 style={{ color: theme, marginBottom: "15px" }}>
            How to Use Disk Creator
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
              color: "#ccc",
              fontSize: "15px",
            }}
          >
            <div>
              <div
                style={{
                  color: theme,
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "20px" }}>1.</span> Create & Edit Disks
              </div>
              <p>
                Use the form above to create new disks. Click the edit icon 🖊️
                on any disk to modify it. All changes are saved automatically.
              </p>
            </div>
            <div>
              <div
                style={{
                  color: theme,
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "20px" }}>2.</span> Organize Inventory
              </div>
              <p>
                Each disk shows its slot, set, main stat, and substats. Use the
                duplicate button ⎘ to quickly copy disks with similar stats.
              </p>
            </div>
            <div>
              <div
                style={{
                  color: theme,
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "20px" }}>3.</span> Use in Builds
              </div>
              <p>
                Go to W-Engine Builder → select a disk slot → click "Import from
                Inventory" to use your saved disks in character builds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para seleccionar set */}
      <ModalSelector
        open={setModalOpen}
        title="Select Disk Set"
        options={discSets.map((set) => ({
          id: set.id,
          name: set.name,
          img: `/resources/images/sets/${set.id}.png`,
        }))}
        onClose={() => setSetModalOpen(false)}
        onSelect={(id) => {
          updateCurrentDiskField("setId", id);
          setSetModalOpen(false);
        }}
      />
    </div>
  );
};

export default DiscInventory;
