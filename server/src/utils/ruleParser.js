const { Parser } = require('expr-eval');

/**
 * Custom string helper functions injected as variables into the expression evaluator.
 * Usage in rules: contains(field, "value")  startsWith(field, "prefix")  endsWith(field, "suffix")
 * expr-eval cannot call functions natively, so we pre-process these before eval.
 */
const processStringFunctions = (condition, data) => {
  let processed = condition;

  // THE FIX: Auto-translate standard Javascript syntax into expr-eval syntax
  // This prevents the engine from crashing when you use ===, &&, or ||
  processed = processed.replace(/===/g, '==');
  processed = processed.replace(/!==/g, '!=');
  processed = processed.replace(/&&/g, ' and ');
  processed = processed.replace(/\|\|/g, ' or ');

  // contains(field, "value") → data[field].includes("value")
  processed = processed.replace(
    /contains\((\w+),\s*['"]([^'"]+)['"]\)/g,
    (_, field, value) => {
      const fieldVal = String(data[field] || '').toLowerCase();
      return String(fieldVal.includes(value.toLowerCase()));
    }
  );

  // startsWith(field, "prefix")
  processed = processed.replace(
    /startsWith\((\w+),\s*['"]([^'"]+)['"]\)/g,
    (_, field, value) => {
      const fieldVal = String(data[field] || '').toLowerCase();
      return String(fieldVal.startsWith(value.toLowerCase()));
    }
  );

  // endsWith(field, "suffix")
  processed = processed.replace(
    /endsWith\((\w+),\s*['"]([^'"]+)['"]\)/g,
    (_, field, value) => {
      const fieldVal = String(data[field] || '').toLowerCase();
      return String(fieldVal.endsWith(value.toLowerCase()));
    }
  );

  return processed;
};

const evaluateCondition = (conditionString, inputData) => {
  try {
    const trimmed = conditionString.trim();

    if (trimmed.toUpperCase() === 'DEFAULT' || trimmed === '' || trimmed === 'true') {
      return true;
    }

    // Pre-process string helper functions and operators before passing to expr-eval
    const processed = processStringFunctions(trimmed, inputData);

    const parser = new Parser();
    const expr = parser.parse(processed);
    const result = expr.evaluate(inputData);

    return Boolean(result);

  } catch (error) {
    console.error(`Rule Evaluation Error for condition "${conditionString}":`, error.message);
    return false;
  }
};

module.exports = { evaluateCondition };