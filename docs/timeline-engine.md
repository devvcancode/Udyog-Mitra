# Timeline Engine

Phase A establishes `RuleCoreProvider` and a deterministic cold-start estimate. It groups catalog approvals by stage, sums the maximum SLA per parallel stage, adds an illustrative preparation penalty for missing documents and a risk-based scrutiny allowance, then returns a range and reason trace.

The existing `src/lib/registration-data.ts` k-nearest-neighbour registration estimator is a separate UI prototype trained only on synthetic scenarios. Neither model is trained on genuine authority histories. Every estimate must remain labeled illustrative, low-confidence, and not an SLA. Do not use an estimate as a statutory commitment.

Phase C will replace the placeholder with a dependency DAG/critical-path planner, business-day calendar and query pauses, per-document procurement/verification times, seeded Monte Carlo P50/P80/P90, what-if analysis, empirical historical quantiles, and ETA-drift snapshots. Historical training rows must be privacy-reviewed and clearly separated from synthetic seed data.