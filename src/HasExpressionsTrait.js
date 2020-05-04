import math from 'mathjs-expression-parser';
import { diceUtils } from './utilities/utils';
import RequiredArgumentError from './exceptions/RequiredArgumentErrorError';
import RollResults from './results/RollResults';


/**
 * @type {symbol}
 *
 * @private
 */
const calculateTotalSymbol = Symbol('calculateTotals');

const expressionsSymbol = Symbol('expressions');

/**
 * Used for the recursive output function
 *
 * @type {symbol}
 */
const outputSymbol = Symbol('output');

/**
 * List of rolls
 *
 * @type {symbol}
 *
 * @private
 */
const rollsSymbol = Symbol('rolls');

/**
 * The roll total
 *
 * @type {symbol}
 *
 * @private
 */
const totalSymbol = Symbol('totals');

let rollIndex = 0;

class HasExpressionsTrait {
  /**
   *
   * @param {[]} expressions
   * @param {RollResults|[]|{}} rolls
   */
  constructor(expressions = [], rolls = []) {
    // store the expressions
    this.expressions = expressions || [];

    if (rolls instanceof RollResults) {
      // already a RollResult object
      this[rollsSymbol] = rolls;
    } else if (Array.isArray(rolls)) {
      // array - loop through and build a RollResults object
      this[rollsSymbol] = new RollResults(rolls
        .map((roll) => {
          if (roll instanceof RollResults) {
            // already a RollResults object
            return roll;
          }

          if (Array.isArray(roll)) {
            // array of values
            return new RollResults(roll);
          }

          if ((typeof roll === 'object') && Array.isArray(roll.rolls)) {
            // object with list of rolls
            return new RollResults(roll.rolls);
          }

          return null;
        })
        .filter(Boolean));
    } else if ((typeof rolls === 'object') && Array.isArray(rolls.rolls)) {
      // object - try casting to a RollResult objects
      this[rollsSymbol] = new RollResults(rolls.rolls);
    } else {
      throw new TypeError(`Rolls must be an Array or RollResults object: ${rolls}`);
    }
  }


  /** ***********************
   * Public Properties
   ************************ */

  /**
   * The expressions in this group
   *
   * @returns {[]}
   */
  get expressions() {
    return [...(this[expressionsSymbol] || [])];
  }

  /**
   * Sets the expressions
   *
   * @param {[]} expressions
   */
  set expressions(expressions) {
    if (!expressions) {
      throw new RequiredArgumentError('expressions');
    }

    if (!Array.isArray(expressions)) {
      throw new TypeError(`expressions must be an array: ${expressions}`);
    }

    // add the expressions to the list
    this[expressionsSymbol] = [...expressions];
  }

  /**
   * Returns the roll notation and rolls in the format of:
   * [20,2]+[2]
   *
   * @returns {string}
   */
  get output() {
    if (!this.hasRolls()) {
      return '';
    }

    return this[outputSymbol](this.expressions);
  }

  /**
   * The dice rolled for the notation
   *
   * @returns {[]}
   */
  get rolls() {
    return this[rollsSymbol] ? [...this[rollsSymbol]] : [];
  }

  /**
   * Returns the roll total
   *
   * @returns {number}
   */
  get total() {
    // only calculate the total if it has not already been done
    if (!this[totalSymbol] && this.hasRolls()) {
      this[totalSymbol] = this[calculateTotalSymbol](this.expressions);
    }

    // return the total
    return this[totalSymbol] || 0;
  }


  /** ***********************
   * Public methods
   ************************ */

  /**
   * Returns whether the object has rolled dice or not
   *
   * @returns {boolean}
   */
  hasRolls() {
    return (this.expressions.length > 0) && (this.rolls.length > 0);
  }

  /**
   * Rolls the expressions
   *
   * @returns {RollResults|[]}
   */
  roll() {
    // reset the cached total
    this[totalSymbol] = 0;

    // loop through each expression and roll it
    const rolls = this.expressions.flat().map((expression) => {
      if ((typeof expression === 'object') && (typeof expression.roll === 'function')) {
        // roll the object and return the value
        return expression.roll();
      }

      return null;
    }).filter(Boolean);

    if (Array.isArray(this.modifiers) && (this.modifiers.length > 0)) {
      // loop through each modifier and carry out its actions
      (this.modifiers || []).forEach((modifier) => {
        modifier.run(rolls, this);
      });
    }

    // create a new result object to hold the rolls
    this[rollsSymbol] = new RollResults(rolls);

    return this[rollsSymbol];
  }

  toJSON() {
    const {
      expressions, output, rolls, total,
    } = this;

    return {
      expressions,
      output,
      rolls,
      total,
      type: 'expressions',
    };
  }

  /**
   * Returns the String representation
   * of the object as the roll notation
   *
   * @returns {string}
   */
  toString() {
    return this.output;
  }


  /** ***********************
   * Private Methods
   ************************ */

  /**
   * Calculates the total roll value and returns it
   *
   * @returns {Number}
   */
  [calculateTotalSymbol](expressions, resetIndex = true) {
    if (!this.hasRolls()) {
      return 0;
    }

    if (resetIndex) {
      rollIndex = 0;
    }

    // loop through each roll and calculate the totals
    const formula = expressions.reduce((accumulator, expression, i) => {
      const isObject = typeof expression === 'object';
      let output = expression;


      if (Array.isArray(expression)) {
        // expression is an array - must be roll group with sub-rolls
        // recursively call the total method on the sub-rolls
        output = `(${this[calculateTotalSymbol](expression, false)})`;

        // if this isn;t the last sub-roll, add a separating comma
        if (i < expressions.length - 1) {
          output += '+';
        }
      } else if (isObject && ('total' in expression)) {
        // expression has it's own total (e.g. a RollGroup), use it instead of the roll values
        output = expression.total;

        // increment the roll index
        rollIndex += 1;
      } else if (isObject && (typeof expression.roll === 'function')) {
        // this is a rollable object (e.g. a dice)
        // get the roll value for the dice / roll group
        const roll = this.rolls[rollIndex];

        // increment the roll index
        rollIndex += 1;

        // @todo should roll results be stored on their relevant parsed object?
        // get the value of the object
        output = roll ? roll.value : 0;
      }

      return accumulator + output;
    }, '');

    // evaluate the formula and round it to max 2 decimal places
    return diceUtils.toFixed(math.eval(formula), 2);
  }

  /**
   * Builds the outut for the object
   *
   * @param {[]} expressions
   * @param {boolean=} resetIndex
   *
   * @returns {string}
   */
  [outputSymbol](expressions, resetIndex = true) {
    if (resetIndex) {
      rollIndex = 0;
    }

    return expressions
      .map((expression, i) => {
        const isObject = typeof expression === 'object';

        if (Array.isArray(expression)) {
          // expression is an array - must be roll group with sub-rolls
          // recursively call the output method on the sub-rolls
          let output = this[outputSymbol](expression, false);

          // if this isn;t the last sub-roll, add a separating comma
          if (i < expressions.length - 1) {
            output += ', ';
          }

          return output;
        }

        if (isObject && ('output' in expression)) {
          // expression has it's own output property
          // increment the roll index
          rollIndex += 1;

          return expression.output;
        }

        if (isObject && (typeof expression.roll === 'function')) {
          // expression is rollable, which means it should have rolls
          const rollResults = this.rolls[rollIndex] || null;

          // increment the roll index
          rollIndex += 1;

          return rollResults;
        }

        return expression;
      })
      // remove any empty values
      .filter(Boolean)
      // join into a single string
      .join('');
  }
}

export default HasExpressionsTrait;
