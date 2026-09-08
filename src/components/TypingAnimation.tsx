import React, { useState, useEffect, useCallback } from "react";

interface TypingAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingAnimation = React.memo(
  ({ text, speed = 200, onComplete }: TypingAnimationProps) => {
    const [displayed, setDisplayed] = useState("");
    const [index, setIndex] = useState(0);

    const stableOnComplete = useCallback(() => {
      if (onComplete) onComplete();
    }, [onComplete]);

    useEffect(() => {
      if (index >= text.length) {
        stableOnComplete();
        return;
      }

      const timer = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    }, [index, text, speed, stableOnComplete]);

    return <span>{displayed}</span>;
  },
);

TypingAnimation.displayName = "TypingAnimation";

export default TypingAnimation;
