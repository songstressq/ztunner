import { useState } from "react";

export default function ClampCalculator() {
  const [px, setPx] = useState("");
  const [vw, setVw] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Base de diseño BUILD
  const BASE_WIDTH = 1280; //@media (min-width: 926px) and (max-width: 1366px)
  // const BASE_WIDTH = 1920; //@media (min-width: 1367px)
  // const BASE_WIDTH = 720; //@media (max-width: 925px)  <-- ESTA ES LA BUENA (confirmado)

  // Patrón REAL detectado en tu sistema
  //const MIN_RATIO = 0.694; //@media (min-width: 926px) and (max-width: 1366px) ||| @media (min-width: 1367px)
  //const MIN_RATIO = 0.1; //@media (max-width: 925px)  <-- ESTA ES LA BUENA
  //const MAX_RATIO = 1.389;

  // Base de diseño HOME
  // const BASE_WIDTH = 682; //@media (max-width: 925px)  <-- ESTA ES LA BUENA

  // Patrón REAL detectado en tu sistema
  const MIN_RATIO = 0.45; //@media (min-width: 926px) and (max-width: 1366px) ||| @media (min-width: 1367px)
  //const MIN_RATIO = 0.2; //@media (max-width: 925px)  <-- ESTA ES LA BUENA
  const MAX_RATIO = 1.34;

  const calculateFromPx = () => {
    const pxValue = parseFloat(px);
    if (isNaN(pxValue)) return;
    const vwValue = (pxValue / BASE_WIDTH) * 100;
    const min = pxValue * MIN_RATIO;
    const max = pxValue * MAX_RATIO;
    setVw(vwValue.toFixed(3));
    setResult(
      `clamp(${min.toFixed(2)}px, ${vwValue.toFixed(3)}vw, ${max.toFixed(2)}px);`,
    );
    setCopied(false);
  };

  const calculateFromVw = () => {
    const vwValue = parseFloat(vw);
    if (isNaN(vwValue)) return;
    const pxValue = (vwValue / 100) * BASE_WIDTH;
    const min = pxValue * MIN_RATIO;
    const max = pxValue * MAX_RATIO;
    setPx(pxValue.toFixed(2));
    setResult(
      `clamp(${min.toFixed(2)}px, ${vwValue.toFixed(3)}vw, ${max.toFixed(2)}px);`,
    );
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar: ", err);
    }
  };

  return (
    <div
      style={{
        width: "340px",
        padding: "20px",
        borderRadius: "14px",
        border: "1px solid #d1d5db",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        fontFamily: "sans-serif",
        background: "#fff",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "18px" }}>Clamp Calculator</h3>

      <input
        type="number"
        placeholder="Valor en PX"
        value={px}
        onChange={(e) => setPx(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #aaa",
          outline: "none",
        }}
      />
      <button
        onClick={calculateFromPx}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          background: "#e5e7eb",
        }}
      >
        Calcular desde PX
      </button>

      <input
        type="number"
        placeholder="Valor en VW"
        value={vw}
        onChange={(e) => setVw(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #aaa",
          outline: "none",
        }}
      />
      <button
        onClick={calculateFromVw}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          background: "#e5e7eb",
        }}
      >
        Calcular desde VW
      </button>

      {result && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px",
            borderRadius: "8px",
            background: "#f3f4f6",
            fontFamily: "monospace",
            wordBreak: "break-word",
            lineHeight: 1.5,
          }}
        >
          <span style={{ flex: 1 }}>{result}</span>
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: copied ? "#22c55e" : "#d1d5db",
              color: copied ? "white" : "black",
              fontWeight: "bold",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
