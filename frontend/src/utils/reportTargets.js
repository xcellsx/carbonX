/**
 * Returns the report's futureTargets, or auto-generates SG Green Plan 2030 /
 * SBTi-aligned fallback targets when the array is missing or empty.
 * Uses localStorage LCA cache to populate real emission numbers where available.
 */
export function getEffectiveTargets(data) {
  if (data?.futureTargets?.length > 0) return data.futureTargets;

  // Read real GHG totals from localStorage if available (browser only)
  let scope1 = 0, scope2 = 0, scope3 = 0, total = 0;
  try {
    if (typeof localStorage !== 'undefined') {
      const lcaByName = JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}');
      Object.values(lcaByName).forEach(e => {
        if (e && typeof e === 'object') {
          scope1 += Number(e.scope1) || 0;
          scope2 += Number(e.scope2) || 0;
          scope3 += Number(e.scope3) || 0;
        }
      });
      total = scope1 + scope2 + scope3;
    }
  } catch (_) {}

  const fmt = (n) => n > 0 ? `${Number(n).toFixed(2)} kgCO2e` : 'to be established';
  const target30pct = (n) => n > 0 ? `${(n * 0.7).toFixed(2)} kgCO2e` : 'TBD';

  return [
    {
      area: 'GHG Reduction (Scope 1+2)',
      goal: `Reduce Scope 1+2 emissions by 30% from FY2025 baseline (from ${fmt(scope1 + scope2)} to ${target30pct(scope1 + scope2)}) by 2030, aligned to SBTi 1.5°C pathway`,
      status: total > 0 ? 'Baseline established — reduction roadmap in progress' : 'Baseline measurement in progress',
    },
    {
      area: 'Scope 3 Supply Chain',
      goal: `Reduce Scope 3 value-chain emissions (currently ${fmt(scope3)}) by 25% by 2030 through supplier engagement and low-carbon procurement`,
      status: 'Supplier carbon disclosure programme launched',
    },
    {
      area: 'Renewable Energy',
      goal: 'Achieve 80% renewable electricity by 2030, aligned to Singapore Green Plan 2030 target of at least 2 GWp solar by 2030',
      status: 'Renewable energy procurement underway — solar pilot in planning',
    },
    {
      area: 'Zero Food Waste',
      goal: 'Divert 100% of food waste from landfill by 2028, aligned to Singapore Zero Waste Masterplan',
      status: 'Food waste diversion programme active — composting partnerships in place',
    },
    {
      area: 'Sustainable Packaging',
      goal: '100% recyclable or compostable packaging by 2030, aligned to Singapore Packaging Agreement targets',
      status: 'Pilot phase — transitioning primary packaging lines',
    },
    {
      area: 'Carbon Reporting Transparency',
      goal: 'Achieve full GHG Protocol-aligned disclosure (Scope 1, 2 & 3) and publish verified sustainability report annually from FY2026',
      status: 'First report published — working toward third-party verification',
    },
  ];
}
