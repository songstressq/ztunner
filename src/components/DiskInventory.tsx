import { useState, useEffect } from "react";
import type { DriveDisc, StatKey } from "@/types/DriveDisc";
import { MAIN_STATS_BY_SLOT } from "@/constants/discMainBySlot";
import { SUB_RANGES_S } from "@/constants/discRanges";
import { generateMainValue, subValueFromRolls } from "@/utils/discUtils";
import NeonSelect from "./NeonSelect";
import ModalSelector from "./ModalSelector";
import discSets from "@/data/discSets.json";
import "../styles/DiskInventory.css";

interface DiskInventoryProps {
  onSelectDisk?: (disk: DriveDisc) => void;
  theme?: string;
  showOnlySlot?: number;
}

const DiskInventory = ({
  onSelectDisk,
  theme = "#ffffff",
  showOnlySlot,
}: DiskInventoryProps) => {
  const [savedDisks, setSavedDisks] = useState<DriveDisc[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingDisk, setEditingDisk] = useState<DriveDisc | null>(null);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSlot, setFilterSlot] = useState<number | "all">("all");
  const [filterSet, setFilterSet] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "slot" | "created" | "updated">(
    "created",
  );

  const [currentDisk, setCurrentDisk] = useState<DriveDisc>({
    slot: 1,
    rarity: "S",
    setId: "",
    main: { type: null, value: 0 },
    substats: Array(4)
      .fill(null)
      .map(() => ({ type: null, rolls: 0, value: 0 })),
  });

  useEffect(() => {
    loadDisks();
  }, []);

  const loadDisks = () => {
    try {
      const saved = localStorage.getItem("diskInventory");
      if (saved) {
        const disks: DriveDisc[] = JSON.parse(saved);
        setSavedDisks(disks);
      }
    } catch (error) {
      console.error("Error loading disks:", error);
    }
  };

  const filteredDisks = savedDisks
    .filter((disk) => {
      if (showOnlySlot !== undefined && disk.slot !== showOnlySlot)
        return false;

      if (filterSlot !== "all" && disk.slot !== filterSlot) return false;

      if (filterSet !== "all" && disk.setId !== filterSet) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          disk.name?.toLowerCase().includes(term) ||
          disk.setId.toLowerCase().includes(term) ||
          disk.main.type?.toLowerCase().includes(term) ||
          disk.substats.some((s) => s.type?.toLowerCase().includes(term))
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "slot":
          return a.slot - b.slot;
        case "created":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "updated":
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        default:
          return 0;
      }
    });

  const saveDisk = () => {
    if (!currentDisk.setId) {
      alert("Please select a set for the disk.");
      return;
    }

    if (!currentDisk.main.type) {
      alert("Please select a main stat.");
      return;
    }

    const diskToSave: DriveDisc = {
      ...currentDisk,
      id: editingDisk?.id || crypto.randomUUID(),
      name: currentDisk.name?.trim() || `Disk ${savedDisks.length + 1}`,
      updatedAt: Date.now(),
      createdAt: editingDisk?.createdAt || Date.now(),
    };

    const updatedDisks = editingDisk
      ? savedDisks.map((d) => (d.id === editingDisk.id ? diskToSave : d))
      : [...savedDisks, diskToSave];

    localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
    setSavedDisks(updatedDisks);

    if (editingDisk) {
      setEditingDisk(null);
      alert("Disk updated successfully!");
    } else {
      alert("Disk saved to inventory!");
    }

    resetForm();
  };

  const deleteDisk = (diskId: string) => {
    if (!window.confirm("Are you sure you want to delete this disk?")) return;

    const updatedDisks = savedDisks.filter((d) => d.id !== diskId);
    localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
    setSavedDisks(updatedDisks);
  };

  const toggleFavorite = (diskId: string) => {
    const updatedDisks = savedDisks.map((disk) =>
      disk.id === diskId ? { ...disk, favorite: !disk.favorite } : disk,
    );
    localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
    setSavedDisks(updatedDisks);
  };

  const resetForm = () => {
    setCurrentDisk({
      slot: 1,
      rarity: "S",
      setId: "",
      main: { type: null, value: 0 },
      substats: Array(4)
        .fill(null)
        .map(() => ({ type: null, rolls: 0, value: 0 })),
    });
    setIsCreatingNew(false);
    setEditingDisk(null);
  };

  const editDisk = (disk: DriveDisc) => {
    setCurrentDisk(disk);
    setEditingDisk(disk);
    setIsCreatingNew(true);
  };

  const updateDiskField = (field: keyof DriveDisc, value: any) => {
    setCurrentDisk((prev) => ({ ...prev, [field]: value }));
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
      updated[index] = { ...updated[index], [field]: value };

      if (field === "type" || field === "rolls") {
        const type = field === "type" ? value : updated[index].type;
        const rolls = field === "rolls" ? value : updated[index].rolls;
        if (type) {
          updated[index].value = subValueFromRolls(type, rolls);
        }
      }

      return { ...prev, substats: updated };
    });
  };

  const duplicateDisk = (disk: DriveDisc) => {
    const duplicated: DriveDisc = {
      ...disk,
      id: crypto.randomUUID(),
      name: `${disk.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedDisks = [...savedDisks, duplicated];
    localStorage.setItem("diskInventory", JSON.stringify(updatedDisks));
    setSavedDisks(updatedDisks);
    alert("Disk duplicated!");
  };

  const renderDiskForm = () => (
    <div
      className="DIR001"
      style={{
        border: `2px solid ${theme}`,

        backgroundColor: `${theme}11`,
      }}
    >
      <h3 className="DIR002" style={{ color: theme }}>
        {editingDisk ? "Edit Disk" : "Create New Disk"}
      </h3>

      {/* Nombre del disco */}
      <div className="DIR003">
        <label className="DIR004">Disk Name:</label>
        <input
          type="text"
          value={currentDisk.name || ""}
          onChange={(e) => updateDiskField("name", e.target.value)}
          placeholder="Enter a name for this disk..."
          className="DIR005"
        />
      </div>

      {/* Slot */}
      <div className="DIR006">
        <label className="DIR007">Slot:</label>
        <select
          value={currentDisk.slot}
          onChange={(e) => updateDiskField("slot", parseInt(e.target.value))}
          className="DIR008"
        >
          {[1, 2, 3, 4, 5, 6].map((slot) => (
            <option key={slot} value={slot}>
              Slot {slot}
            </option>
          ))}
        </select>
      </div>

      {/* Set */}
      <div className="DIR009">
        <label className="DIR010">Set:</label>
        <button
          className="DIR011"
          onClick={() => setSetModalOpen(true)}
          style={{
            border: `1px solid ${theme}`,

            color: currentDisk.setId ? "#fff" : "#888",
          }}
        >
          {currentDisk.setId
            ? discSets.find((s) => s.id === currentDisk.setId)?.name ||
              currentDisk.setId
            : "Select a set..."}
        </button>
      </div>

      {/* Main Stat */}
      <div className="DIR012">
        <label className="DIR013">Main Stat:</label>
        <div className="DIR014">
          <NeonSelect
            value={currentDisk.main.type || ""}
            options={MAIN_STATS_BY_SLOT[currentDisk.slot]}
            theme={theme}
            variant="main"
            onChange={updateMainStat}
            style={{ flex: 1 }}
          />
          {currentDisk.main.type && (
            <span className="DIR015" style={{ color: theme }}>
              {currentDisk.main.type.includes("%")
                ? (currentDisk.main.value * 100).toFixed(1) + "%"
                : currentDisk.main.value}
            </span>
          )}
        </div>
      </div>

      {/* Substats */}
      <div className="DIR016">
        <label className="DIR017">Substats (4 max):</label>
        {currentDisk.substats.map((sub, i) => (
          <div className="DIR018" key={i}>
            {/* Type Select */}
            <NeonSelect
              value={sub.type || ""}
              options={Object.keys(SUB_RANGES_S).map(
                (stat): { value: string; disabled: boolean } => {
                  const isMain = stat === currentDisk.main.type;
                  const isDuplicate = currentDisk.substats.some(
                    (other, idx) => idx !== i && other.type === stat,
                  );
                  return {
                    value: stat,
                    label: stat,
                    disabled: isMain || isDuplicate,
                  };
                },
              )}
              theme={theme}
              variant="substat"
              onChange={(type) => updateSubstat(i, "type", type as StatKey)}
              style={{ flex: 1 }}
            />

            {/* Rolls */}
            <div className="DIR019">
              <label className="DIR020">Rolls:</label>
              <div className="DIR021">
                <button
                  onClick={() => {
                    if (sub.rolls > 0) {
                      const totalRolls = currentDisk.substats.reduce(
                        (sum, s) => sum + s.rolls,
                        0,
                      );
                      if (totalRolls - 1 >= 0) {
                        updateSubstat(i, "rolls", sub.rolls - 1);
                      }
                    }
                  }}
                  className="DIR022"
                >
                  -
                </button>
                <span className="DIR023">{sub.rolls}</span>
                <button
                  onClick={() => {
                    if (sub.rolls < 5) {
                      const totalRolls = currentDisk.substats.reduce(
                        (sum, s) => sum + s.rolls,
                        0,
                      );
                      if (totalRolls + 1 <= 5) {
                        updateSubstat(i, "rolls", sub.rolls + 1);
                      } else {
                        alert("Maximum 5 rolls total per disk!");
                      }
                    }
                  }}
                  className="DIR024"
                >
                  +
                </button>
              </div>
            </div>

            {/* Value */}
            {sub.type && (
              <span className="DIR025">
                →{" "}
                {sub.type.includes("%")
                  ? (sub.value * 100).toFixed(2) + "%"
                  : sub.value}
              </span>
            )}
          </div>
        ))}

        <div className="DIR026">
          Total rolls:{" "}
          {currentDisk.substats.reduce((sum, s) => sum + s.rolls, 0)}/5
        </div>
      </div>

      {/* Action Buttons */}
      <div className="DIR027">
        <button
          onClick={saveDisk}
          className="DIR028"
          style={{
            backgroundColor: theme,
          }}
        >
          {editingDisk ? "Update Disk" : "Save to Inventory"}
        </button>
        <button onClick={resetForm} className="DIR029">
          Cancel
        </button>
      </div>
    </div>
  );

  const renderDiskList = () => (
    <div>
      {/* Filtros y búsqueda */}
      <div className="DIR030">
        <input
          className="DIR031"
          type="text"
          placeholder="Search disks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={filterSlot}
          onChange={(e) =>
            setFilterSlot(
              e.target.value === "all" ? "all" : parseInt(e.target.value),
            )
          }
          className="DIR032"
        >
          <option value="all">All Slots</option>
          {[1, 2, 3, 4, 5, 6].map((slot) => (
            <option key={slot} value={slot}>
              Slot {slot}
            </option>
          ))}
        </select>

        <select
          className="DIR033"
          value={filterSet}
          onChange={(e) => setFilterSet(e.target.value)}
        >
          <option value="all">All Sets</option>
          {Array.from(new Set(savedDisks.map((d) => d.setId))).map((setId) => {
            const set = discSets.find((s) => s.id === setId);
            return (
              <option key={setId} value={setId}>
                {set?.name || setId}
              </option>
            );
          })}
        </select>

        <select
          className="DIR034"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="created">Newest First</option>
          <option value="updated">Recently Updated</option>
          <option value="name">Name (A-Z)</option>
          <option value="slot">Slot (1-6)</option>
        </select>
      </div>

      {/* Lista de discos */}
      <div className="DIR035">
        {filteredDisks.length === 0 ? (
          <div className="DIR036">
            {searchTerm || filterSlot !== "all" || filterSet !== "all"
              ? "No disks match your filters."
              : "No disks saved yet. Create your first disk!"}
          </div>
        ) : (
          filteredDisks.map((disk) => (
            <div
              key={disk.id}
              className="DIR037"
              style={{
                border: `2px solid ${disk.favorite ? "#FFD700" : "#444"}`,
              }}
            >
              {/* Favorite Star */}
              <button
                className="DIR038"
                onClick={() => toggleFavorite(disk.id!)}
                style={{
                  color: disk.favorite ? "#FFD700" : "#666",
                }}
              >
                {disk.favorite ? "★" : "☆"}
              </button>

              {/* Disk Info */}
              <div className="DIR039">
                <div className="DIR040">
                  <h4 className="DIR041" style={{ color: theme }}>
                    {disk.name || `Disk ${disk.slot}`}
                  </h4>
                  <span className="DIR042">Slot {disk.slot}</span>
                </div>
                <div className="DIR043">
                  {discSets.find((s) => s.id === disk.setId)?.name ||
                    disk.setId}
                </div>
              </div>

              {/* Main Stat */}
              <div className="DIR044">
                <div className="DIR045">Main:</div>
                <div
                  className="DIR046"
                  style={{
                    backgroundColor: `${theme}22`,
                  }}
                >
                  <span>{disk.main.type}</span>
                  <span className="DIR047" style={{ color: theme }}>
                    {disk.main.type?.includes("%")
                      ? (disk.main.value * 100).toFixed(1) + "%"
                      : disk.main.value}
                  </span>
                </div>
              </div>

              {/* Substats */}
              <div className="DIR048">
                <div className="DIR049">Substats:</div>
                {disk.substats
                  .filter((sub) => sub.type)
                  .map((sub, i) => (
                    <div key={i} className="DIR050">
                      <span>{sub.type}</span>
                      <span className="DIR051">
                        {sub.type?.includes("%")
                          ? (sub.value * 100).toFixed(2) + "%"
                          : sub.value}
                        <span className="DIR052">(+{sub.rolls})</span>
                      </span>
                    </div>
                  ))}
              </div>

              {/* Action Buttons */}
              <div className="DIR053">
                {onSelectDisk && (
                  <button onClick={() => onSelectDisk(disk)} className="DIR054">
                    Use Disk
                  </button>
                )}
                <button className="DIR055" onClick={() => editDisk(disk)}>
                  Edit
                </button>
                <button className="DIR056" onClick={() => duplicateDisk(disk)}>
                  Copy
                </button>
                <button className="DIR057" onClick={() => deleteDisk(disk.id!)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="disk-inventory">
      {isCreatingNew || editingDisk ? renderDiskForm() : renderDiskList()}

      {/* Set Selector Modal */}
      <ModalSelector
        open={setModalOpen}
        title="Select Disk Set"
        options={discSets.map((set) => ({
          id: set.id,
          name: set.name,
          img: `/ztunner/resources/images/sets/${set.id}.png`,
        }))}
        onClose={() => setSetModalOpen(false)}
        onSelect={(id) => {
          updateDiskField("setId", id);
          setSetModalOpen(false);
        }}
      />
    </div>
  );
};

export default DiskInventory;
