import { FudgeDice, PercentileDice, StandardDice } from '../../src/Dice';
import Parser from '../../src/parser/Parser';
import RollGroup from '../../src/RollGroup';
import parser from '../../src/parser/grammars/grammar';
import DropModifier from '../../src/modifiers/DropModifier';

describe('Parsing', () => {
  describe('Roll groups', () => {
    let dice;

    beforeEach(() => {
      dice = [
        new StandardDice('1d6', 6, 1),
        new StandardDice('1d4', 4, 1),
        new StandardDice('2d10', 10, 2),
      ];
    });

    test('can parse`{1d6}`', () => {
      const notation = '{1d6}';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      expect(parsed[0]).toBeInstanceOf(RollGroup);
      expect(parsed[0]).toEqual(expect.objectContaining({
        expressions: [
          [
            expect.any(StandardDice),
          ],
        ],
        modifiers: new Map(),
        notation,
      }));

      expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining(dice[0]));
    });

    test('can parse `{1d6+1d4}`', () => {
      const notation = '{1d6+1d4}';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      expect(parsed[0]).toBeInstanceOf(RollGroup);
      expect(parsed[0]).toEqual(expect.objectContaining({
        expressions: [
          [
            expect.any(StandardDice),
            '+',
            expect.any(StandardDice),
          ],
        ],
        modifiers: new Map(),
        notation,
      }));

      expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining(dice[0]));
      expect(parsed[0].expressions[0][2]).toEqual(expect.objectContaining(dice[1]));
    });

    test('can parse `{1d6, 1d4}`', () => {
      const notation = '{1d6, 1d4}';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      expect(parsed[0]).toBeInstanceOf(RollGroup);
      expect(parsed[0]).toEqual(expect.objectContaining({
        expressions: [
          [
            expect.any(StandardDice),
          ],
          [
            expect.any(StandardDice),
          ],
        ],
        modifiers: new Map(),
        notation,
      }));

      expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining(dice[0]));
      expect(parsed[0].expressions[1][0]).toEqual(expect.objectContaining(dice[1]));
    });

    test('can parse `{1d6+4, 1d4/2d10}`', () => {
      const notation = '{1d6+4, 1d4/2d10}';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      expect(parsed[0]).toBeInstanceOf(RollGroup);
      expect(parsed[0]).toEqual(expect.objectContaining({
        expressions: [
          [
            expect.any(StandardDice),
            '+',
            4,
          ],
          [
            expect.any(StandardDice),
            '/',
            expect.any(StandardDice),
          ],
        ],
        modifiers: new Map(),
        notation,
      }));

      expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining(dice[0]));
      expect(parsed[0].expressions[1][0]).toEqual(expect.objectContaining(dice[1]));
      expect(parsed[0].expressions[1][2]).toEqual(expect.objectContaining(dice[2]));
    });

    test('can parse `{1}`', () => {
      const notation = '{1}';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      expect(parsed[0]).toBeInstanceOf(RollGroup);
      expect(parsed[0]).toEqual(expect.objectContaining({
        expressions: [
          [
            1,
          ],
        ],
        modifiers: new Map(),
        notation,
      }));
    });

    test('throws error on empty group', () => {
      expect(() => {
        Parser.parse('{}');
      }).toThrow(parser.SyntaxError);
    });

    describe('modifiers', () => {
      describe('Drop', () => {
        test('drop lowest for `{19d23}d1`', () => {
          const notation = '{19d23}d1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(StandardDice),
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '19d23',
            sides: 23,
            qty: 19,
          }));


          expect(parsed[0].modifiers.size).toBe(1);
          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `{19d23, 4d10+3}d1`', () => {
          const notation = '{19d23, 4d10+3}d1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(StandardDice),
              ],
              [
                expect.any(StandardDice),
                '+',
                3,
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '19d23',
            sides: 23,
            qty: 19,
          }));

          expect(parsed[0].expressions[1][0]).toEqual(expect.objectContaining({
            notation: '4d10',
            sides: 10,
            qty: 4,
          }));


          expect(parsed[0].modifiers.size).toBe(1);
          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `{4d10}dl1`', () => {
          const notation = '{4d10}dl1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(StandardDice),
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '4d10',
            sides: 10,
            qty: 4,
          }));

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dl1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `{4d10/4, 2dF.1}dl1`', () => {
          const notation = '{4d10/4, 2dF.1}dl1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(StandardDice),
                '/',
                4,
              ],
              [
                expect.any(FudgeDice),
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '4d10',
            sides: 10,
            qty: 4,
          }));

          expect(parsed[0].expressions[1][0]).toEqual(expect.objectContaining({
            notation: '2dF.1',
            sides: 'F.1',
            qty: 2,
          }));

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dl1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `{7d%}d3`', () => {
          const notation = '{7d%}d3';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(PercentileDice),
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '7d%',
            sides: '%',
            qty: 7,
          }));

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd3',
            end: 'l',
            qty: 3,
          }));
        });

        test('drop lowest for `{7d%, 4*2d6, 7d10-2}d3`', () => {
          const notation = '{7d%, 4*2d6, 7d10-2}d3';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(PercentileDice),
              ],
              [
                4,
                '*',
                expect.any(StandardDice),
              ],
              [
                expect.any(StandardDice),
                '-',
                2,
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '7d%',
            sides: '%',
            qty: 7,
          }));

          expect(parsed[0].expressions[1][2]).toEqual(expect.objectContaining({
            notation: '2d6',
            sides: 6,
            qty: 2,
          }));

          expect(parsed[0].expressions[2][0]).toEqual(expect.objectContaining({
            notation: '7d10',
            sides: 10,
            qty: 7,
          }));

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd3',
            end: 'l',
            qty: 3,
          }));
        });

        test('drop highest for `{4d6}dh2`', () => {
          const notation = '{4d6}dh2';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                expect.any(StandardDice),
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][0]).toEqual(expect.objectContaining({
            notation: '4d6',
            sides: 6,
            qty: 4,
          }));

          expect(parsed[0].modifiers.has('DropModifier-h')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dh2',
            end: 'h',
            qty: 2,
          }));
        });

        test('drop highest for `{3+4d6, 5d2*6d3}dh2`', () => {
          const notation = '{3+4d6, 5d2*6d3}dh2';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(RollGroup);
          expect(parsed[0]).toEqual(expect.objectContaining({
            expressions: [
              [
                3,
                '+',
                expect.any(StandardDice),
              ],
              [
                expect.any(StandardDice),
                '*',
                expect.any(StandardDice),
              ],
            ],
            modifiers: expect.any(Map),
            notation,
          }));

          expect(parsed[0].expressions[0][2]).toEqual(expect.objectContaining({
            notation: '4d6',
            sides: 6,
            qty: 4,
          }));

          expect(parsed[0].expressions[1][0]).toEqual(expect.objectContaining({
            notation: '5d2',
            sides: 2,
            qty: 5,
          }));

          expect(parsed[0].expressions[1][2]).toEqual(expect.objectContaining({
            notation: '6d3',
            sides: 3,
            qty: 6,
          }));

          expect(parsed[0].modifiers.has('DropModifier-h')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dh2',
            end: 'h',
            qty: 2,
          }));
        });

        test('throws error without qty', () => {
          expect(() => {
            Parser.parse('{12dF.1}d');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('{6d6}dl');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('{12dF.1, 4d10}d');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('{6d6, 2d10}dl');
          }).toThrow(parser.SyntaxError);
        });
      });

      /*
      describe('Drop', () => {
        test('drop lowest for `19d23d1`', () => {
          const parsed = Parser.parse('19d23d1');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('19d23');
          expect(parsed[0].sides).toEqual(23);
          expect(parsed[0].qty).toEqual(19);

          expect(parsed[0].modifiers.has('DropModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `4d10dl1`', () => {
          const parsed = Parser.parse('4d10dl1');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('4d10');
          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('DropModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dl1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `7d%d3`', () => {
          const parsed = Parser.parse('7d%d3');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].notation).toEqual('7d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(7);

          expect(parsed[0].modifiers.has('DropModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd3',
            end: 'l',
            qty: 3,
          }));
        });

        test('drop highest for `4d6dh2`', () => {
          const parsed = Parser.parse('4d6dh2');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('4d6');
          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('DropModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dh2',
            end: 'h',
            qty: 2,
          }));
        });

        test('throws error without qty', () => {
          expect(() => {
            Parser.parse('12dF.1d');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('6d6dl');
          }).toThrow(parser.SyntaxError);
        });
      });

      describe('Sorting', () => {
        test('sort ascending for 10d5s', () => {
          const parsed = Parser.parse('10d5s');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('10d5');
          expect(parsed[0].sides).toEqual(5);
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('SortingModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('SortingModifier');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 's',
            direction: 'a',
          }));
        });

        test('sort ascending for 23dF.1sa', () => {
          const parsed = Parser.parse('23dF.1sa');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].notation).toEqual('23dF.1');
          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(23);

          expect(parsed[0].modifiers.has('SortingModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('SortingModifier');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'sa',
            direction: 'a',
          }));
        });

        test('sort descending for 14d%sd', () => {
          const parsed = Parser.parse('14d%sd');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].notation).toEqual('14d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(14);

          expect(parsed[0].modifiers.has('SortingModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('SortingModifier');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'sd',
            direction: 'd',
          }));
        });
      });

      describe('Target', () => {
        describe('Success', () => {
          test('success for `8d45=21`', () => {
            const parsed = Parser.parse('8d45=21');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].notation).toEqual('8d45');
            expect(parsed[0].sides).toEqual(45);
            expect(parsed[0].qty).toEqual(8);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '=21',
              successComparePoint: expect.objectContaining({
                operator: '=',
                value: 21,
              }),
              failureComparePoint: null,
            }));
          });

          test('success for `dF>=0`', () => {
            const parsed = Parser.parse('dF>=0');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].notation).toEqual('dF');
            expect(parsed[0].sides).toEqual('F.2');
            expect(parsed[0].qty).toEqual(1);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '>=0',
              successComparePoint: expect.objectContaining({
                operator: '>=',
                value: 0,
              }),
              failureComparePoint: null,
            }));
          });
        });

        describe('Failure', () => {
          test('failure for `4d%>50f<40`', () => {
            const parsed = Parser.parse('4d%>50f<40');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].notation).toEqual('4d%');
            expect(parsed[0].sides).toEqual('%');
            expect(parsed[0].qty).toEqual(4);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '>50f<40',
              successComparePoint: expect.objectContaining({
                operator: '>',
                value: 50,
              }),
              failureComparePoint: expect.objectContaining({
                operator: '<',
                value: 40,
              }),
            }));
          });

          test('failure for `450dF.1>0f!=1`', () => {
            const parsed = Parser.parse('450dF.1>0f!=1');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].notation).toEqual('450dF.1');
            expect(parsed[0].sides).toEqual('F.1');
            expect(parsed[0].qty).toEqual(450);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '>0f!=1',
              successComparePoint: expect.objectContaining({
                operator: '>',
                value: 0,
              }),
              failureComparePoint: expect.objectContaining({
                operator: '!=',
                value: 1,
              }),
            }));
          });
        });

        test('must proceed success compare point', () => {
          // can't have failure before success
          expect(() => {
            Parser.parse('2d6f<=3>4');
          }).toThrow(parser.SyntaxError);

          // can't have failure without success
          expect(() => {
            Parser.parse('4d7f!=2');
          }).toThrow(parser.SyntaxError);
        });
      });
      */
    });
  });
});
