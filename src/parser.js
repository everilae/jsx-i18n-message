'use strict';

import cache from './cache';

const TEXT = Symbol("text");
const INDEX = Symbol("index");
const OPEN_ELEMENT = Symbol("[");
const CLOSE_ELEMENT = Symbol("]");
const OPEN_EXPRESSION = Symbol("{");
const CLOSE_EXPRESSION = Symbol("}");

function next(stream, ofType) {
  const { value: { type, value } } = stream.next();

  if (ofType != null && type !== ofType) {
    throw new Error(`Expected ${String(ofType)}, got ${String(type)}`);
  }

  return value;
}

function* tokenize(format) {
  const matcher = /((?:[^[\]{}\\]|\\.)+)|(\[)(\d+):|(\])|({)|(})/g;

  let match;
  while (match = matcher.exec(format)) {
    const [ , text
            , openElement
            , index
            , closeElement
            , openExpression
            , closeExpression ] = match;

    if (text) {
      yield { type: TEXT, value: text };
    } else if (openElement) {
      yield { type: OPEN_ELEMENT };
      yield { type: INDEX, value: +index };
    } else if (closeElement) {
      yield { type: CLOSE_ELEMENT };
    } else if (openExpression) {
      yield { type: OPEN_EXPRESSION };
    } else if (closeExpression) {
      yield { type: CLOSE_EXPRESSION };
    }
  }
}

function parse(format) {
  const stack = [ { index: 0, children: [] } ];
  const tokenStream = tokenize(format);

  for (const { type, value } of tokenStream) {
    switch (type) {
      case TEXT:
        stack[stack.length - 1].children.push(value);
        break;

      case OPEN_ELEMENT: {
        // INDEX must follow OPEN_ELEMENT
        const index = next(tokenStream, INDEX);
        const node = { index, children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        break;
      }

      case CLOSE_ELEMENT:
        stack.pop();
        break;

      case OPEN_EXPRESSION: {
        const expr = next(tokenStream, TEXT);
        void next(tokenStream, CLOSE_EXPRESSION);
        stack[stack.length - 1].children.push({ expr });
        break;
      }

      default:
        throw new Error(`Invalid token ${String(type)}`);
    }
  }

  if (stack.length !== 1) {
    throw new Error("Unmatched opening and closing elements");
  }

  return stack[0];
}

export default cache.wrap(parse);
