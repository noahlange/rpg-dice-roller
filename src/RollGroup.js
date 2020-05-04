import ComparePoint from './ComparePoint';
import ExplodeModifier from './modifiers/ExplodeModifier';
import Modifier from './modifiers/Modifier';
import ReRollModifier from './modifiers/ReRollModifier';
import RequiredArgumentError from './exceptions/RequiredArgumentErrorError';
import HasExpressionsTrait from './HasExpressionsTrait';
import NotationError from './exceptions/NotationError';

const modifiersSymbol = Symbol('modifiers');
const notationSymbol = Symbol('notation');

class RollGroup extends HasExpressionsTrait {
  /**
   *
   * @param {string} notation
   * @param {[]} expressions
   * @param {Map|{}|Map[]|null=} modifiers
   */
  constructor(notation, expressions, modifiers = null) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    } else if (typeof notation !== 'string') {
      throw new NotationError(notation);
    }

    super(expressions);

    this[notationSymbol] = notation;

    if (modifiers) {
      this.modifiers = modifiers;
    }
  }

  /**
   * The modifiers that affect this group
   *
   * @returns {Map}
   */
  get modifiers() {
    if (this[modifiersSymbol]) {
      // ensure modifiers are ordered correctly
      return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
    }

    return new Map();
  }

  /**
   * Sets the modifiers that affect this group
   *
   * @param value
   */
  set modifiers(value) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new TypeError('modifiers should be a Map, an Array, or an Object');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof Modifier))
    ) {
      throw new TypeError('modifiers must only contain Modifier instances');
    }

    this[modifiersSymbol] = modifiers;

    // loop through each modifier and ensure that those that require it have compare points
    // @todo find a better way of defining compare point on modifiers that don't have them
    this[modifiersSymbol].forEach((modifier) => {
      /* eslint-disable no-param-reassign */
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
  }

  /**
   * The dice notation for this group
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  /**
   * Returns the roll notation and rolls in the format of:
   * {[20,2], [2]}
   *
   * @returns {string}
   */
  get output() {
    return `{${super.output}}`;
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { modifiers, notation } = this;

    return Object.assign(
      super.toJSON(),
      {
        modifiers,
        notation,
        type: 'group',
      },
    );
  }
}

export default RollGroup;
