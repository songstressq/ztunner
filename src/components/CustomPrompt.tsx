import React, { useState, useEffect, useRef } from "react";

interface CustomPromptProps {
  isOpen: boolean;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "prompt" | "confirm";
  onConfirm: (value?: string) => void;
  onCancel: () => void;
  theme?: string;
}

const CustomPrompt: React.FC<CustomPromptProps> = ({
  isOpen,
  title,
  message,
  defaultValue = "",
  placeholder = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "prompt",
  onConfirm,
  onCancel,
  theme = "#7EFFDB",
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (type === "prompt") {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="custom-prompt-overlay" onClick={onCancel}>
      <div
        className="custom-prompt-wrapper"
        style={
          {
            "--theme": theme,
            border: `2px solid ${theme}`,
          } as React.CSSProperties
        }
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="custom-prompt-header">
          <h3 className="custom-prompt-title" style={{ color: theme }}>
            {title}
          </h3>
          <button onClick={onCancel} className="custom-prompt-close-btn">
            ✕
          </button>
        </div>

        <div className="custom-prompt-body">
          {message && <p className="custom-prompt-message">{message}</p>}
          {type === "prompt" && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="custom-prompt-input"
            />
          )}
        </div>

        <div className="custom-prompt-footer">
          <button
            onClick={onCancel}
            className="custom-prompt-btn custom-prompt-btn-cancel"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="custom-prompt-btn custom-prompt-btn-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPrompt;
