import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { SavedBuild } from "@/types/SavedBuild";
import type { UnifiedStats } from "@/types/Agent";

interface TeamEffectState {
  enabled: boolean;
  stacks: number;
  sourceSlot: number;
  ownerAgentId: string;
  ownerDisplayName?: string;
  ownerCurrentStats?: UnifiedStats;
  ownerInitialStats?: {
    hp: number;
    atk: number;
    def: number;
    critRate?: number;
    anomalyMastery?: number;
    anomalyProficiency?: number;
    energyRegen?: number;
    penRatio?: number;
    impact?: number;
  };
  skillLevel?: number;
  overclockLevel?: number;
}

interface TargetedEffect {
  sourceSlot: number;
  targetSlot: number;
  enabled: boolean;
}

interface SeedVanguardEffect {
  seedSlot: number;
  vanguardSlot: number;
  enabled: boolean;
}

export interface CalculatorUIState {
  selectedEnemyId: string;
  stunMultiplier: number;
  selectedSkillId: string;
  skillLevel: number;
  disorderSelectedAttribute: string;
  disorderTimeRemaining: number;
  vortexSourceSlot: number | null;
  vortexTimeRemaining: number;
  aliceDisorderSelectedAttribute: string;
  aliceTimeRemaining: number;
  aliceAssaultSourceSlot: number | null;
  yanagiPolaritySource: string | null;
  nangongPolaritySource: string | null;
  luminizeSourceSlot: number | null;
  luminizeSelectedSkillId: string | null;
  luminizeSkillLevel: number;
  hugoTotalizeActive: boolean;
  hugoStunTimeLessThan5: number;
  hugoStunTimeBetween5And15: number;
  hugoMindscape6Active: boolean;
  hugoTotalizeBonus: number;
  hugoFinalMultiplier: number;
  pyroisTotalizeActive: boolean;
  fluxedAttributes: (string | null)[];
  yanagiPolarityTimeRemaining: number;
  nangongPolarityTimeRemaining: number;
}

export const defaultCalculatorState: CalculatorUIState = {
  selectedEnemyId: "tyrfing_level60",
  stunMultiplier: 0,
  selectedSkillId: "",
  skillLevel: 11,
  disorderSelectedAttribute: "",
  disorderTimeRemaining: 10,
  vortexSourceSlot: null,
  vortexTimeRemaining: 10,
  aliceDisorderSelectedAttribute: "",
  aliceTimeRemaining: 10,
  aliceAssaultSourceSlot: null,
  yanagiPolaritySource: null,
  nangongPolaritySource: null,
  luminizeSourceSlot: null,
  luminizeSelectedSkillId: null,
  luminizeSkillLevel: 11,
  hugoTotalizeActive: false,
  hugoStunTimeLessThan5: 5,
  hugoStunTimeBetween5And15: 0,
  hugoMindscape6Active: false,
  hugoTotalizeBonus: 0,
  hugoFinalMultiplier: 0,
  pyroisTotalizeActive: false,
  fluxedAttributes: [null, null, null],
  yanagiPolarityTimeRemaining: 10,
  nangongPolarityTimeRemaining: 10,
};

interface HomeSession {
  selectedBuildIds: (string | null)[];
  activeEffectsByBuild: Record<
    string,
    Record<string, { enabled: boolean; stacks: number }>
  >;
  teamEffects: Record<string, TeamEffectState>;
  targetedEffects: Record<string, TargetedEffect>;
  seedVanguardEffects: Record<string, SeedVanguardEffect>;
  slotCalculatorStates: Record<number, CalculatorUIState>;
  gameModeEffectId: string | null;
  gameModeCurrentModeId: string;
  gameModeCurrentRoomId: string;
  skillProfiles: Record<
    string,
    {
      basic: number;
      dodge: number;
      assist: number;
      special: number;
      chain: number;
    }
  >;
  showGameModePanel: boolean;
  dominantTheme: string;
}

interface WEnginesSession {
  activeBuildId: string | null;
  selectedAgentId: string;
  selectedEngineId: string;
  coreLevel: number;
}

interface SessionContextValue {
  homeSession: HomeSession;
  setHomeSession: (updater: (prev: HomeSession) => HomeSession) => void;
  wEnginesSession: WEnginesSession;
  setWEnginesSession: (
    updater: (prev: WEnginesSession) => WEnginesSession,
  ) => void;
}

const defaultHomeSession: HomeSession = {
  selectedBuildIds: [null, null, null],
  activeEffectsByBuild: {},
  teamEffects: {},
  targetedEffects: {},
  seedVanguardEffects: {},
  slotCalculatorStates: {
    0: { ...defaultCalculatorState },
    1: { ...defaultCalculatorState },
    2: { ...defaultCalculatorState },
  },
  gameModeEffectId: null,
  gameModeCurrentModeId: "deadly_assault",
  gameModeCurrentRoomId: "room_1",
  skillProfiles: {},
  showGameModePanel: false,
  dominantTheme: "#AFAFAF",
};

const defaultWEnginesSession: WEnginesSession = {
  activeBuildId: null,
  selectedAgentId: "",
  selectedEngineId: "",
  coreLevel: 0,
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [homeSession, setHomeSessionState] = useState<HomeSession>(() => {
    try {
      const saved = localStorage.getItem("session_home");
      if (!saved) return defaultHomeSession;
      const parsed = JSON.parse(saved);
      if (parsed.teamEffects) {
        Object.keys(parsed.teamEffects).forEach((effectId) => {
          delete parsed.teamEffects[effectId].ownerCurrentStats;
          delete parsed.teamEffects[effectId].ownerInitialStats;
        });
      }
      if (!parsed.slotCalculatorStates) {
        parsed.slotCalculatorStates = defaultHomeSession.slotCalculatorStates;
      }
      for (let i = 0; i < 3; i++) {
        if (!parsed.slotCalculatorStates[i]) {
          parsed.slotCalculatorStates[i] = { ...defaultCalculatorState };
        }
        if (!parsed.slotCalculatorStates[i].fluxedAttributes) {
          parsed.slotCalculatorStates[i].fluxedAttributes = [null, null, null];
        }
      }
      if (!parsed.gameModeCurrentModeId)
        parsed.gameModeCurrentModeId = defaultHomeSession.gameModeCurrentModeId;
      if (!parsed.gameModeCurrentRoomId)
        parsed.gameModeCurrentRoomId = defaultHomeSession.gameModeCurrentRoomId;

      return { ...defaultHomeSession, ...parsed };
    } catch {
      return defaultHomeSession;
    }
  });

  const [wEnginesSession, setWEnginesSessionState] = useState<WEnginesSession>(
    () => {
      try {
        const saved = localStorage.getItem("session_wengines");
        return saved
          ? { ...defaultWEnginesSession, ...JSON.parse(saved) }
          : defaultWEnginesSession;
      } catch {
        return defaultWEnginesSession;
      }
    },
  );

  useEffect(() => {
    const toSave = {
      ...homeSession,
      teamEffects: Object.fromEntries(
        Object.entries(homeSession.teamEffects).map(([id, state]) => {
          return [id, state];
        }),
      ),
    };
    localStorage.setItem("session_home", JSON.stringify(toSave));
  }, [homeSession]);

  useEffect(() => {
    localStorage.setItem("session_wengines", JSON.stringify(wEnginesSession));
  }, [wEnginesSession]);

  const setHomeSession = useCallback(
    (updater: (prev: HomeSession) => HomeSession) => {
      setHomeSessionState(updater);
    },
    [],
  );

  const setWEnginesSession = useCallback(
    (updater: (prev: WEnginesSession) => WEnginesSession) => {
      setWEnginesSessionState(updater);
    },
    [],
  );

  return (
    <SessionContext.Provider
      value={{
        homeSession,
        setHomeSession,
        wEnginesSession,
        setWEnginesSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
