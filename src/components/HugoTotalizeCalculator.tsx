import { useState, useEffect } from "react";
import type { DamageSkill } from "@/types/DamageSkill";
import type { UnifiedStats } from "@/types/Agent";

export interface TotalizeState {
  isActive: boolean;
  selectedSkillId: string;
  stunTimeLessThan5: number;
  stunTimeBetween5And15: number;
  totalizeBonus: number;
  totalizeBonusPoints: number;
  finalMultiplier: number;
  baseMultiplier: number;
  mindscape6Active: boolean;
}

interface Props {
  exSkill: DamageSkill | undefined;
  ultimateSkill: DamageSkill | undefined;
  selectedSkillId: string;
  skillLevel: number;
  unifiedStats: UnifiedStats;
  onTotalizeStateChange: (state: TotalizeState) => void;
  disabled?: boolean;
  theme?: string;
  mindscape6Enabled?: boolean;
  initialTotalizeState?: {
    isActive: boolean;
    stunTimeLessThan5: number;
    stunTimeBetween5And15: number;
    mindscape6Active: boolean;
  };
}

const BASE_TOTALIZE_BONUS = 10.0;
const MINDSCAPE_6_BONUS = 10.0;
const BONUS_PER_SECOND_LT5 = 2.8;
const BONUS_PER_SECOND_5_15 = 1.0;
const MAX_TOTAL_BONUS = 34.0;

export default function HugoTotalizeCalculator({
  exSkill,
  ultimateSkill,
  selectedSkillId,
  skillLevel,
  unifiedStats,
  onTotalizeStateChange,
  disabled = false,
  theme = "#8995D6",
  mindscape6Enabled,
  initialTotalizeState,
}: Props) {
  const [isTotalizeActive, setIsTotalizeActive] = useState<boolean>(
    initialTotalizeState?.isActive ?? false,
  );
  const [mindscape6Active, setMindscape6Active] = useState<boolean>(
    initialTotalizeState?.mindscape6Active ?? false,
  );
  const [stunTimeLessThan5, setStunTimeLessThan5] = useState<number>(
    initialTotalizeState?.stunTimeLessThan5 ?? 5,
  );
  const [stunTimeBetween5And15, setStunTimeBetween5And15] = useState<number>(
    initialTotalizeState?.stunTimeBetween5And15 ?? 0,
  );

  useEffect(() => {
    if (disabled) {
      setIsTotalizeActive(false);
      setMindscape6Active(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!mindscape6Enabled) {
      setMindscape6Active(false);
    }
  }, [mindscape6Enabled]);

  const selectedSkill =
    exSkill && exSkill.id === selectedSkillId
      ? exSkill
      : ultimateSkill && ultimateSkill.id === selectedSkillId
        ? ultimateSkill
        : undefined;

  const getBaseMultiplier = (): number => {
    if (
      !selectedSkill ||
      !selectedSkill.levels ||
      selectedSkill.levels.length === 0
    )
      return 0;
    const levelData = selectedSkill.levels.find((l) => l.level === skillLevel);
    if (!levelData) {
      const lastLevel = selectedSkill.levels[selectedSkill.levels.length - 1];
      return lastLevel.multipliers[lastLevel.multipliers.length - 1];
    }
    return levelData.multipliers[levelData.multipliers.length - 1];
  };

  const calculateTotalizeBonus = (): number => {
    if (!isTotalizeActive || disabled) return 0;
    let baseBonus = BASE_TOTALIZE_BONUS;
    baseBonus += stunTimeLessThan5 * BONUS_PER_SECOND_LT5;
    baseBonus += stunTimeBetween5And15 * BONUS_PER_SECOND_5_15;
    baseBonus = Math.min(baseBonus, MAX_TOTAL_BONUS);
    return baseBonus + (mindscape6Active ? MINDSCAPE_6_BONUS : 0);
  };

  useEffect(() => {
    const baseMult = getBaseMultiplier();
    const bonus = calculateTotalizeBonus();
    const bonusPoints = bonus * 100;
    const finalMult = baseMult + bonusPoints;
    onTotalizeStateChange({
      isActive: isTotalizeActive && !disabled,
      selectedSkillId,
      stunTimeLessThan5,
      stunTimeBetween5And15,
      totalizeBonus: bonus,
      totalizeBonusPoints: bonusPoints,
      finalMultiplier: finalMult,
      baseMultiplier: baseMult,
      mindscape6Active,
    });
  }, [
    isTotalizeActive,
    selectedSkillId,
    stunTimeLessThan5,
    stunTimeBetween5And15,
    skillLevel,
    mindscape6Active,
    disabled,
  ]);

  if (!exSkill && !ultimateSkill) return null;

  const baseMultiplier = getBaseMultiplier();
  const totalizeBonus = calculateTotalizeBonus();
  const bonusPoints = totalizeBonus * 100;
  const finalMultiplier = baseMultiplier + bonusPoints;
  const isBonusCapped = totalizeBonus >= MAX_TOTAL_BONUS;
  const isExSkill =
    selectedSkillId === "hugo-ex_special_attack-soul_hunter_punishment";

  const toggleTotalize = () => {
    if (!disabled) setIsTotalizeActive((prev) => !prev);
  };

  const showPlaceholder = disabled || !isTotalizeActive;

  return (
    <div className={`totalize-wrapper ${disabled ? "totalize-disabled" : ""}`}>
      {/* HEADER */}
      <div className="totalize-header">
        <div className="totalize-header-left">
          <img
            src="/ztunner/resources/images/icons/skilltypes/core.png"
            alt="core"
            className="totalize-icon"
          />
          <span className="totalize-title">Hugo's Totalize DMG</span>
        </div>
        <div className="totalize-header-right">
          <span
            className={`totalize-status ${isTotalizeActive ? "active" : "inactive"}`}
          >
            {isTotalizeActive ? "ACTIVE" : "INACTIVE"}
          </span>
          <span className="totalize-agent-tag">Hugo</span>
        </div>
      </div>

      {/* BODY: DOS COLUMNAS */}
      <div className="totalize-body">
        {/* COLUMNA IZQUIERDA: CONTROLES */}
        <div className="totalize-controls">
          {/* Toggle como botón */}
          <button
            className={`totalize-toggle-btn ${isTotalizeActive ? "active" : ""}`}
            onClick={toggleTotalize}
            disabled={disabled}
            style={
              isTotalizeActive
                ? { backgroundColor: theme, borderColor: theme }
                : {}
            }
          >
            {isTotalizeActive ? "Active" : "Inactive"}
          </button>

          {!disabled && isTotalizeActive && isExSkill && mindscape6Enabled && (
            <div className="totalize-mindscape-row">
              <input
                type="checkbox"
                id="ms6-checkbox"
                checked={mindscape6Active}
                onChange={(e) => setMindscape6Active(e.target.checked)}
              />
              <label htmlFor="ms6-checkbox" className="totalize-checkbox-box" />
              <span className="totalize-checkbox-label">
                <span className="highlight-ms6">Mindscape 6</span>: +1000%
              </span>
            </div>
          )}

          {!disabled && isTotalizeActive && (
            <div className="totalize-sliders">
              <div className="totalize-slider-group">
                <div className="totalize-slider-label">
                  <span>Stun ≤5s:</span>
                  <span className="totalize-slider-value">
                    {stunTimeLessThan5.toFixed(1)}s
                  </span>
                  <span className="totalize-slider-bonus">
                    +
                    {(stunTimeLessThan5 * BONUS_PER_SECOND_LT5 * 100).toFixed(
                      0,
                    )}
                    %
                  </span>
                </div>
                <div className="ingame_toggle-stacks_section-range">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={stunTimeLessThan5}
                    onChange={(e) =>
                      setStunTimeLessThan5(parseFloat(e.target.value))
                    }
                    style={{ accentColor: theme }}
                  />
                  <div className="ingame_toggle-stacks_section-number ">
                    <button
                      onClick={() =>
                        setStunTimeLessThan5((p) => Math.max(0, p - 0.1))
                      }
                    >
                      −
                    </button>
                    <span className="totalize-stacks-number">
                      {stunTimeLessThan5.toFixed(1)}
                    </span>
                    <button
                      onClick={() =>
                        setStunTimeLessThan5((p) => Math.min(5, p + 0.1))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="totalize-slider-group">
                <div className="totalize-slider-label">
                  <span>Stun 5‑15s:</span>
                  <span className="totalize-slider-value totalize-fixer">
                    {stunTimeBetween5And15.toFixed(1)}s
                  </span>
                  <span className="totalize-slider-bonus">
                    +
                    {(
                      stunTimeBetween5And15 *
                      BONUS_PER_SECOND_5_15 *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="ingame_toggle-stacks_section-range">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={stunTimeBetween5And15}
                    onChange={(e) =>
                      setStunTimeBetween5And15(parseFloat(e.target.value))
                    }
                    style={{ accentColor: theme }}
                  />
                  <div className="ingame_toggle-stacks_section-number">
                    <button
                      onClick={() =>
                        setStunTimeBetween5And15((p) => Math.max(0, p - 0.1))
                      }
                    >
                      −
                    </button>
                    <span className="totalize-stacks-number">
                      {stunTimeBetween5And15.toFixed(1)}
                    </span>
                    <button
                      onClick={() =>
                        setStunTimeBetween5And15((p) => Math.min(10, p + 0.1))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 👇 Mensaje de ayuda: se muestra cuando disabled O cuando no está activo */}
          {showPlaceholder && (
            <div className="totalize-disabled-notice">
              <span>
                Select Hugo's{" "}
                <span className="disabled-notice-theme">
                  EX Special Attack: Soul Hunter - Punishment
                </span>{" "}
                or{" "}
                <span className="disabled-notice-theme">
                  Ultimate: Blaspheme
                </span>{" "}
                to enable Hugo's Totalize DMG output.
              </span>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: RESULTADOS */}
        <div className="totalize-results">
          {!disabled && isTotalizeActive ? (
            <>
              <div className="totalize-result-card">
                <div className="totalize-result-label">Base Multiplier</div>
                <div className="totalize-result-value">
                  {baseMultiplier.toFixed(1)}%
                </div>
                <div className="totalize-result-sub">Lv.{skillLevel}</div>
              </div>
              <div className="totalize-result-card totalize-bonus-card">
                <div className="totalize-result-label">Totalize Bonus</div>
                <div className="totalize-result-value">
                  +{bonusPoints.toFixed(0)}%
                </div>
              </div>
              <div className="totalize-final-card">
                <div className="totalize-result-label">Final Multiplier</div>
                <div className="totalize-result-value-wrapper">
                  <span className="totalize-result-value">
                    {finalMultiplier.toFixed(1)}%
                  </span>
                  {isBonusCapped && (
                    <span className="totalize-capped-inline">
                      Capped at 3400%
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="totalize-placeholder">
              <p>Totalize is currently disabled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
