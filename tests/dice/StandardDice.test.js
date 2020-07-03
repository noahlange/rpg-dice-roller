import StandardDice from '../../src/dice/StandardDice';
import RollResult from '../../src/results/RollResult';
import RollResults from '../../src/results/RollResults';
import Modifier from '../../src/modifiers/Modifier';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

describe('StandardDice', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(die).toBeInstanceOf(StandardDice);
      expect(die).toEqual(expect.objectContaining({
        notation: '4d6',
        sides: 6,
        qty: 4,
        modifiers: new Map(),
        max: 6,
        min: 1,
        name: 'StandardDice',
        roll: expect.any(Function),
        rollOnce: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new StandardDice();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new StandardDice(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new StandardDice(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new StandardDice(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('constructor requires sides', () => {
      expect(() => {
        new StandardDice('1d6');
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new StandardDice('1d6', false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new StandardDice('1d6', null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new StandardDice('1d6', undefined);
      }).toThrow(RequiredArgumentError);
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      let die = new StandardDice('4d6', 6, 8);
      expect(die.qty).toBe(8);

      expect(() => {
        die = new StandardDice('4d6', 6, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        die = new StandardDice('4d6', 6, false);
      }).toThrow(TypeError);

      expect(() => {
        die = new StandardDice('4d6', 6, true);
      }).toThrow(TypeError);

      expect(() => {
        die = new StandardDice('4d6', 6, []);
      }).toThrow(TypeError);

      expect(() => {
        die = new StandardDice('4d6', 6, { qty: 4 });
      }).toThrow(TypeError);
    });

    test('qty must be positive non-zero', () => {
      let die = new StandardDice('4d6', 6, 1);
      expect(die.qty).toBe(1);

      die = new StandardDice('324d6', 6, 324);
      expect(die.qty).toBe(324);

      expect(() => {
        die = new StandardDice('4d6', 6, 0);
      }).toThrow(TypeError);

      expect(() => {
        die = new StandardDice('4d6', 6, -42);
      }).toThrow(TypeError);

      expect(() => {
        die = new StandardDice('4d6', 6, -1);
      }).toThrow(TypeError);
    });
  });

  describe('Average', () => {
    test('average is correct for single die', () => {
      let die = new StandardDice('d3', 3, 1);
      expect(die.average).toBe(2);

      die = new StandardDice('d10', 10, 1);
      expect(die.average).toBe(5.5);

      die = new StandardDice('d1', 1, 1);
      expect(die.average).toBe(1);

      die = new StandardDice('d20', 20, 1);
      expect(die.average).toBe(10.5);

      die = new StandardDice('d45', 45, 1);
      expect(die.average).toBe(23);
    });

    test('average is unaffected when rolling multiple', () => {
      let die = new StandardDice('2d3', 3, 2);
      expect(die.average).toBe(2);

      die = new StandardDice('400d10', 10, 400);
      expect(die.average).toBe(5.5);

      die = new StandardDice('56d1', 1, 56);
      expect(die.average).toBe(1);

      die = new StandardDice('12d20', 20, 12);
      expect(die.average).toBe(10.5);

      die = new StandardDice('145d45', 45, 145);
      expect(die.average).toBe(23);
    });
  });

  describe('Modifiers', () => {
    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'modifiers', 'set');
      const modifiers = new Map(Object.entries({ foo: new Modifier('m') }));

      new StandardDice('4d6', 6, 8, modifiers);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      const modifiers = new Map(Object.entries({ foo: new Modifier('m') }));
      const die = new StandardDice('4d6', 6, 8);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      const modifier = new Modifier('m');
      const die = new StandardDice('4d6', 6, 8);

      die.modifiers = { foo: modifier };

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('foo')).toEqual(modifier);
    });

    test('can set modifiers with Array', () => {
      const modifiers = [new Modifier('m')];
      const die = new StandardDice('4d6', 6, 8);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('Modifier')).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        new StandardDice('4d6', 6, 8, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        new StandardDice('4d6', 6, 8, 351);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = new Map(Object.entries({ foo: 'bar' }));
        new StandardDice('4d6', 6, 8, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = { foo: 'bar' };
        new StandardDice('4d6', 6, 8, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = ['bar'];
        new StandardDice('4d6', 6, 8, modifiers);
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
      const die = new StandardDice('4d6', 6, 8);

      die.modifiers = {
        mod1, mod2, mod3, mod4,
      };

      // get the modifier keys
      const modKeys = [...die.modifiers.keys()];
      // check that the order matches the defined modifier orders
      expect(modKeys[0]).toEqual('mod3');
      expect(modKeys[1]).toEqual('mod4');
      expect(modKeys[2]).toEqual('mod2');
      expect(modKeys[3]).toEqual('mod1');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const die = new StandardDice('4d6', 6, 4);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(die))).toEqual({
        average: 3.5,
        max: 6,
        min: 1,
        modifiers: { },
        name: 'StandardDice',
        notation: '4d6',
        qty: 4,
        sides: 6,
        type: 'die',
      });
    });

    test('String output is correct', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(die.toString()).toEqual('4d6');
    });
  });

  describe('Rolling', () => {
    test('rollOnce returns a RollResult object', () => {
      expect((new StandardDice('1d6', 6)).rollOnce()).toBeInstanceOf(RollResult);
    });

    test('rollOnce rolls between min and max (Inclusive)', () => {
      const die = new StandardDice('1d6', 6);
      const iterations = 1000;

      // run the test multiple times to try and ensure consistency
      for (let i = 0; i < iterations; ++i) {
        const result = die.rollOnce();

        expect(result.value).toBeGreaterThanOrEqual(1);
        expect(result.value).toBeLessThanOrEqual(6);
      }
    });

    test('roll return a RollResults object', () => {
      expect((new StandardDice('1d6', 6)).roll()).toBeInstanceOf(RollResults);
    });

    test('rollOnce gets called when rolling', () => {
      // create a spy to listen for the Model.rollOnce method to have been triggered
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce');
      const die = new StandardDice('4d6', 6, 4);

      // roll the dice
      die.roll();

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('roll returns correct number of rolls', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(die.roll()).toHaveLength(4);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change max value', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(() => {
        die.max = 450;
      }).toThrow(TypeError);
    });

    test('cannot change min value', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(() => {
        die.min = 450;
      }).toThrow(TypeError);
    });

    test('cannot change name value', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(() => {
        die.name = 'Foo';
      }).toThrow(TypeError);
    });

    test('cannot change notation value', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(() => {
        die.notation = '6d4';
      }).toThrow(TypeError);
    });

    test('cannot change qty value', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(() => {
        die.qty = 6;
      }).toThrow(TypeError);
    });

    test('cannot change sides value', () => {
      const die = new StandardDice('4d6', 6, 4);

      expect(() => {
        die.sides = 2;
      }).toThrow(TypeError);
    });
  });
});
