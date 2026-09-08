import type { Agent } from "@/types/Agent";
import type { SavedBuild } from "@/types/SavedBuild";
import type { DriveDisc } from "@/types/DriveDisc";
import MindscapeSelector from "./MindscapeSelector";

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
  emptyObjectsStyle: React.CSSProperties;
}

const MindscapeSection = ({
  agent,
  theme,
  activeBuildId,
  savedBuilds,
  selectedEngineId,
  coreLevel,
  discs,
  localMindscapes,
  onLocalMindscapesChange,
  onMarkDirty,
  emptyObjectsStyle,
}: Props) => {
  return (
    <div className="block block-mindscapes">
      <div className="mindscapes-wrapper" style={emptyObjectsStyle}>
        <div className="mindscapes-title">
          <h2>Mindscape Cinema</h2>
        </div>
        <div
          className="divider mindscapes-divider"
          style={{ backgroundColor: theme }}
        />
        <div className="mindscapes-content">
          <MindscapeSelector
            agent={agent}
            theme={theme}
            activeBuildId={activeBuildId}
            savedBuilds={savedBuilds}
            selectedEngineId={selectedEngineId}
            coreLevel={coreLevel}
            discs={discs}
            localMindscapes={localMindscapes}
            onLocalMindscapesChange={onLocalMindscapesChange}
            onMarkDirty={onMarkDirty}
          />
        </div>
      </div>
    </div>
  );
};

export default MindscapeSection;
