export const SASB_STORAGE_PREFIX = 'carbonx_sasb_fbfr';

export const SASB_FBFR_FIELDS = [
  {
    code: 'FB-FR-130a.1',
    label: 'Total energy consumed (MWh)',
    key: 'energyTotalMwh',
    unit: 'MWh',
  },
  {
    code: 'FB-FR-130a.1',
    label: 'Grid electricity share (%)',
    key: 'energyGridPercent',
    unit: '%',
  },
  {
    code: 'FB-FR-130a.1',
    label: 'Renewable energy share (%)',
    key: 'energyRenewablePercent',
    unit: '%',
  },
  {
    code: 'FB-FR-150a.1',
    label: 'Food waste generated (tonnes)',
    key: 'foodWasteTonnes',
    unit: 'tonnes',
  },
  {
    code: 'FB-FR-150a.1',
    label: 'Food waste diverted from landfill (%)',
    key: 'foodWasteDivertedPercent',
    unit: '%',
  },
  {
    code: 'FB-FR-310a.1',
    label: 'Average hourly wage',
    key: 'avgHourlyWage',
    unit: 'currency/hour',
  },
  {
    code: 'FB-FR-310a.1',
    label: 'Employees at minimum wage (%)',
    key: 'minWageEmployeesPercent',
    unit: '%',
  },
];

export function getCurrentUserStorageKey() {
  const rawUserId = localStorage.getItem('userId') || '';
  const key = rawUserId.includes('/') ? rawUserId.split('/').pop() : rawUserId;
  return String(key || '').trim() || 'guest';
}

export function getSasbStorageKey() {
  return `${SASB_STORAGE_PREFIX}:${getCurrentUserStorageKey()}`;
}

export function loadSasbInputs() {
  try {
    const raw = localStorage.getItem(getSasbStorageKey());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSasbInputs(values) {
  localStorage.setItem(getSasbStorageKey(), JSON.stringify(values || {}));
}

export function buildSasbIndexRows(values = {}) {
  return SASB_FBFR_FIELDS.map((f) => {
    const v = values[f.key];
    const hasValue = v !== null && v !== undefined && String(v).trim() !== '';
    return {
      code: f.code,
      metric: f.label,
      value: hasValue ? `${String(v).trim()} ${f.unit}` : 'Not disclosed',
      status: hasValue ? 'Provided' : 'Missing',
    };
  });
}

