import * as compose from 'compose-function';
import * as _ from 'lodash';
import { arraySplitBy } from '../util';
import IndentStack from './IndentStack';
import { IToken, TokenType } from './types';

const splitTokensByOuterLineFeeds = (tokens: IToken[]): IToken[][] => {
  let depth = 0;

  return arraySplitBy(
    tokens,
    (token) => {
      switch (token.type) {
        case TokenType.PUNCTUATOR:
          switch (token.value) {
            case 'LeftParen':
            case 'LeftBracket':
              depth += 1;
              break;

            case 'RightParen':
            case 'RightBracket':
              depth -= 1;
              break;
          }
          break
      }

      return depth === 0 &&
        token.type === TokenType.PUNCTUATOR &&
        token.value === 'LineFeed';
    },
  );
};

const isIndent = (token: IToken) => token.type === TokenType.PUNCTUATOR &&
  (token.value === 'Space' || token.value === 'Tab');

const isEmptyLine = (line: IToken[]) => line.every(isIndent);

const getLineIndent = (line: IToken[]) => _.size(_.takeWhile(line, isIndent));

const rejectEmptyLines = (lines: IToken[][]): IToken[][] => (
  lines.filter(line => !isEmptyLine(line))
);

const startsWithListExpression = (line: IToken[]): boolean => {
  const headToken = _.head(line);

  return headToken.type === TokenType.PUNCTUATOR &&
    (headToken.value === 'LeftParen' || headToken.value === 'Apostrophe');
};

const shrinkRedundantIndent = (lines: IToken[][]): IToken[][] => {
  if (_.isEmpty(lines)) {
    return [];
  }
  const minimalDetectedIndent = _.min(
    lines.map(line => getLineIndent(line))
  );
  return lines.map(line => line.slice(minimalDetectedIndent));
};

const createLeftParenToken = (): IToken => {
  return {
    position: { line: 0, column: 0 },
    type: TokenType.PUNCTUATOR,
    value: 'LeftParen',
  };
};

const createRightParenToken = (): IToken => {
  return {
    position: { line: 0, column: 0 },
    type: TokenType.PUNCTUATOR,
    value: 'RightParen',
  };
};

function* generateTimes(times: number, obj: any): IterableIterator<any> {
  for (let j = 0; j < times; j++) {
    yield obj;
  }
}

function* proceedIndents(lines: IToken[][]): IterableIterator<IToken> {
  if (_.isEmpty(lines)) {
    return;
  }

  const indentStack = new IndentStack();

  for (let i = 0; i < lines.length; i++) {
    const thisLine = lines[i];
    const nextLine = lines[i + 1];

    const thisLineIndent = getLineIndent(thisLine);
    const thisLineIndentStackSize = indentStack.proceed(thisLineIndent).size();

    const nextLineIndent = _.isNil(nextLine) ? 0 : getLineIndent(lines[i]);
    const nextLineIndentStackSize = indentStack.proceed(nextLineIndent).size();

    const thisLineWithoutIndent = thisLine.slice(thisLineIndent);

    if (startsWithListExpression(thisLineWithoutIndent)) {
      yield* thisLineWithoutIndent;
      yield* generateTimes(thisLineIndentStackSize - nextLineIndentStackSize, createRightParenToken());
      continue;
    }

    if (nextLineIndentStackSize > thisLineIndentStackSize) {
      yield createLeftParenToken();
      yield* thisLineWithoutIndent;
      continue;
    }

    const wrappedLine = _.size(thisLineWithoutIndent) === 1
      ? thisLineWithoutIndent
      : [
        createLeftParenToken(),
        ...thisLineWithoutIndent,
        createRightParenToken(),
      ];


    if (nextLineIndentStackSize === thisLineIndentStackSize) {
      yield* wrappedLine;
      continue;
    }

    yield* wrappedLine;
    yield* generateTimes(thisLineIndentStackSize - nextLineIndentStackSize, createRightParenToken());
  }
}

export default compose(
  proceedIndents,
  shrinkRedundantIndent,
  rejectEmptyLines,
  splitTokensByOuterLineFeeds,
  _.toArray,
);