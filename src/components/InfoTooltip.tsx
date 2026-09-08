import { useRef, useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import "../styles/InfoTooltip.css";

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

interface TooltipContentProps {
  tooltip: TooltipState;
}

const TooltipContent = ({ tooltip }: TooltipContentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: tooltip.x, y: tooltip.y });
  const [arrowPos, setArrowPos] = useState({
    left: "50%",
    top: "auto",
    bottom: "auto",
    right: "auto",
  });
  const [direction, setDirection] = useState<
    "top" | "bottom" | "left" | "right"
  >("top");

  useEffect(() => {
    if (!ref.current) return;

    const { width, height } = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MARGIN = 10;
    const ARROW_SIZE = 6;

    let x = tooltip.x;
    let y = tooltip.y;
    let newDirection: typeof direction = "top";
    let newArrowPos = {
      left: "50%",
      top: "auto",
      bottom: "auto",
      right: "auto",
    };

    const tryTop = () => {
      const testY = tooltip.y - height - ARROW_SIZE - 4;
      if (testY >= MARGIN) {
        const tooltipX = tooltip.x - width / 2;
        const clampedX = Math.max(
          MARGIN,
          Math.min(tooltipX, vw - width - MARGIN),
        );
        const arrowOffset = tooltip.x - clampedX - width / 2;
        const clampedArrowOffset = Math.max(
          -width / 2 + 15,
          Math.min(arrowOffset, width / 2 - 15),
        );
        newArrowPos = {
          left: `${50 + (clampedArrowOffset / width) * 100}%`,
          top: "auto",
          bottom: `${ARROW_SIZE + 4}px`,
          right: "auto",
        };
        return {
          x: clampedX,
          y: testY,
          direction: "top" as const,
          arrowPos: newArrowPos,
        };
      }
      return null;
    };

    const tryBottom = () => {
      const testY = tooltip.y + 30 + ARROW_SIZE + 4;
      if (testY + height <= vh - MARGIN) {
        const tooltipX = tooltip.x - width / 2;
        const clampedX = Math.max(
          MARGIN,
          Math.min(tooltipX, vw - width - MARGIN),
        );
        const arrowOffset = tooltip.x - clampedX - width / 2;
        const clampedArrowOffset = Math.max(
          -width / 2 + 15,
          Math.min(arrowOffset, width / 2 - 15),
        );
        newArrowPos = {
          left: `${50 + (clampedArrowOffset / width) * 100}%`,
          top: `${ARROW_SIZE + 4}px`,
          bottom: "auto",
          right: "auto",
        };
        return {
          x: clampedX,
          y: testY,
          direction: "bottom" as const,
          arrowPos: newArrowPos,
        };
      }
      return null;
    };

    const tryLeft = () => {
      const testX = tooltip.x - width - ARROW_SIZE - 4;
      if (testX >= MARGIN) {
        const tooltipY = tooltip.y - height / 2;
        const clampedY = Math.max(
          MARGIN,
          Math.min(tooltipY, vh - height - MARGIN),
        );
        const arrowOffset = tooltip.y - clampedY - height / 2;
        const clampedArrowOffset = Math.max(
          -height / 2 + 15,
          Math.min(arrowOffset, height / 2 - 15),
        );
        newArrowPos = {
          left: "auto",
          top: `${50 + (clampedArrowOffset / height) * 100}%`,
          bottom: "auto",
          right: `${ARROW_SIZE + 4}px`,
        };
        return {
          x: testX,
          y: clampedY,
          direction: "left" as const,
          arrowPos: newArrowPos,
        };
      }
      return null;
    };

    const tryRight = () => {
      const testX = tooltip.x + 16 + ARROW_SIZE + 4;
      if (testX + width <= vw - MARGIN) {
        const tooltipY = tooltip.y - height / 2;
        const clampedY = Math.max(
          MARGIN,
          Math.min(tooltipY, vh - height - MARGIN),
        );
        const arrowOffset = tooltip.y - clampedY - height / 2;
        const clampedArrowOffset = Math.max(
          -height / 2 + 15,
          Math.min(arrowOffset, height / 2 - 15),
        );
        newArrowPos = {
          left: `${ARROW_SIZE + 4}px`,
          top: `${50 + (clampedArrowOffset / height) * 100}%`,
          bottom: "auto",
          right: "auto",
        };
        return {
          x: testX,
          y: clampedY,
          direction: "right" as const,
          arrowPos: newArrowPos,
        };
      }
      return null;
    };

    let result = tryTop() || tryBottom() || tryLeft() || tryRight();

    if (!result) {
      const fallbackX = Math.max(
        MARGIN,
        Math.min(tooltip.x - width / 2, vw - width - MARGIN),
      );
      result = {
        x: fallbackX,
        y: MARGIN,
        direction: "top" as const,
        arrowPos: {
          left: "50%",
          top: "auto",
          bottom: `${ARROW_SIZE + 4}px`,
          right: "auto",
        },
      };
    }

    setPos({ x: result.x, y: result.y });
    setDirection(result.direction);
    setArrowPos(result.arrowPos);
  }, [tooltip.x, tooltip.y]);

  const getArrowStyle = () => {
    switch (direction) {
      case "top":
        return {
          bottom: "-6px",
          left: arrowPos.left,
          transform: "translateX(-50%)",
          borderTop: `6px solid #1a1a1a`,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "none",
        };
      case "bottom":
        return {
          top: "-6px",
          left: arrowPos.left,
          transform: "translateX(-50%)",
          borderBottom: `6px solid #1a1a1a`,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "none",
        };
      case "left":
        return {
          right: "-6px",
          top: arrowPos.top,
          transform: "translateY(-50%)",
          borderLeft: `6px solid #1a1a1a`,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderRight: "none",
        };
      case "right":
        return {
          left: "-6px",
          top: arrowPos.top,
          transform: "translateY(-50%)",
          borderRight: `6px solid #1a1a1a`,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderLeft: "none",
        };
      default:
        return {};
    }
  };

  return (
    <div
      ref={ref}
      className="effect-tooltip-portal"
      style={{ left: pos.x, top: pos.y }}
    >
      {tooltip.text}
      <div className="effect-tooltip-arrow" style={getArrowStyle()} />
    </div>
  );
};

interface InfoTooltipProps {
  content: string;
  children?: ReactNode;
  className?: string;
}

export const InfoTooltip = ({
  content,
  children,
  className = "info-icon",
}: InfoTooltipProps) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text: content,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <>
      <div
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children || "i"}
      </div>
      {tooltip &&
        createPortal(<TooltipContent tooltip={tooltip} />, document.body)}
    </>
  );
};
