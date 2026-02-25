/**
 * Shared DPP & LCA emission helpers.
 * Used by Network page (tooltip) and Inventory page (table LCA and scope breakdown).
 */

function sumScopeKg(scopeObj) {
  if (!scopeObj || typeof scopeObj !== 'object') return 0;
  let total = 0;
  Object.values(scopeObj).forEach((gases) => {
    if (gases && typeof gases === 'object' && !Array.isArray(gases)) {
      Object.values(gases).forEach((vals) => {
        if (vals && typeof vals === 'object' && !Array.isArray(vals)) {
          if (vals.kg != null) total += Number(vals.kg) || 0;
          else if (vals.kgCO2e != null) total += Number(vals.kgCO2e) || 0;
          else total += sumScopeKg(vals);
        } else if (typeof vals === 'number' && !Number.isNaN(vals)) {
          total += vals;
        }
      });
    }
  });
  return total;
}

function sumAllNumbers(obj) {
  if (obj == null) return 0;
  if (typeof obj === 'number' && !Number.isNaN(obj)) return obj;
  if (Array.isArray(obj)) return obj.reduce((s, x) => s + sumAllNumbers(x), 0);
  if (typeof obj === 'object') return Object.values(obj).reduce((s, v) => s + sumAllNumbers(v), 0);
  return 0;
}

export function totalFromDPPScope(scope) {
  if (scope == null) return 0;
  if (typeof scope === 'number' && !Number.isNaN(scope)) return scope;
  if (scope.value !== undefined) return Number(scope.value) || 0;
  if (typeof scope !== 'object') return 0;
  return Object.entries(scope).reduce((sum, [, v]) => {
    const n = typeof v === 'number' ? v : (v?.value ?? 0);
    return sum + (Number(n) || 0);
  }, 0);
}

/**
 * Get scope totals (scope1, scope2, scope3, total) for a product.
 * Prefers DPP.carbonFootprint calculated values; fallback to emissionInformation (getProducts).
 */
export function getScopeTotalsFromProduct(product) {
  const out = { scope1: 0, scope2: 0, scope3: 0, total: 0 };
  if (!product) return out;

  const cf = product.DPP?.carbonFootprint;
  if (cf) {
    out.scope1 = totalFromDPPScope(cf.scope1 ?? cf.Scope1);
    out.scope2 = totalFromDPPScope(cf.scope2 ?? cf.Scope2);
    out.scope3 = totalFromDPPScope(cf.scope3 ?? cf.Scope3);
    out.total = out.scope1 + out.scope2 + out.scope3;
    if (out.total > 0) return out;
  }

  const ei = product.emissionInformation;
  if (!ei || typeof ei !== 'object') return out;
  const s1 = ei.scope1 ?? ei.Scope1;
  const s2 = ei.scope2 ?? ei.Scope2;
  const s3 = ei.scope3 ?? ei.Scope3;
  out.scope1 = sumScopeKg(s1) || sumAllNumbers(s1);
  out.scope2 = sumScopeKg(s2) || sumAllNumbers(s2);
  out.scope3 = sumScopeKg(s3) || sumAllNumbers(s3);
  out.total = out.scope1 + out.scope2 + out.scope3;
  return out;
}

export const EMISSION_DECIMALS = 5;
export function formatEmission(x) {
  return x == null || Number.isNaN(x) ? '—' : Number(x).toFixed(EMISSION_DECIMALS);
}
