interface StunEffect {
  name: string;
  value: number;
  source?: string;
  sourceId?: string;
  ownerAgentId?: string;
  ownerDisplayName?: string;
}

interface Props {
  effects: StunEffect[];
  className?: string;
}

export default function StunBonusesPanel({ effects, className = "" }: Props) {
  if (effects.length === 0) return null;

  const bonus = effects.reduce((sum, e) => sum + e.value, 0);

  return (
    <div
      className={`damage_bonuses_panel-main_wrapper stun_bonuses_panel ${className}`}
    >
      <div className="damage_panel-header_container">
        <span className="damage_panel-header_text">Stun DMG Bonuses</span>
        <span className="damage_panel-header_tag">+{bonus.toFixed(1)}%</span>
      </div>

      <div className="damage_panel-item_container stun_margin">
        <div className="damage_panel-item_summary">
          {effects.map((eff, idx) => (
            <div
              key={`${eff.name}-${idx}`}
              className="damage_panel-item_summary-container"
            >
              <div className="damage_panel-item_summary-text">
                <div className="damage_panel-item_summary-grid_area_1">
                  <span>
                    {eff.ownerAgentId ? (
                      <img
                        src={`/resources/images/agents/icons/${eff.ownerAgentId}.png`}
                        alt={eff.ownerDisplayName || eff.ownerAgentId}
                        className="damage_panel-item_summary-icon"
                        title={eff.ownerDisplayName || eff.ownerAgentId}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </span>
                </div>
                <div className="damage_panel-item_summary-grid_area_2">
                  <span>{eff.name}</span>
                </div>
              </div>
              <span className="damage_panel-item_summary-tag">
                +{eff.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
