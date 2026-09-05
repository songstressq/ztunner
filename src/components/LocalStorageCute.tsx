import { useState } from "react";
import "../styles/LocalStorageCute.css";

export default function LocalStorageKawaii() {
  const [open, setOpen] = useState(false);
  const [kb, setKb] = useState(0);

  const calc = () => {
    let total = 0;
    for (let k in localStorage) {
      if (!localStorage.hasOwnProperty(k)) continue;
      const v = localStorage.getItem(k) ?? "";
      total += k.length + v.length;
    }
    return (total / 1024).toFixed(2);
  };

  const handleClick = () => {
    setKb(Number(calc()));
    setOpen(true);
  };

  return (
    <>
      <button className="kawaii-storage-btn" onClick={handleClick}>
        LOCAL STORAGE
      </button>

      {open && (
        <div className="kawaii-overlay">
          <div className="kawaii-popup">
            <div className="sparkles">✨ 💕 ✨ 💖 ✨</div>

            <div className="chibi-face">(๑˃ᴗ˂)ﻭ 💾</div>

            <h2>LocalStorage</h2>

            <p>
              Estás usando ㅤ<span className="number">{kb} KB</span> ㅤde
              memoria owo
            </p>

            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${Math.min((kb / 5120) * 100, 100)}%` }}
              />
            </div>

            <small>Máximo típico: 5MB 💕</small>

            <button className="close-btn" onClick={() => setOpen(false)}>
              cerrar
            </button>

            <div className="floating-hearts">💖 💕 💗 💘 💞</div>
          </div>
        </div>
      )}
    </>
  );
}
