import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Agent } from "@/types/Agent";
import type { SavedBuild } from "@/types/SavedBuild";
import type { DriveDisc } from "@/types/DriveDisc";

interface Props {
  agent: Agent;
  theme: string;
  activeBuildId: string | null;
  savedBuilds: SavedBuild[];
  selectedEngineId: string;
  coreLevel: number;
  discs: Record<number, DriveDisc>;
  localMindscapes: string[];
  onLocalMindscapesChange: (updated: string[]) => void;
  onMarkDirty: () => void;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

const MindscapeTooltip = ({ tooltip }: { tooltip: TooltipState }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: tooltip.x, y: tooltip.y });

  useEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const MARGIN = 10;
    const NODE_HEIGHT = 42;
    let x = tooltip.x - width / 2;
    let y = tooltip.y - height - 12;

    if (y < MARGIN) y = tooltip.y + NODE_HEIGHT + 8;
    x = Math.max(MARGIN, Math.min(x, vw - width - MARGIN));

    setPos({ x, y });
  }, [tooltip.x, tooltip.y]);

  return (
    <div
      ref={ref}
      className="ms-tooltip-portal"
      style={{ left: pos.x, top: pos.y }}
    >
      {tooltip.text}
    </div>
  );
};

const MindscapeSelector = ({
  agent,
  localMindscapes,
  onLocalMindscapesChange,
  onMarkDirty,
}: Props) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const mindscapeEffects =
    (agent as any).ingameEffects?.filter(
      (effect: any) => effect.source === "mindscape",
    ) || [];

  const mindscapeGroups = useMemo(() => {
    const groups: Map<number, { primaryEffect: any; allEffectIds: string[] }> =
      new Map();

    for (const effect of mindscapeEffects) {
      const match = effect.sourceId.match(/mindscape_(\d+)/);
      if (!match) continue;
      const num = parseInt(match[1], 10);

      if (!groups.has(num)) {
        groups.set(num, { primaryEffect: effect, allEffectIds: [] });
      }
      const group = groups.get(num)!;
      if (!group.allEffectIds.includes(effect.id)) {
        group.allEffectIds.push(effect.id);
      }
      if (effect.linkedEffects && Array.isArray(effect.linkedEffects)) {
        for (const linkedId of effect.linkedEffects) {
          if (!group.allEffectIds.includes(linkedId)) {
            group.allEffectIds.push(linkedId);
          }
        }
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, group]) => ({ num, ...group }));
  }, [mindscapeEffects]);

  const activeLevel = useMemo(() => {
    let highest = 0;
    for (const group of mindscapeGroups) {
      if (group.allEffectIds.every((id) => localMindscapes.includes(id))) {
        highest = group.num;
      }
    }
    return highest;
  }, [localMindscapes, mindscapeGroups]);

  const handleToggle = (clickedNum: number) => {
    const newActive: string[] = [];
    if (clickedNum === activeLevel) {
      for (const group of mindscapeGroups) {
        if (group.num < clickedNum) newActive.push(...group.allEffectIds);
      }
    } else {
      for (const group of mindscapeGroups) {
        if (group.num <= clickedNum) newActive.push(...group.allEffectIds);
      }
    }
    onLocalMindscapesChange(newActive);
    onMarkDirty();
  };

  const allowedMindscapes = [1, 2, 4, 6];

  const slots = allowedMindscapes.map((num) => {
    const group = mindscapeGroups.find((g) => g.num === num) ?? null;
    const isActive =
      !!group && group.allEffectIds.every((id) => localMindscapes.includes(id));
    const isFilled = !isActive && !!group && num < activeLevel;
    const isEmpty = !group;
    const tooltipText = group
      ? `${group.primaryEffect.label}\n\n${group.primaryEffect.description}`
      : null;
    return { num, isActive, isFilled, isEmpty, tooltipText };
  });

  return (
    <>
      <div className="mindscape-selector">
        <div
          className={`mindscape-selector-footer ${
            activeLevel === 0 ? "no-active" : "has-active"
          }`}
        >
          {activeLevel === 0
            ? "ⓘ SELECT YOUR AGENT'S ACTIVE MIDNSCAPES."
            : `ⓘ ACTIVATED MINDCSAPES UP TO N°${activeLevel}.`}
        </div>
        <div className="mindscape-nodes">
          {slots.map(({ num, isActive, isFilled, isEmpty, tooltipText }) => {
            const stateClass = isActive
              ? "ms-node--active"
              : isFilled
                ? "ms-node--filled"
                : isEmpty
                  ? "ms-node--empty"
                  : "";

            return (
              <div
                key={num}
                className={`ms-node ${stateClass}`}
                onClick={isEmpty ? undefined : () => handleToggle(num)}
                style={isEmpty ? { cursor: "default" } : undefined}
                onMouseEnter={
                  tooltipText
                    ? (e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setTooltip({
                          text: tooltipText,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }
                    : undefined
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {`MINDSCAPE N°${num}`}
              </div>
            );
          })}
        </div>
      </div>

      {tooltip &&
        createPortal(<MindscapeTooltip tooltip={tooltip} />, document.body)}
    </>
  );
};

export default MindscapeSelector;
