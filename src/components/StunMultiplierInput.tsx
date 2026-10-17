import React, { useEffect, useRef } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  effects?: Array<{ name: string; value: number }>;
}

const MIN_SLIDER = 0;
const MAX_SLIDER = 200;

const StunMultiplierInput: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  effects = [],
}) => {
  const effectsBonus = effects.reduce((sum, e) => sum + e.value, 0);
  const minValue = Math.max(MIN_SLIDER, effectsBonus);
  const displayValue = Math.max(value, minValue);

  const prevBonusRef = useRef(effectsBonus);
  useEffect(() => {
    const prev = prevBonusRef.current;
    if (effectsBonus === prev) return;
    prevBonusRef.current = effectsBonus;

    const delta = effectsBonus - prev;
    onChange(Math.max(MIN_SLIDER, Math.min(MAX_SLIDER, value + delta)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectsBonus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(minValue, Math.min(MAX_SLIDER, newValue)));
  };

  const increment = () => {
    onChange(Math.min(displayValue + 5, MAX_SLIDER));
  };

  const decrement = () => {
    onChange(Math.max(displayValue - 5, minValue));
  };

  const fillPercent = (displayValue / MAX_SLIDER) * 100;

  const minFillPercent =
    ((minValue - MIN_SLIDER) / (MAX_SLIDER - MIN_SLIDER)) * 100;

  return (
    <div className={`stun-multiplier-main_wrapper ${className}`}>
      <div className="stun-multiplier-header">
        <label className="stun-multiplier-label">Stun DMG Multiplier</label>
        <div className="stun-multiplier-controls">
          <button
            className="stun-multiplier-roller"
            onClick={decrement}
            disabled={disabled || displayValue <= minValue}
          >
            &lt;
          </button>
          <span className="stun-multiplier-indicator">{displayValue}%</span>
          <button
            className="stun-multiplier-roller"
            onClick={increment}
            disabled={disabled || displayValue >= MAX_SLIDER}
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="stun-multiplier-slider-container">
        <input
          type="range"
          value={displayValue}
          onChange={handleChange}
          min={MIN_SLIDER}
          max={MAX_SLIDER}
          step="5"
          className="stun-multiplier-slider"
          style={
            {
              "--fill": `${fillPercent}%`,
            } as React.CSSProperties
          }
        />
      </div>

      <div className="stun-multiplier-slider-labels">
        <span>+{minValue > 0 ? `${minValue}%` : "0%"}</span>
        <span className="stun_multipler-100">+100%</span>
        <span>+{MAX_SLIDER}%</span>
      </div>
    </div>
  );
};

export default StunMultiplierInput;
