import Modifier from './Modifier';

const directionSymbol = Symbol('direction');

class SortingModifier extends Modifier {
  /**
   *
   * @param {string} notation
   * @param {string} direction Either `a|d`
   */
  constructor(notation, direction = 'a') {
    super(notation);

    this.direction = direction || 'a';

    // set the modifier's sort order
    this.order = 8;
  }

  /**
   * Returns the sort direction
   *
   * @returns {string}
   */
  get direction() {
    return this[directionSymbol];
  }

  /**
   * Sets the sort direction
   *
   * @param {string} value
   */
  set direction(value) {
    if ((value !== 'a') && (value !== 'd')) {
      throw new RangeError('Direction must be "a" (Ascending) or "d" (Descending)');
    }

    this[directionSymbol] = value;
  }

  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice|RollGroup} _context
   *
   * @returns {RollResults}
   */
  run(results, _context) {
    const sortedResults = results;

    sortedResults.rolls = results.rolls.sort((a, b) => {
      if (this.direction === 'd') {
        return b.value - a.value;
      }

      return a.value - b.value;
    });

    return sortedResults;
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { direction } = this;

    return Object.assign(
      super.toJSON(),
      {
        direction,
      },
    );
  }
}

export default SortingModifier;
