import { useState, useEffect } from "react";
import type { Agent } from "@/types/Agent";
import type { CustomBaseStats } from "@/types/SavedBuild";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  currentCustomStats?: CustomBaseStats;
  onApply: (stats: CustomBaseStats | undefined) => void;
  theme?: string;
}

type FieldType = "flat" | "percent" | "decimal";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  isAttribute?: boolean;
}

const BASE_FIELDS: FieldDef[] = [
  { key: "hp", label: "HP", type: "flat" },
  { key: "atk", label: "ATK", type: "flat" },
  { key: "def", label: "DEF", type: "flat" },
];

const COMBAT_FIELDS: FieldDef[] = [
  { key: "impact", label: "Impact", type: "flat" },
  { key: "critRate", label: "CRIT Rate", type: "percent" },
  { key: "critDmg", label: "CRIT DMG", type: "percent" },
  { key: "anomalyProficiency", label: "Anomaly Proficiency", type: "flat" },
  { key: "anomalyMastery", label: "Anomaly Mastery", type: "flat" },
  { key: "penRatio", label: "PEN Ratio", type: "percent" },
  { key: "pen", label: "PEN", type: "flat" },
  { key: "energyRegen", label: "Energy Regen", type: "decimal" },
  { key: "sheerForce", label: "Sheer Force", type: "flat" },
  { key: "lacerationDmg", label: "Laceration DMG", type: "percent" },
];

const ATTRIBUTE_FIELDS: FieldDef[] = [
  { key: "fire", label: "Fire", type: "percent", isAttribute: true },
  { key: "ice", label: "Ice", type: "percent", isAttribute: true },
  { key: "electric", label: "Electric", type: "percent", isAttribute: true },
  { key: "physical", label: "Physical", type: "percent", isAttribute: true },
  { key: "ether", label: "Ether", type: "percent", isAttribute: true },
  { key: "wind", label: "Wind", type: "percent", isAttribute: true },
];

const getFieldHint = (fieldKey: string, agent: Agent): string | null => {
  if (fieldKey === "sheerForce") {
    return "Leave empty to use the automatic calculation";
  }
  if (fieldKey === "lacerationDmg") {
    return "Leave empty to use the agent's base value.";
  }
  return null;
};

export default function CustomBaseStatsModal({
  isOpen,
  onClose,
  agent,
  currentCustomStats,
  onApply,
  theme = "#7EFFDB",
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const nextValues: Record<string, string> = {};
    const nextAttrs: Record<string, string> = {};
    if (currentCustomStats) {
      for (const f of [...BASE_FIELDS, ...COMBAT_FIELDS]) {
        const v = (currentCustomStats as any)[f.key];
        if (v !== undefined && v !== null) {
          nextValues[f.key] =
            f.type === "percent" ? String(v * 100) : String(v);
        }
      }
      if (currentCustomStats.attributeDmgBonus) {
        for (const f of ATTRIBUTE_FIELDS) {
          const v = (currentCustomStats.attributeDmgBonus as any)[f.key];
          if (v !== undefined && v !== null) {
            nextAttrs[f.key] = String(v * 100);
          }
        }
      }
    }
    setValues(nextValues);
    setAttributes(nextAttrs);
  }, [isOpen, currentCustomStats]);

  if (!isOpen) return null;

  const getDefault = (field: FieldDef): number => {
    if (field.isAttribute) {
      return (agent.combatBase.attributeDmgBonus as any)[field.key] ?? 0;
    }
    if (field.key === "hp") return agent.baseStats.hp;
    if (field.key === "atk") return agent.baseStats.atk;
    if (field.key === "def") return agent.baseStats.def;
    return (agent.combatBase as any)[field.key] ?? 0;
  };

  const formatDefault = (field: FieldDef): string => {
    const v = getDefault(field);
    if (field.type === "percent") return `${(v * 100).toFixed(1)}%`;
    if (field.type === "decimal") return v.toFixed(2);
    return String(Math.round(v));
  };

  const handleChange = (key: string, raw: string, isAttr: boolean) => {
    const setter = isAttr ? setAttributes : setValues;
    setter((prev) => ({ ...prev, [key]: raw }));
  };

  const handleReset = () => {
    setValues({});
    setAttributes({});
  };

  const buildResult = (): CustomBaseStats | undefined => {
    const out: CustomBaseStats = {};
    let anySet = false;

    const parse = (raw: string, type: FieldType): number | undefined => {
      if (raw === "" || raw === undefined) return undefined;
      const n = parseFloat(raw);
      if (Number.isNaN(n)) return undefined;
      return type === "percent" ? n / 100 : n;
    };

    for (const f of [...BASE_FIELDS, ...COMBAT_FIELDS]) {
      const v = parse(values[f.key] ?? "", f.type);
      if (v !== undefined) {
        (out as any)[f.key] = v;
        anySet = true;
      }
    }

    const attrOut: Record<string, number> = {};
    for (const f of ATTRIBUTE_FIELDS) {
      const v = parse(attributes[f.key] ?? "", f.type);
      if (v !== undefined) {
        attrOut[f.key] = v;
        anySet = true;
      }
    }
    if (Object.keys(attrOut).length > 0) {
      out.attributeDmgBonus = attrOut as any;
    }

    return anySet ? out : undefined;
  };

  const handleApply = () => {
    onApply(buildResult());
    onClose();
  };

  const renderField = (field: FieldDef, isAttr = false) => {
    const raw = isAttr ? attributes[field.key] : values[field.key];
    const hint = !isAttr ? getFieldHint(field.key, agent) : null;
    return (
      <div key={field.key} className="custom-stats-field">
        <label className="custom-stats-label">{field.label}</label>
        <input
          type="text"
          inputMode="decimal"
          className="custom-stats-input"
          placeholder={formatDefault(field)}
          value={raw ?? ""}
          onChange={(e) => handleChange(field.key, e.target.value, isAttr)}
          style={{ borderColor: `${theme}55` }}
        />
        {hint && <div className="custom-stats-field-hint">{hint}</div>}
      </div>
    );
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? "open" : "closed"}`}
      onClick={onClose}
    >
      <div
        className="modal-content-wrapper custom-stats-modal"
        style={
          {
            "--theme": theme,
            border: `2px solid ${theme}`,
          } as React.CSSProperties
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-header-title" style={{ color: theme }}>
            Custom Base Stats — {agent.displayName || agent.name}
          </h3>
          <button onClick={onClose} className="modal-header-button">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="custom-stats-body">
          <p className="custom-stats-hint">
            Leave a field empty to use the value from the agent's build. Entered
            values override the build's base stats, while previously configured
            stats from the Agent's Core Passive, Drive Discs, W-Engine, and
            other sources still apply. It is recommended to use an empty build
            for this feature.
          </p>

          <div className="custom-stats-section">
            <h4 className="modal-main_section-divider-title">Main Stats</h4>
            <div className="custom-stats-grid">
              {BASE_FIELDS.map((f) => renderField(f))}
            </div>
          </div>

          <div className="custom-stats-section">
            <h4 className="modal-main_section-divider-title">Other Stats</h4>
            <div className="custom-stats-grid">
              {COMBAT_FIELDS.filter((f) => {
                if (f.key === "sheerForce")
                  return agent.specialty === "Rupture";
                if (f.key === "lacerationDmg")
                  return agent.specialty === "Armorer";
                return true;
              }).map((f) => renderField(f))}
            </div>
          </div>

          <div className="custom-stats-section">
            <h4 className="modal-main_section-divider-title">
              Attribute DMG Bonuses
            </h4>
            <div className="custom-stats-grid">
              {ATTRIBUTE_FIELDS.map((f) => renderField(f, true))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="custom-stats-footer">
          <button
            onClick={handleReset}
            className="custom-stats-footer-btn custom-stats-footer-btn--ghost"
          >
            Reset to defaults
          </button>
          <button
            onClick={handleApply}
            className="custom-stats-footer-btn custom-stats-footer-btn--primary"
            style={{ backgroundColor: theme }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
