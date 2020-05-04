import RollGroup from '../src/RollGroup';
import NotationError from '../src/exceptions/NotationError';
import RequiredArgumentError from '../src/exceptions/RequiredArgumentErrorError';
import StandardDice from '../src/dice/StandardDice';
import Modifier from '../src/modifiers/Modifier';
import RollResults from '../src/results/RollResults';
import RollResult from '../src/results/RollResult';
import { DropModifier, KeepModifier } from '../src/Modifiers';

describe('RollGroup', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const notation = '{4d10}';
      const rollGroup = new RollGroup(notation);

      expect(rollGroup).toBeInstanceOf(RollGroup);
      expect(rollGroup).toEqual(expect.objectContaining({
        notation,
        expressions: expect.any(Array),
        hasRolls: expect.any(Function),
        modifiers: expect.any(Map),
        output: expect.any(String),
        roll: expect.any(Function),
        rolls: expect.any(Array),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
        total: expect.any(Number),
      }));
    });
  });

  describe('Notation', () => {
    test('can be string', () => {
      const rollGroup = new RollGroup('{5d10+4d7}');

      expect(rollGroup.notation).toBe('{5d10+4d7}');
    });

    test('throws error if invalid type', () => {
      expect(() => {
        new RollGroup([]);
      }).toThrow(NotationError);

      expect(() => {
        new RollGroup({});
      }).toThrow(NotationError);

      expect(() => {
        new RollGroup(['{4d10}']);
      }).toThrow(NotationError);

      expect(() => {
        new RollGroup({ notation: '{4d10}' });
      }).toThrow(NotationError);
    });

    test('is required', () => {
      expect(() => {
        new RollGroup();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new RollGroup(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new RollGroup(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new RollGroup(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('cannot be changed', () => {
      const rollGroup = new RollGroup('{4d10}');

      expect(() => {
        rollGroup.notation = 'Foo';
      }).toThrow(TypeError);
    });
  });

  describe('Expressions', () => {
    let expressions;

    beforeEach(() => {
      expressions = [
        [
          new StandardDice('4d6', 6, 4),
          '+',
          new StandardDice('2d10', 10, 2),
        ],
      ];
    });

    test('can be array', () => {
      const rollGroup = new RollGroup('{5d10}', expressions);

      expect(rollGroup.expressions).toEqual(expressions);
    });

    test('can be an empty array', () => {
      const rollGroup = new RollGroup('{5d10}', []);

      expect(rollGroup.expressions).toEqual([]);
    });

    test('falsey value sets to empty array', () => {
      expect((new RollGroup('{5d10}', false)).expressions).toEqual([]);

      expect((new RollGroup('{5d10}', null)).expressions).toEqual([]);

      expect((new RollGroup('{5d10}', undefined)).expressions).toEqual([]);

      expect((new RollGroup('{5d10}', 0)).expressions).toEqual([]);
    });

    test('throws error if invalid type', () => {
      expect(() => {
        new RollGroup('{4d6}', {});
      }).toThrow(TypeError);

      expect(() => {
        new RollGroup('{4d6}', true);
      }).toThrow(TypeError);

      expect(() => {
        new RollGroup('{4d6}', 300);
      }).toThrow(TypeError);
    });
  });

  describe('Modifiers', () => {
    const modifier = new Modifier('m');

    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(RollGroup.prototype, 'modifiers', 'set');

      new RollGroup('{4d6}', [], [modifier]);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      const modifiers = new Map(Object.entries({ foo: modifier }));
      const rollGroup = new RollGroup('{4d6}', [], modifiers);

      rollGroup.modifiers = modifiers;

      expect(rollGroup.modifiers).toBeInstanceOf(Map);
      expect(rollGroup.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      const modifiers = { foo: modifier };
      const rollGroup = new RollGroup('{4d6}', [], modifiers);

      rollGroup.modifiers = modifiers;

      expect(rollGroup.modifiers).toBeInstanceOf(Map);
      expect(rollGroup.modifiers).toEqual(new Map(Object.entries(modifiers)));
    });

    test('can set modifiers with Array', () => {
      const modifiers = [modifier];
      const rollGroup = new RollGroup('{4d6}', [], modifiers);

      rollGroup.modifiers = modifiers;

      expect(rollGroup.modifiers).toBeInstanceOf(Map);
      expect(rollGroup.modifiers.get('Modifier')).toEqual(modifier);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        new RollGroup('{4d6}', [], 'foo');
      }).toThrow(TypeError);

      expect(() => {
        new RollGroup('{4d6}', [], 351);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = new Map(Object.entries({ foo: 'bar' }));
        new RollGroup('{4d6}', [], modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = { foo: 'bar' };
        new RollGroup('{4d6}', [], modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = ['bar'];
        new RollGroup('{4d6}', [], modifiers);
      }).toThrow(TypeError);
    });

    test('modifiers list always returns in correct order', () => {
      // create modifiers and define their order
      const mod1 = new Modifier('m1');
      mod1.order = 4;
      const mod2 = new Modifier('m2');
      mod2.order = 3;
      const mod3 = new Modifier('m3');
      mod3.order = 1;
      const mod4 = new Modifier('m4');
      mod4.order = 2;

      // create the dice instance
      const rollGroup = new RollGroup('{4d6}', []);

      rollGroup.modifiers = {
        mod1, mod2, mod3, mod4,
      };

      // get the modifier keys
      const modKeys = [...rollGroup.modifiers.keys()];
      // check that the order matches the defined modifier orders
      expect(modKeys[0]).toEqual('mod3');
      expect(modKeys[1]).toEqual('mod4');
      expect(modKeys[2]).toEqual('mod2');
      expect(modKeys[3]).toEqual('mod1');
    });
  });

  describe('Output', () => {
    let diceSpy;
    let expressions;
    let rolls;

    beforeEach(() => {
      rolls = [
        [3, 2, 7, 5],
        [5, 2, 4, 2, 1, 6, 5],
        [3, 5],
      ];

      // need to do `rollOnce` rather than `roll` so that modifiers get applied
      diceSpy = jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(rolls[0][0]))
        .mockImplementationOnce(() => new RollResult(rolls[0][1]))
        .mockImplementationOnce(() => new RollResult(rolls[0][2]))
        .mockImplementationOnce(() => new RollResult(rolls[0][3]))
        .mockImplementationOnce(() => new RollResult(rolls[1][0]))
        .mockImplementationOnce(() => new RollResult(rolls[1][1]))
        .mockImplementationOnce(() => new RollResult(rolls[1][2]))
        .mockImplementationOnce(() => new RollResult(rolls[1][3]))
        .mockImplementationOnce(() => new RollResult(rolls[1][4]))
        .mockImplementationOnce(() => new RollResult(rolls[1][5]))
        .mockImplementationOnce(() => new RollResult(rolls[1][6]))
        .mockImplementationOnce(() => new RollResult(rolls[2][0]))
        .mockImplementationOnce(() => new RollResult(rolls[2][1]));

      expressions = [
        new StandardDice('4d8', 8, 4),
        new StandardDice('(5+2)d6', 6, 7),
        new StandardDice('2d(4+1)', 5, 2),
      ];
    });

    afterEach(() => {
      diceSpy.mockRestore();
    });

    test('returns empty if not rolled', () => {
      const rollGroup = new RollGroup('{4d8}', [[expressions[0]]]);

      expect(rollGroup.output).toEqual('{}');
    });

    test('returns rolls as a string', () => {
      const rollGroup = new RollGroup('{4d8}', [[expressions[0]]]);

      rollGroup.roll();

      expect(rollGroup.output).toEqual('{[3, 2, 7, 5]}');
    });

    test('calls RollResults toString', () => {
      // add modifiers to the dice
      expressions[0].modifiers = [new DropModifier('dl2', 'l', 2)];
      expressions[1].modifiers = [new KeepModifier('kh1', 'h', 1)];

      const rollGroup = new RollGroup('{4d8dl2*(5+7d6kh1)}', [
        [
          expressions[0],
          '*',
          '(',
          5,
          '+',
          expressions[1],
          ')',
        ],
      ]);
      const spy = jest.spyOn(RollResults.prototype, 'toString');

      rollGroup.roll();

      expect(rollGroup.output).toEqual('{[3d, 2d, 7, 5]*(5+[5d, 2d, 4d, 2d, 1d, 6, 5d])}');
      expect(spy).toHaveBeenCalledTimes(2);

      jest.restoreAllMocks();
    });

    test('JSON output is correct with no rolls', () => {
      const rollGroup = new RollGroup('{}');

      rollGroup.roll();

      expect(JSON.parse(JSON.stringify(rollGroup))).toEqual({
        expressions: [],
        modifiers: {},
        notation: '{}',
        output: '{}',
        rolls: [],
        total: 0,
        type: 'group',
      });
    });

    test('JSON output is correct (Single sub-roll)', () => {
      const rollExpressions = [[expressions[0]]];
      const rollGroup = new RollGroup('{4d8}', rollExpressions);

      rollGroup.roll();

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(rollGroup))).toEqual({
        expressions: JSON.parse(JSON.stringify(rollExpressions)),
        modifiers: {},
        notation: '{4d8}',
        output: '{[3, 2, 7, 5]}',
        rolls: [
          JSON.parse(JSON.stringify(new RollResults(rolls[0]))),
        ],
        total: 17,
        type: 'group',
      });
    });

    test('JSON output is correct (Multiple sub-rolls)', () => {
      const rollExpressions = [
        [
          expressions[0],
          '/',
          expressions[1],
        ],
        [
          3,
          '/',
          expressions[2],
        ],
      ];
      const rollGroup = new RollGroup('{4d8/(5+2)d6, 3/2d(4+1)}', rollExpressions);

      rollGroup.roll();

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(rollGroup))).toEqual({
        expressions: JSON.parse(JSON.stringify(rollExpressions)),
        modifiers: {},
        notation: '{4d8/(5+2)d6, 3/2d(4+1)}',
        output: '{[3, 2, 7, 5]/[5, 2, 4, 2, 1, 6, 5], 3/[3, 5]}',
        rolls: JSON.parse(JSON.stringify(new RollResults(rolls).rolls)),
        total: 1.06,
        type: 'group',
      });
    });

    test('String output is correct with no rolls', () => {
      const rollGroup = new RollGroup('{}');

      rollGroup.roll();

      expect(rollGroup.toString()).toEqual('{}');
    });

    test('String output is correct (Single sub-roll)', () => {
      const rollGroup = new RollGroup('{4d8}', [[expressions[0]]]);

      rollGroup.roll();

      expect(rollGroup.toString()).toEqual('{[3, 2, 7, 5]}');
    });

    test('String output is correct (Multiple sub-roll)', () => {
      const rollGroup = new RollGroup('{4d8/(5+2)d6, 3/2d(4+1)}', [
        [
          expressions[0],
          '/',
          expressions[1],
        ],
        [
          3,
          '/',
          expressions[2],
        ],
      ]);

      rollGroup.roll();

      expect(rollGroup.toString()).toEqual('{[3, 2, 7, 5]/[5, 2, 4, 2, 1, 6, 5], 3/[3, 5]}');
    });
  });

  describe('Total', () => {
    test('calls RollResults value', () => {
      const spy = jest.spyOn(RollResults.prototype, 'value', 'get');
      const rollGroup = new RollGroup('{4d8}', [
        [
          new StandardDice('4d8', 8, 4),
        ],
      ]);

      rollGroup.roll();

      // call the total getter
      expect(rollGroup.total).toBeGreaterThanOrEqual(1);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('is equal to total roll values (Single sub-roll)', () => {
      // mock the roll values
      const roll = new RollResults([6, 2, 5, 8]);
      jest.spyOn(StandardDice.prototype, 'roll').mockImplementation(() => roll);

      const rollGroup = new RollGroup('{4d8}', [
        [
          new StandardDice('4d8', 8, 4),
        ],
      ]);

      rollGroup.roll();

      // assert that the total matches
      expect(rollGroup.total).toBe(21);

      jest.restoreAllMocks();
    });

    test('is equal to rolls with equation (Single sub-roll)', () => {
      // mock the roll values
      const roll1 = new RollResults([3, 2, 7, 5]);
      const roll2 = new RollResults([5, 2, 4, 2, 1, 6, 5]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => roll1)
        .mockImplementationOnce(() => roll2);

      const rollGroup = new RollGroup('{4d8/(5+2)d6}', [
        [
          new StandardDice('4d8', 8, 4),
          '/',
          new StandardDice('(5+2)d6', 6, 7),
        ],
      ]);

      rollGroup.roll();

      expect(spy).toHaveBeenCalledTimes(2);

      // assert that the total matches
      expect(rollGroup.total).toBeCloseTo(0.68);

      jest.restoreAllMocks();
    });

    test('is equal to roll values (Multiple sub-rolls)', () => {
      // mock the roll values
      const rolls = [
        new RollResults([6, 2, 5, 8]),
        new RollResults([2, 13]),
      ];
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls[0])
        .mockImplementationOnce(() => rolls[1]);

      const rollGroup = new RollGroup('{4d8, 2d20}', [
        [
          new StandardDice('4d8', 8, 4),
        ],
        [
          new StandardDice('2d20', 20, 2),
        ],
      ]);

      rollGroup.roll();

      // assert that the total matches
      expect(rollGroup.total).toBe(36);

      jest.restoreAllMocks();
    });

    test('is equal to rolls with equation (Multiple sub-rolls)', () => {
      // mock the roll values
      const rolls = [
        new RollResults([3, 2, 7, 5]),
        new RollResults([5, 2, 4, 2, 1, 6, 5]),
        new RollResults([3, 5]),
      ];
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls[0])
        .mockImplementationOnce(() => rolls[1])
        .mockImplementationOnce(() => rolls[2]);

      const rollGroup = new RollGroup('{4d8/(5+2)d6, 3/2d(4+1)}', [
        [
          new StandardDice('4d8', 8, 4),
          '/',
          new StandardDice('(5+2)d6', 6, 7),
        ],
        [
          3,
          '/',
          new StandardDice('2d(4+1)', 5, 2),
        ],
      ]);

      rollGroup.roll();

      expect(spy).toHaveBeenCalledTimes(3);

      // assert that the total matches (actual value is 1.055, but get's rounded to 2 places)
      expect(rollGroup.total).toBeCloseTo(1.06);

      jest.restoreAllMocks();
    });

    // @todo assert can calculate with modifiers on rolls with single sub-roll
    // @todo assert can calculate with modifiers on roll group with single sub-roll
    // @todo assert can calculate with modifiers on rolls with multiple sub-rolls
    // @todo assert can calculate with modifiers on roll group with multiple sub-rolls

    test('returns 0 if no expressions', () => {
      const rollGroup = new RollGroup('{4d8}');

      rollGroup.roll();

      expect(rollGroup.total).toBe(0);
    });

    test('returns 0 if not rolled', () => {
      const rollGroup = new RollGroup('{4d8}', [
        [
          new StandardDice('4d8', 8, 4),
        ],
      ]);

      expect(rollGroup.total).toBe(0);
    });

    test('cannot change value', () => {
      const rollGroup = new RollGroup('{4d8}');

      expect(() => {
        rollGroup.total = 57;
      }).toThrow(TypeError);
    });
  });
});
