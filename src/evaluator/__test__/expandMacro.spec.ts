import { get } from 'lodash';
import { parse } from '../../parser';
import expandMacro from '../expandMacro';
import valueOf from '../valueOf';

const expand = (code: string, args: any) => valueOf(expandMacro(get(parse(code), 'body.0'), args));

test('Expand empty body', () => {
  expect(expand('()', {})).toEqual('()');
});

test('Simple expressions', () => {
  expect(expand('a', { a: 10, b: 20 })).toEqual(10);

  expect(expand('(a b)', { a: 10, b: 20 })).toEqual('(10 20)');
});

test('Expand array with spread', () => {
  expect(expand('(a ...b)', { a: 1, b: [2, 3, 4] })).toEqual('(1 ...#[2, 3, 4])');
});

test('Expand compose expression with spread', () => {
  const args = {
    a: 1,
    b: {
      body: [10, 20],
      type: "ListExpression",
    },
  };

  expect(expand('(a ...b)', args)).toEqual('(1 ...(10 20))');
});

test('Expand list expression', () => {
  expect(expand('(a ...(b c))', { a: 1, b: 2, c: 3 })).toEqual('(1 ...(2 3))');

  expect(expand('(a \'(b))', { a: 1, b: 2, c: 3 })).toEqual('(1 \'(b))');

  expect(expand('(a)', {})).toEqual('(a)');
  expect(expand('("Foo Bar")', {})).toEqual('(Foo Bar)');
});
