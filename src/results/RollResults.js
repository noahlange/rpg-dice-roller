import RollResult from './RollResult';

const modifiersSymbol = Symbol('modifiers');
const rollsSymbol = Symbol('rolls');
const useInTotalSymbol = Symbol('use-in-total');

class RollResults {
  /**
   * @param {[]=} rolls
   * @param {string[]|Set<string>=} modifiers List of modifier names that affect this roll
   * @param {boolean=} useInTotal Whether to include the roll value when calculating totals
   */
  constructor(rolls, modifiers, useInTotal = true) {
    this.modifiers = modifiers || [];
    this.rolls = rolls || [];
    this.useInTotal = useInTotal;
  }

  /**
   * Returns the number of rolls
   *
   * @returns {number}
   */
  get length() {
    return this.rolls.length || 0;
  }

  /**
   * Returns the flags for the modifiers that affect the roll
   *
   * @returns {string}
   */
  get modifierFlags() {
    // @todo need a better way of mapping modifiers to symbols
    return [...this.modifiers].reduce((acc, modifier) => {
      let flag;

      switch (modifier) {
        case 'compound':
        case 'explode':
          flag = '!';
          break;
        case 'critical-failure':
          flag = '__';
          break;
        case 'critical-success':
          flag = '**';
          break;
        case 'drop':
          flag = 'd';
          break;
        case 'penetrate':
          flag = 'p';
          break;
        case 're-roll':
          flag = 'r';
          break;
        case 're-roll-once':
          flag = 'ro';
          break;
        case 'target-failure':
          flag = '_';
          break;
        case 'target-success':
          flag = '*';
          break;
        default:
          flag = modifier;
          break;
      }

      return acc + flag;
    }, '');
  }

  /**
   * Returns the modifiers that affect the roll
   *
   * @returns {Set<string>}
   */
  get modifiers() {
    return this[modifiersSymbol] || new Set();
  }

  /**
   * Set the modifiers that affect the roll
   *
   * @param value
   */
  set modifiers(value) {
    if ((Array.isArray(value) || (value instanceof Set)) && [...value].every((item) => typeof item === 'string')) {
      this[modifiersSymbol] = new Set([...value]);

      return;
    }

    if (!value && (value !== 0)) {
      // clear the modifiers
      this[modifiersSymbol] = new Set();

      return;
    }

    throw new TypeError(`modifiers must be a Set or array of modifier names: ${value}`);
  }

  /**
   * Returns the rolls
   *
   * @returns {RollResult[]}
   */
  get rolls() {
    return [...(this[rollsSymbol] || [])];
  }

  /**
   * Sets the rolls
   *
   * @param {RollResult[]|number[]} rolls
   *
   * @throws Error
   */
  set rolls(rolls) {
    if (!rolls || !Array.isArray(rolls)) {
      // roll is not an array
      throw new TypeError(`rolls must be an array: ${rolls}`);
    }

    // loop through each result and add it to the rolls list
    this[rollsSymbol] = [];
    rolls.forEach((result) => {
      this.addRoll(result);
    });
  }

  /**
   * Returns the useInTotal flag
   *
   * @returns {boolean}
   */
  get useInTotal() {
    return !!this[useInTotalSymbol];
  }

  /**
   * Sets the useInTotal flag
   *
   * @param {boolean} value
   */
  set useInTotal(value) {
    this[useInTotalSymbol] = !!value;
  }

  /**
   * The total value of the rolls, taking in to consideration modifiers
   *
   * @returns {number}
   */
  get value() {
    return this.rolls.reduce((v, roll) => {
      let val = 0;

      if (roll instanceof RollResults) {
        val = roll.value;
      } else if (roll instanceof RollResult) {
        val = (roll.useInTotal ? roll.calculationValue : 0);
      }

      return v + val;
    }, 0);
  }

  /**
   * Adds a single roll to the list
   *
   * @param {RollResults|RollResult|number[]|number} value
   */
  addRoll(value) {
    let val;

    if ((value instanceof RollResults) || (value instanceof RollResult)) {
      // already a valid result object
      val = value;
    } else if (Array.isArray(value)) {
      val = new RollResults(value);
    } else if ((typeof value === 'object') && Array.isArray(value.rolls)) {
      // object with rolls - try to convert to a RollResults object
      val = new RollResults(value.rolls);
    } else {
      // try to convert to a RollResult
      val = new RollResult(value);
    }

    this[rollsSymbol].push(val);
  }

  /**
   * Returns the roll result at the given index,
   * or undefined if index is undefined
   *
   * @param index
   * @returns {RollResult|undefined}
   */
  getRoll(index) {
    return this.rolls[index] || undefined;
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const {
      modifierFlags, modifiers, rolls, useInTotal, value,
    } = this;

    return {
      modifierFlags,
      modifiers: [...modifiers],
      rolls,
      type: 'results',
      useInTotal,
      value,
    };
  }

  /**
   * Returns the String representation of the object
   *
   * @returns {string}
   */
  toString() {
    let output = `[${this.rolls.join(', ')}]`;

    if (this.modifierFlags) {
      output = `(${output})${this.modifierFlags}`;
    }

    return output;
  }

  /**
   * Returns the roll values iterable,
   * allowing the object to be iterated
   *
   * @returns {IterableIterator<RollResult>}
   */
  [Symbol.iterator]() {
    return this.rolls.values();
  }
}

export default RollResults;
