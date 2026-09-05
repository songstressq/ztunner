import { useState, useEffect } from "react";
import enemiesData from "@/data/enemies/enemies.json";
import type { Enemy } from "@/types/Enemy";
import NeonSelect from "@/components/NeonSelect";

interface EnemySelectorProps {
  selectedEnemyId: string;
  onEnemyChange: (enemyId: string) => void;
  defReduction?: number;
  className?: string;
  theme?: string;
}

export default function EnemySelector({
  selectedEnemyId,
  onEnemyChange,
  defReduction = 0,
  className = "",
  theme = "#7EFFDB",
}: EnemySelectorProps) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);

  useEffect(() => {
    setEnemies(enemiesData.enemies);
    if (!selectedEnemyId && enemiesData.enemies.length > 0) {
      const defaultEnemy = enemiesData.enemies[0];
      setSelectedEnemy(defaultEnemy);
      onEnemyChange(defaultEnemy.id);
    }
  }, []);

  useEffect(() => {
    if (!selectedEnemyId) {
      if (enemies.length > 0) {
        const defaultEnemy = enemies[0];
        setSelectedEnemy(defaultEnemy);
        onEnemyChange(defaultEnemy.id);
      }
      return;
    }
    const enemy = enemies.find((e) => e.id === selectedEnemyId);
    setSelectedEnemy(enemy || (enemies.length > 0 ? enemies[0] : null));
  }, [selectedEnemyId, enemies, onEnemyChange]);

  const handleEnemyChange = (enemyId: string) => {
    const enemy = enemies.find((e) => e.id === enemyId);
    if (enemy) {
      setSelectedEnemy(enemy);
      onEnemyChange(enemyId);
    }
  };

  const getEffectiveDefense = () => {
    if (!selectedEnemy || defReduction <= 0)
      return selectedEnemy?.stats.def || 572;
    return selectedEnemy.stats.def * (1 - defReduction);
  };

  const groupedOptions = () => {
    const groups: Record<string, Enemy[]> = {};
    enemies.forEach((enemy) => {
      const type = enemy.enemyType || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(enemy);
    });

    const options: Array<{ value: string; label: string; disabled?: boolean }> =
      [];

    Object.entries(groups).forEach(([groupKey, groupItems]) => {
      options.push({
        value: `__group_${groupKey}`,
        label: groupKey.toUpperCase(),
        disabled: true,
      });
      groupItems.forEach((enemy) => {
        options.push({
          value: enemy.id,
          label: enemy.name,
        });
      });
    });
    return options;
  };

  if (enemies.length === 0) return null;

  const triggerDisplay = selectedEnemy ? selectedEnemy.name : "Select enemy...";

  return (
    <div className={`enemy_selector-main_wrapper ${className}`}>
      <div className="enemy_selector-grid">
        <label className="skill_selector-header">Enemy:</label>
        <NeonSelect
          value={selectedEnemyId || ""}
          options={groupedOptions()}
          onChange={handleEnemyChange}
          theme={theme}
          variant="enemy"
          displayValue={triggerDisplay}
        />
      </div>

      {selectedEnemy ? (
        <div className="skill_selector-description">
          <div className="enemy_selector-content_row">
            <span className="enemy_selector-enemy_name">
              {selectedEnemy.name}
            </span>
          </div>
          <div className="enemy_selector-content_row">
            <span className="enemy_selector-enemy_description">
              {selectedEnemy.description}
            </span>
          </div>
          <div className="enemy_selector-content_row">
            <span>DEF: {selectedEnemy.stats.def.toFixed(0)}</span>
          </div>
          {defReduction > 0 && (
            <div className="enemy_selector-content_row enemy_selector-content_row--shred">
              <span>
                DEF (After {Math.round(defReduction * 100)}% Shred):{" "}
                {getEffectiveDefense().toFixed(0)}
              </span>
            </div>
          )}
          <div className="enemy_selector-content_row enemy_selector-content_row--title">
            <span>Element Resistances</span>
          </div>
          {[
            { key: "Fire", val: selectedEnemy.stats.fireResistance },
            { key: "Ice", val: selectedEnemy.stats.iceResistance },
            { key: "Electric", val: selectedEnemy.stats.electricResistance },
            { key: "Physical", val: selectedEnemy.stats.physicalResistance },
            { key: "Ether", val: selectedEnemy.stats.etherResistance },
            { key: "Wind", val: selectedEnemy.stats.windResistance ?? 0 },
          ].map(({ key, val }) => (
            <div key={key} className="enemy_selector-resistance_row">
              <span>
                <img
                  src={`/resources/images/icons/attributes/${key}.png`}
                  alt={key}
                  className="enemy_selector-element_icon"
                />
                {key}: {(val * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          {selectedEnemy.notes && (
            <div className="enemy_selector-content_row enemy_selector-content_row--notes">
              <span>{selectedEnemy.notes}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="damage_panel-no_active_bonuses">
          <p className="damage_panel-no_effects_found">No enemy selected</p>
          <p className="damage_panel-enable_some_effects">
            Select an enemy from the dropdown above to see its details here.
          </p>
        </div>
      )}
    </div>
  );
}
