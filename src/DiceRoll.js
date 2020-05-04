import { diceUtils, exportFormats } from './utilities/utils';
import Parser from './parser/Parser';
import NotationError from './exceptions/NotationError';
import RequiredArgumentError from './exceptions/RequiredArgumentErrorError';
import DataFormatError from './exceptions/DataFormatError';
import HasExpressionsTrait from './HasExpressionsTrait';

/**
 * The notation
 *
 * @type {symbol}
 *
 * @private
 */
const notationSymbol = Symbol('notation');

class DiceRoll extends HasExpressionsTrait {
  /**
   * Parses the notation and rolls the dice
   *
   * @param notation
   */
  constructor(notation) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    }

    let notationString;
    let rolls = [];

    if (typeof notation === 'string') {
      notationString = notation;
    } else if ((typeof notation === 'object') && !Array.isArray(notation)) {
      // validate object
      // @todo see if we can assert that the notation is valid
      if (!notation.notation) {
        // object doesn't contain a notation property
        throw new RequiredArgumentError('notation');
      }

      if (typeof notation.notation !== 'string') {
        throw new NotationError(notation.notation);
      }

      // store the notation
      notationString = notation.notation;

      // store any defined rolls
      rolls = notation.rolls || [];
    } else {
      throw new NotationError(notation);
    }

    // call the parent constructor to store the expressions and rolls
    super(Parser.parse(notationString), rolls);

    // @todo see if we can assert that the notation is valid
    // store the notation
    this[notationSymbol] = notationString;

    if (!this.hasRolls()) {
      // if no rolls supplied we should roll the dice
      this.roll();
    }
  }

  /** ***********************
   * Static Methods
   ************************ */

  /**
   * Imports the given dice roll data and builds an object from it.
   *
   * Throws Error on failure
   *
   * @param {{}|string|DiceRoll} data The data to import
   *
   * @throws Error
   *
   * @returns {DiceRoll}
   */
  static import(data) {
    if (!data) {
      throw new RequiredArgumentError('data');
    } else if (diceUtils.isJson(data)) {
      // data is JSON format - parse and import
      return DiceRoll.import(JSON.parse(data));
    } else if (diceUtils.isBase64(data)) {
      // data is base64 encoded - decode and import
      return DiceRoll.import(atob(data));
    } else if (typeof data === 'object') {
      // if data is a `DiceRoll` return it, otherwise build it
      return (data instanceof DiceRoll) ? data : new DiceRoll(data);
    } else {
      throw new DataFormatError(data);
    }
  }

  /** ***********************
   * Public Properties
   ************************ */

  /**
   * The dice notation
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol] || '';
  }

  /**
   * Returns the roll notation and rolls in the format of:
   * 2d20+1d6: [20,2]+[2] = 24
   *
   * @returns {string}
   */
  get output() {
    if (!this.hasRolls()) {
      return `${this.notation}: No dice rolled`;
    }

    return `${this.notation}: ${super.output} = ${this.total}`;
  }

  /** ***********************
   * Public methods
   ************************ */

  /**
   * Exports the DiceRoll in the given format.
   * If no format is specified, JSON is returned.
   *
   * @throws Error
   * @param {exportFormats=} format The format to export the data as (ie. JSON, base64)
   * @returns {string|null}
   */
  export(format = exportFormats.JSON) {
    switch (format) {
      case exportFormats.BASE_64:
        // JSON encode then base64, else it exports the string representation of the roll output
        return btoa(this.export(exportFormats.JSON));
      case exportFormats.JSON:
        return JSON.stringify(this);
      case exportFormats.OBJECT:
        return JSON.parse(this.export(exportFormats.JSON));
      default:
        throw new TypeError(`Invalid export format "${format}"`);
    }
  }

  /**
   * Rolls the dice and returns an array of roll results
   *
   * @returns {RollResults|[]}
   */
  roll() {
    return super.roll().rolls || [];
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { notation } = this;

    return Object.assign(
      super.toJSON(),
      {
        notation,
        type: 'dice-roll',
      },
    );
  }
}

export default DiceRoll;
