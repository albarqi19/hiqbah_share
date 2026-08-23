// Phase S0 station registry — a code registry, not a DB table (DB-backed station
// config is later work; see HIQBAH_ERP_WORKSTATIONS_ARCHITECTURE.txt §3A/Phase S5).
//
// `actions` is intentionally empty for every station in S0. Do not add an entry
// here until a real owning-module service exists to delegate to — stations must
// never own business transitions (architecture doc §12.1).

export const STATION_TYPES = ["ROASTING", "QUALITY", "WAREHOUSE", "PACKAGING", "BAR"] as const;
export type StationType = (typeof STATION_TYPES)[number];

export type QueueSource = {
  model: "roastingBatch";
  statusIn: string[];
};

export type StationConfig = {
  stationType: StationType;
  label: string;
  /** itemType values valid for items claimed/advanced at this station. */
  allowedItemTypes: string[];
  /** null = no backend model exists yet to project a real queue from (S1-S3 work). */
  queueSource: QueueSource | null;
  claimTimeoutMinutes: number;
  /** Always empty in Phase S0 — see module comment above. */
  actions: Record<string, never>;
};

export const STATION_REGISTRY: Record<StationType, StationConfig> = {
  ROASTING: {
    stationType: "ROASTING",
    label: "Roasting Station",
    allowedItemTypes: ["RoastingBatch"],
    // RoastingBatch has no Ready/In-Progress state today — batches are created
    // with output data already attached, so there is nothing real to queue here.
    queueSource: null,
    claimTimeoutMinutes: 60,
    actions: {},
  },
  QUALITY: {
    stationType: "QUALITY",
    label: "Quality Station",
    allowedItemTypes: ["RoastingBatch"],
    queueSource: { model: "roastingBatch", statusIn: ["Pending QC"] },
    claimTimeoutMinutes: 30,
    actions: {},
  },
  WAREHOUSE: {
    stationType: "WAREHOUSE",
    label: "Warehouse Station",
    allowedItemTypes: [],
    // No goods-receipt / pick-stage / inventory-count backend exists yet (S3).
    queueSource: null,
    claimTimeoutMinutes: 30,
    actions: {},
  },
  PACKAGING: {
    stationType: "PACKAGING",
    label: "Packaging Station",
    allowedItemTypes: ["RoastingBatch"],
    queueSource: { model: "roastingBatch", statusIn: ["Passed", "Partially Packaged"] },
    claimTimeoutMinutes: 45,
    actions: {},
  },
  BAR: {
    stationType: "BAR",
    label: "Bar Station",
    allowedItemTypes: [],
    // No café order/ticket model or POS integration exists yet (S1).
    queueSource: null,
    claimTimeoutMinutes: 10,
    actions: {},
  },
};

export function isStationType(value: string): value is StationType {
  return (STATION_TYPES as readonly string[]).includes(value);
}

export function getStationConfig(stationType: string): StationConfig | null {
  return isStationType(stationType) ? STATION_REGISTRY[stationType] : null;
}

export function buildItemRef(itemType: string, itemId: string): string {
  return `${itemType}:${itemId}`;
}

/** Parses `itemType:itemId`, returning null for anything malformed. */
export function parseItemRef(raw: string): { itemType: string; itemId: string } | null {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const idx = decoded.indexOf(":");
  if (idx <= 0 || idx === decoded.length - 1) return null;

  const itemType = decoded.slice(0, idx);
  const itemId = decoded.slice(idx + 1);
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(itemType)) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(itemId)) return null;

  return { itemType, itemId };
}
