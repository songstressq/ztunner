import React from "react";

interface SelectedAgentMini {
  themeColor: string;
}

interface MarqueeProps {
  text: string;
  selectedAgent: SelectedAgentMini;
}

function darkenHex(hex: string, amount = 0.25) {
  if (!hex) return hex;
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))));
  const newHex =
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  return newHex;
}

export default function DiagonalMarquee({ text, selectedAgent }: MarqueeProps) {
  const base = selectedAgent?.themeColor ?? "#a16cd9";
  const darker = darkenHex(base, 0.3);

  return (
    <div
      className="diagonal-marquee"
      aria-hidden="true"
      style={
        {
          "--marquee-color": base,
          "--marquee-bg": darker,
        } as React.CSSProperties
      }
    >
      <div className="container marquee-container">
        <div className="marquee-wrapper">
          <div className="marquee">
            {[
              "one",
              "two",
              "three",
              "four",
              "five",
              "six",
              "seven",
              "eight",
              "nine",
              "ten",
              "eleven",
              "twelve",
              "thirteen",
              "fourteen",
            ].map((cls, i) => (
              <div key={i} className={`marquee__inner ${cls}`}>
                <span>{text}</span>
                <span>{text}</span>
                <span>{text}</span>
                <span>{text}</span>
                <span>{text}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
