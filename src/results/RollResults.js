import RollResult from './RollResult';

const rollsSymbol = Symbol('rolls');

class RollResults {
  /**
   * @param {[]=} rolls
   */
  constructor(rolls) {
    this.rolls = rolls || [];
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
    const { rolls, value } = this;

    return {
      rolls,
      value,
    };
  }

  /**
   * Returns the String representation of the object
   *
   * @returns {string}
   */
  toString() {
    return `[${this.rolls.join(', ')}]`;
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
