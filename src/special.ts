import { chunk, first, includes, last, tail } from 'lodash';
import Env from './Env';
import { isLMSymbol, Lambda, Macro } from './types/';
import { isList } from "./util";

export const OP_ADD = '+';
export const OP_MUL = '*';
export const OP_SUB = '-';
export const OP_DIV = '/';
export const OP_MOD = 'mod';

export const OP_EQ = 'eq?';
export const OP_NE = 'ne?';
export const OP_GT = 'gt?';
export const OP_LT = 'lt?';
export const OP_GTE = 'gte?';
export const OP_LTE = 'lte?';
export const OP_NOT = 'not';

export const ST_DEF = 'def';
export const LAMBDA = 'lambda';
export const MACRO = 'macro';
export const QUOTE = 'quote';
export const EVAL = 'eval';
export const EVAL_IN = 'eval-in';
export const COND = 'cond';

export const EXP_LIST = 'list';
export const EXP_NEW = 'new';

export const specialForms = [
  OP_ADD,
  OP_MUL,
  OP_SUB,
  OP_DIV,
  OP_MOD,

  OP_EQ,
  OP_NE,
  OP_GT,
  OP_LT,
  OP_GTE,
  OP_LTE,
  OP_NOT,

  ST_DEF,
  LAMBDA,
  MACRO,
  QUOTE,
  EVAL,
  EVAL_IN,
  COND,

  EXP_LIST,
  EXP_NEW,
];


export const isSpecialForm = (op: string): boolean => (
  includes(specialForms, op)
);

export const reduceArguments = (
  op: (arg1: any, arg2: any) => any,
  args: any[],
  evalExpression: (expression: any, env: Env) => any,
  env: Env,
) => (
  args
    .slice(1)
    .reduce((arg, item) => op(arg, evalExpression(item, env)), evalExpression(first(args), env))
);

export const callSpecialForm = (
  op: string,
  args: any[],
  evalExpression: (expression: any, env: Env) => any,
  env: Env,
): any => {
  switch (op) {
    /* Math operators */
    case OP_ADD:
      return reduceArguments((arg1, arg2) => arg1 + arg2, args, evalExpression, env);

    case OP_MUL:
      return reduceArguments((arg1, arg2) => arg1 * arg2, args, evalExpression, env);

    case OP_SUB:
      return reduceArguments((arg1, arg2) => arg1 - arg2, args, evalExpression, env);

    case OP_DIV:
      return reduceArguments((arg1, arg2) => arg1 / arg2, args, evalExpression, env);

    case OP_MOD:
      return reduceArguments((arg1, arg2) => arg1 % arg2, args, evalExpression, env);

    case OP_EQ:
      return reduceArguments((arg1, arg2) => arg1 === arg2, args, evalExpression, env);

    case OP_NE:
      return reduceArguments((arg1, arg2) => arg1 !== arg2, args, evalExpression, env);

    case OP_GT:
      return reduceArguments((arg1, arg2) => arg1 > arg2, args, evalExpression, env);

    case OP_LT:
      return reduceArguments((arg1, arg2) => arg1 < arg2, args, evalExpression, env);

    case OP_GTE:
      return reduceArguments((arg1, arg2) => arg1 >= arg2, args, evalExpression, env);

    case OP_LTE:
      return reduceArguments((arg1, arg2) => arg1 <= arg2, args, evalExpression, env);

    case OP_NOT:
      return !evalExpression(first(args), env);

    /* Language special forms */
    case ST_DEF: {
      const pairs = chunk(args, 2);
      if (!pairs.every(([name]) => isLMSymbol(name))) {
        throw new Error('Could not use non-LMSymbol for binding');
      }
      return pairs.forEach(
        ([name, value]) => env.bind(name.value, evalExpression(value, env)),
      );
    }

    case LAMBDA: {
      const [lambdaArgs, ...lambdaBody] = args;
      if (!lambdaArgs.every(arg => isLMSymbol(arg))) {
        throw new Error('Could not use non-LMSymbol as Lambda argument name');
      }
      return new Lambda(lambdaArgs.map(({ value }) => value), lambdaBody, env);
    }

    case MACRO: {
      const [macroArgs, ...macroBody] = args;

      if (isList(macroArgs)) {
        if (!macroArgs.every(arg => isLMSymbol(arg))) {
          throw new Error('Could not use non-LMSymbol as Macro argument name');
        }

        return new Macro(macroArgs, macroBody);
      }

      if (!isLMSymbol(macroArgs)) {
        throw new Error('Could not use non-LMSymbol as Macro argument name');
      }

      return new Macro(macroArgs, macroBody);
    }

    case QUOTE:
      return first(args);

    case EVAL:
      return evalExpression(first(args), env);

    case EVAL_IN: {
      const lambda = evalExpression(first(args), env);
      if (!(lambda instanceof Lambda)) {
        throw new Error(`First argument must be lambda`);
      }
      return evalExpression(args[1], lambda.env);
    }

    case COND: {
      for (const pair of args) {
        if (pair.length === 1) {
          return evalExpression(first(pair), env);
        }
        if (pair.length === 0) {
          continue;
        }
        if (evalExpression(first(pair), env)) {
          return evalExpression(last(pair), env);
        }
      }
      return undefined;
    }

    case EXP_LIST:
      return args.map(arg => evalExpression(arg, env));

    case EXP_NEW: {
      const evaluatedArgs = args.map(arg => evalExpression(arg, env));
      const Obj = first(evaluatedArgs);
      return new Obj(...tail(evaluatedArgs));
    }

    default:
      throw new Error(`Unknown special form - ${op}`);
  }
};
