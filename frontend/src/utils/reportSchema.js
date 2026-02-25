/**
 * Report schema validation for AI-generated structured reports.
 * Used to evaluate report-writer accuracy (required keys, non-empty content).
 */

const REQUIRED_KEYS = [
  'reportTitle',
  'reportSummary',
  'productName',
  'boardStatement',
  'companyProfile',
  'sustainabilityApproach',
  'stakeholderEngagement',
  'frameworks',
  'environmentalAnalysis',
  'socialAnalysis',
  'governanceAnalysis',
  'futureTargets',
];

const PLACEHOLDER_PATTERNS = [
  /\b(?:TBD|TODO|Lorem ipsum|\[.*?\]|\.\.\.|placeholder)\b/i,
  /^[\s.\-–—]*$/,
];

/**
 * Check that a string is substantive (not empty, not placeholder-like).
 * @param {*} value
 * @returns {boolean}
 */
function isSubstantive(value) {
  if (value == null) return false;
  const s = typeof value === 'string' ? value.trim() : String(value).trim();
  if (s.length < 3) return false;
  return !PLACEHOLDER_PATTERNS.some((re) => re.test(s));
}

/**
 * Validate array of objects with expected string keys (e.g. environmentalAnalysis).
 * @param {Array} arr
 * @param {string[]} objectKeys
 * @returns {string[]} list of errors
 */
function validateAnalysisArray(arr, objectKeys = ['title', 'keyData', 'strategy', 'performance', 'outlook']) {
  const errs = [];
  if (!Array.isArray(arr) || arr.length === 0) {
    errs.push('Must be a non-empty array');
    return errs;
  }
  arr.forEach((item, i) => {
    if (!item || typeof item !== 'object') {
      errs.push(`Item ${i}: must be an object`);
      return;
    }
    objectKeys.forEach((k) => {
      if (!(k in item) || !isSubstantive(item[k])) {
        errs.push(`Item ${i}: missing or empty "${k}"`);
      }
    });
  });
  return errs;
}

/**
 * Validate report object from generateStructuredReport.
 * @param {Object} data - Parsed report JSON
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateReportSchema(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Report must be a non-empty object'] };
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) {
      errors.push(`Missing required key: ${key}`);
    }
  }

  if (!Array.isArray(data.frameworks) || data.frameworks.length === 0) {
    errors.push('frameworks must be a non-empty array of strings');
  } else {
    data.frameworks.forEach((f, i) => {
      if (!isSubstantive(f)) errors.push(`frameworks[${i}] must be substantive`);
    });
  }

  const analysisKeys = ['title', 'keyData', 'strategy', 'performance', 'outlook'];
  if (data.environmentalAnalysis) {
    validateAnalysisArray(data.environmentalAnalysis, analysisKeys).forEach((e) =>
      errors.push(`environmentalAnalysis: ${e}`)
    );
  }
  if (data.socialAnalysis) {
    validateAnalysisArray(data.socialAnalysis, analysisKeys).forEach((e) =>
      errors.push(`socialAnalysis: ${e}`)
    );
  }
  if (data.governanceAnalysis) {
    validateAnalysisArray(data.governanceAnalysis, analysisKeys).forEach((e) =>
      errors.push(`governanceAnalysis: ${e}`)
    );
  }

  const targetKeys = ['area', 'goal', 'status'];
  if (data.futureTargets) {
    if (!Array.isArray(data.futureTargets) || data.futureTargets.length === 0) {
      errors.push('futureTargets must be a non-empty array');
    } else {
      data.futureTargets.forEach((t, i) => {
        if (!t || typeof t !== 'object') {
          errors.push(`futureTargets[${i}]: must be an object`);
        } else {
          targetKeys.forEach((k) => {
            if (!(k in t) || !isSubstantive(t[k])) {
              errors.push(`futureTargets[${i}]: missing or empty "${k}"`);
            }
          });
        }
      });
    }
  }

  const stringFields = [
    'reportTitle',
    'reportSummary',
    'productName',
    'boardStatement',
    'companyProfile',
    'sustainabilityApproach',
    'stakeholderEngagement',
  ];
  stringFields.forEach((key) => {
    if (key in data && !isSubstantive(data[key])) {
      errors.push(`"${key}" must be substantive (not empty or placeholder)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
