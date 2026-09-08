import { useState, useEffect } from "react";
import { agents } from "@/data/agents";
import NeonSelect from "./NeonSelect";
import { useSession } from "@/context/SessionContext";
import { useSidebar } from "@/components/SidebarContext";

interface Props {
  open: boolean;
  onClose: () => void;
  theme?: string;
}

const SKILL_GROUPS = [
  { id: "basic", label: "Basic", types: ["basic"] },
  { id: "dodge", label: "Dodge", types: ["dash", "counter"] },
  {
    id: "assist",
    label: "Assist",
    types: ["quickAssist", "perfectAssist", "followup"],
  },
  { id: "special", label: "Special", types: ["special", "ex"] },
  { id: "chain", label: "Chain", types: ["chain", "ultimate"] },
] as const;

const DEFAULT_PROFILE = {
  basic: 11,
  dodge: 11,
  assist: 11,
  special: 11,
  chain: 11,
};

const SPECIALTY_ORDER = [
  "Attack",
  "Rupture",
  "Anomaly",
  "Stun",
  "Support",
] as const;

export default function SkillsProfileModal({
  open,
  onClose,
  theme = "#7EFFDB",
}: Props) {
  const { homeSession, setHomeSession } = useSession();
  const profiles = homeSession.skillProfiles || {};

  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    const keys = Object.keys(profiles);
    return keys.length > 0 ? keys[0] : agents[0]?.id || "";
  });

  const currentProfile = profiles[selectedAgentId] || DEFAULT_PROFILE;

  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (isSidebarOpen && open) {
      onClose();
    }
  }, [isSidebarOpen, open, onClose]);

  const updateProfile = (
    category: keyof typeof DEFAULT_PROFILE,
    level: number,
  ) => {
    setHomeSession((prev) => ({
      ...prev,
      skillProfiles: {
        ...prev.skillProfiles,
        [selectedAgentId]: {
          ...(prev.skillProfiles[selectedAgentId] || DEFAULT_PROFILE),
          [category]: level,
        },
      },
    }));
  };

  const agentOptions = (() => {
    const grouped = agents.reduce(
      (acc, agent) => {
        const specialty = agent.specialty || "Unknown";
        if (!acc[specialty]) acc[specialty] = [];
        acc[specialty].push(agent);
        return acc;
      },
      {} as Record<string, typeof agents>,
    );

    const options: Array<{ value: string; label: string; disabled?: boolean }> =
      [];

    for (const specialty of SPECIALTY_ORDER) {
      const agentsInGroup = grouped[specialty] || [];
      if (agentsInGroup.length === 0) continue;
      options.push({
        value: `__group_${specialty}`,
        label: specialty.toUpperCase(),
        disabled: true,
      });
      for (const agent of agentsInGroup) {
        const displayName = agent.fullName || agent.displayName || agent.name;
        options.push({
          value: agent.id,
          label: displayName,
        });
      }
    }

    const otherGroups = Object.keys(grouped).filter(
      (s) => !SPECIALTY_ORDER.includes(s as any),
    );
    for (const specialty of otherGroups) {
      const agentsInGroup = grouped[specialty];
      options.push({
        value: `__group_${specialty}`,
        label: specialty.toUpperCase(),
        disabled: true,
      });
      for (const agent of agentsInGroup) {
        const displayName = agent.fullName || agent.displayName || agent.name;
        options.push({
          value: agent.id,
          label: displayName,
        });
      }
    }

    return options;
  })();

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const agentDisplayName = selectedAgent
    ? selectedAgent.fullName || selectedAgent.displayName || selectedAgent.name
    : "";
  const triggerLabel = selectedAgent
    ? `${agentDisplayName} (${selectedAgent.specialty})`
    : "Select agent...";

  if (!open) return null;

  return (
    <div className="modal-overlay small_gap" onClick={onClose}>
      <div
        className="skill_modal-content_wrapper"
        style={{ "--theme": theme }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="skill_modal-header_wrapper ">
          <span className="skill_modal-header_text">Skills Profiles</span>
          <button onClick={onClose} className="skill_modal-header_button">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="skill_modal-main_content">
          <div className="skill_modal-select_wrapper">
            <label className="skill_modal-selet_label">Agent:</label>
            <NeonSelect
              value={selectedAgentId}
              displayValue={triggerLabel}
              options={agentOptions}
              onChange={(val) => setSelectedAgentId(val)}
              theme={theme}
              variant="skill"
            />
          </div>

          {/* Grupos de niveles */}
          <div className="skill_modal-groups">
            {SKILL_GROUPS.map((group) => (
              <div key={group.id}>
                <div className="skill_modal-selector_wrapper">
                  <span className="skill_modal-selector_group">
                    {group.label}
                  </span>
                  <span className="skill_modal-selector_level">
                    Level: {currentProfile[group.id]}
                  </span>
                </div>
                <div className="skill_selector-buttons_container skill_modal-space">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((level) => {
                    const isActive = currentProfile[group.id] === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        className="skill_selector-level_buttons"
                        onClick={() => {
                          updateProfile(group.id, level);
                        }}
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${theme}, ${theme}aa)`
                            : "#414141",
                          color: isActive ? "#ffffffee" : "#c4c3c3",
                          fontWeight: isActive ? "bold" : "normal",
                          boxShadow: isActive
                            ? `0 0 20px ${theme}55, inset 0 0 20px ${theme}33`
                            : "none",
                          border: `1px solid ${isActive ? theme : "#444"}`,
                          cursor: "pointer",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "13px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "#555";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "#414141";
                          }
                        }}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
