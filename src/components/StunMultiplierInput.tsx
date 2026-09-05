import React from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  effects?: Array<{ name: string; value: number }>;
}

const StunMultiplierInput: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  effects = [],
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(0, Math.min(250, newValue)));
  };

  const increment = () => {
    const newValue = Math.min(value + 5, 250);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - 5, 0);
    onChange(newValue);
  };

  return (
    <div className={`stun-multiplier-main_wrapper ${className}`}>
      <div className="stun-multiplier-header">
        <label className="stun-multiplier-label">Stun DMG Multiplier</label>
        <div className="stun-multiplier-controls">
          <button
            className="stun-multiplier-roller"
            onClick={decrement}
            disabled={disabled || value <= 0}
          >
            &lt;
          </button>
          <span className="stun-multiplier-indicator">{value}%</span>
          <button
            className="stun-multiplier-roller"
            onClick={increment}
            disabled={disabled || value >= 250}
          >
            &gt;
          </button>
        </div>
      </div>
      <div className="stun-multiplier-slider-container">
        <input
          type="range"
          value={value}
          onChange={handleChange}
          min="0"
          max="200"
          step="5"
          className="stun-multiplier-slider"
        />
      </div>
      <div className="stun-multiplier-slider-labels">
        <span>0%</span>
        <span className="stun_multipler-100">100%</span>
        <span>200%</span>
      </div>
    </div>
  );
};

export default StunMultiplierInput;
