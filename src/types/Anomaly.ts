export type AttributeType =
  | "fire"
  | "ice"
  | "electric"
  | "physical"
  | "ether"
  | "wind";
export type SpecialAttributeType = "frost" | "auricInk" | "honedEdge";

export interface AnomalyDefinition {
  attribute: AttributeType | SpecialAttributeType;
  anomalyType:
    | "burn"
    | "shock"
    | "corruption"
    | "shatter"
    | "assault"
    | "frost"
    | "auricInk"
    | "honedEdge"
    | "windswept";
  baseMultiplier: number;
  procCount?: number;
  parentAttribute?: AttributeType;
  duration: number;
  disorderFormula: {
    baseMultiplier: number;
    perSecondFormula: (timePassed: number) => number;
  };
  vortexFormula?: {
    base: number;
    perSecond?: number;
    perTick?: number;
  };
}

export const ANOMALY_DEFINITIONS: Record<string, AnomalyDefinition> = {
  wind: {
    attribute: "wind",
    anomalyType: "windswept",
    baseMultiplier: 12.5,
    duration: 30,
    disorderFormula: {
      baseMultiplier: 1,
      perSecondFormula: () => 0,
    },
  },
  fire: {
    attribute: "fire",
    anomalyType: "burn",
    baseMultiplier: 0.5,
    procCount: 20,
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining * 2);
        return stacks * 0.5;
      },
    },
    duration: 10,
    vortexFormula: { base: 9.0, perTick: 0.5 },
  },
  electric: {
    attribute: "electric",
    anomalyType: "shock",
    baseMultiplier: 1.25,
    procCount: 10,
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining);
        return stacks * 1.25;
      },
    },
    duration: 10,
    vortexFormula: { base: 6.5, perSecond: 1.25 },
  },
  ether: {
    attribute: "ether",
    anomalyType: "corruption",
    baseMultiplier: 0.625,
    procCount: 20,
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining * 2);
        return stacks * 0.625;
      },
    },
    duration: 10,
    vortexFormula: { base: 6.5, perTick: 0.625 },
  },
  ice: {
    attribute: "ice",
    anomalyType: "shatter",
    baseMultiplier: 5.0,
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining);
        return stacks * 0.075;
      },
    },
    duration: 10,
    vortexFormula: { base: 13.0, perSecond: 0.075 },
  },
  physical: {
    attribute: "physical",
    anomalyType: "assault",
    baseMultiplier: 7.13,
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining);
        return stacks * 0.075;
      },
    },
    duration: 10,
    vortexFormula: { base: 8.0, perSecond: 0.075 },
  },

  frost: {
    attribute: "frost",
    anomalyType: "frost",
    baseMultiplier: 5.0,
    parentAttribute: "ice",
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining);
        return stacks * 0.075;
      },
    },
    duration: 20,
    vortexFormula: { base: 0, perSecond: 0.75 },
  },

  auricInk: {
    attribute: "auricInk",
    anomalyType: "auricInk",
    baseMultiplier: 0.625,
    parentAttribute: "ether",
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining * 2);
        return stacks * 0.625;
      },
    },
    duration: 10,
    vortexFormula: { base: 6.5, perTick: 0.625 },
  },

  honedEdge: {
    attribute: "honedEdge",
    anomalyType: "honedEdge",
    baseMultiplier: 7.13,
    parentAttribute: "physical",
    disorderFormula: {
      baseMultiplier: 4.5,
      perSecondFormula: (timePassed) => {
        const secondsRemaining = 10 - timePassed;
        const stacks = Math.floor(secondsRemaining);
        return stacks * 0.075;
      },
    },
    duration: 10,
    vortexFormula: { base: 8.0, perSecond: 0.075 },
  },
};

export interface AnomalyCalculationResult {
  baseDamage: number;
  withAP: number;
  withBonuses: number;
  realDamage: number;
  disorderDamage?: {
    timePassed: number;
    multiplier: number;
    damage: number;
    realDamage: number;
  };
}
