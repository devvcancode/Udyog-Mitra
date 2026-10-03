export type SlaPrediction = { statutoryDays: number; p50Days: number; p90Days: number; confidence: number; reasonTrace: string[] };

export function coldStartSlaPrediction(statutoryDays: number): SlaPrediction {
  const safeSla = Math.max(0, statutoryDays);
  return { statutoryDays: safeSla, p50Days: Math.round(safeSla * .8), p90Days: Math.ceil(safeSla * 1.3), confidence: .15, reasonTrace: ['l2.sla.synthetic_cold_start_factor'] };
}