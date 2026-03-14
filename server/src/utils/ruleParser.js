const { Parser } = require('expr-eval');

const evaluateCondition = (conditionString, inputData) => {
  try {
    if (conditionString.trim().toUpperCase() === 'DEFAULT') {
      return true;
    }

    const parser = new Parser();

    const expr = parser.parse(conditionString);
    const result = expr.evaluate(inputData);

    return Boolean(result);

  } catch (error) {
    console.error(`Rule Evaluation Error for condition "${conditionString}":`, error.message);
    
    return false;
  }
};

module.exports = { evaluateCondition };