import { useState, useEffect } from "react";
import type { Agent } from "@/types/Agent";
import type { DamageSkill } from "@/types/DamageSkill";
import type { UnifiedStats } from "@/types/Agent";
import type { IngameEffect } from "@/types/IngameEffect";
import { DamageCalculator } from "@/utils/damageCalculator";

import "../styles/DamageCalculator.css";

interface Props {
  agent: Agent;
  unifiedStats: UnifiedStats;
  activeEffects: IngameEffect[];
  className?: string;
}

export default function DamageCalculatorPanel({
  agent,
  unifiedStats,
  activeEffects,
  className,
}: Props) {
  const [skillLevel, setSkillLevel] = useState<number>(11);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [damageResults, setDamageResults] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!agent.skills) return;

    const results = DamageCalculator.calculateAllSkills(
      agent,
      unifiedStats,
      activeEffects,
      skillLevel,
    );

    setDamageResults(results);

    if (!selectedSkill && agent.skills.basicAttacks.length > 0) {
      setSelectedSkill(agent.skills.basicAttacks[0].id);
    }
  }, [agent, unifiedStats, activeEffects, skillLevel]);

  const allSkills = [
    ...(agent.skills?.basicAttacks || []),
    ...(agent.skills?.exSkills || []),
    ...(agent.skills?.ultimate ? [agent.skills.ultimate] : []),
    ...(agent.skills?.chainAttacks || []),
  ];

  const selectedSkillData = allSkills.find(
    (skill) => skill.id === selectedSkill,
  );
  const selectedResult = damageResults[selectedSkill] || null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.round(num).toString();
  };

  return (
    <div className={`damage-calculator ${className}`}>
      <h3 className="DCL001">Damage Calculator</h3>

      {/* Selector de nivel de habilidad */}
      <div className="DCL002">
        <label className="DCL003">Skill Level:</label>
        <div className="DCL004">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(
            (level) => (
              <button
                className="DCL005"
                key={level}
                type="button"
                onClick={() => setSkillLevel(level)}
                style={{
                  backgroundColor: skillLevel === level ? "#7EFFDB" : "#333",
                  color: skillLevel === level ? "#000" : "#aaa",
                }}
              >
                {level}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Selector de habilidad */}
      <div className="DCL006">
        <label className="DCL007">Select Skill:</label>
        <select
          className="DCL008"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
        >
          {allSkills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name} ({skill.skillType})
            </option>
          ))}
        </select>
      </div>

      {/* Resultados de daño */}
      {selectedSkillData && selectedResult && (
        <div className="DCL009">
          <h4 className="DCL010">
            {selectedSkillData.name}
            <span className="DCL011">
              {selectedSkillData.damageType.toUpperCase()}
            </span>
          </h4>

          <p className="DCL012">{selectedSkillData.description}</p>

          {/* Tabla de daños por hit */}
          <div className="DCL013">
            <table className="DCL014">
              <thead>
                <tr className="DCL015">
                  <th className="DCL016">Hit</th>
                  <th className="DCL017">Multiplier</th>
                  <th className="DCL018">Normal DMG</th>
                  <th className="DCL019">Crit DMG</th>
                  <th className="DCL020">Average DMG</th>
                </tr>
              </thead>
              <tbody>
                {selectedSkillData.hits.map((hitName, index) => {
                  const levelData = selectedSkillData.levels.find(
                    (l) => l.level === skillLevel,
                  );
                  const multiplier = levelData?.multipliers[index] || 0;

                  return (
                    <tr className="DCL021" key={index}>
                      <td className="DCL022">{hitName}</td>
                      <td className="DCL023">{multiplier}%</td>
                      <td className="DCL024">
                        {formatNumber(selectedResult.normal[index] || 0)}
                      </td>
                      <td className="DCL025">
                        {formatNumber(selectedResult.critical[index] || 0)}
                      </td>
                      <td className="DCL026">
                        {formatNumber(selectedResult.average[index] || 0)}
                      </td>
                    </tr>
                  );
                })}

                {/* Totales */}
                <tr className="DCL027">
                  <td className="DCL028">Total</td>
                  <td className="DCL029">-</td>
                  <td className="DCL030">
                    {formatNumber(selectedResult.totalNormal)}
                  </td>
                  <td className="DCL031">
                    {formatNumber(selectedResult.totalCritical)}
                  </td>
                  <td className="DCL032">
                    {formatNumber(selectedResult.totalAverage)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Información adicional */}
          <div className="DCL033">
            <div>
              Stat Used: {selectedSkillData.statBase.toUpperCase()} ={" "}
              {Math.round(unifiedStats[selectedSkillData.statBase] || 0)}
            </div>
            <div>Crit Rate: {(unifiedStats.critRate * 100).toFixed(1)}%</div>
            <div>Crit DMG: {(unifiedStats.critDmg * 100).toFixed(1)}%</div>
            <div>
              Element Bonus:{" "}
              {(
                unifiedStats.attributeDmgBonus[selectedSkillData.damageType] *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
