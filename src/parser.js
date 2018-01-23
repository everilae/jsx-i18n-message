'use strict';

import cache from './cache';

const TEXT = Symbol("text");
const INDEX = Symbol("index");
const OPEN_ELEMENT = Symbol("[");
const CLOSE_ELEMENT = Symbol("]");

function* tokenize(format) {
  const matcher = /((?:[^\[\]\\]|\\.)+)|(\[)(\d+):|(\])/g;

  let match;
  while (match = matcher.exec(format)) {
    const [ , text, openElement, index, closeElement ] = match;

    if (text) {
      yield { type: TEXT, value: text };
    } else if (openElement) {
      yield { type: OPEN_ELEMENT };
      yield { type: INDEX, value: +index };
    } else if (closeElement) {
      yield { type: CLOSE_ELEMENT };
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
        const {
          value: { type: nextType, value: nextValue }
          // Ignore `done`. If the stream ends abruptly the next iteration
          // will catch that.
        } = tokenStream.next();

        if (nextType !== INDEX) {
          throw new Exception("Opening element not followed by index");
        }

        const node = { index: nextValue, children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        break;
      }

      case CLOSE_ELEMENT:
        stack.pop();
        break;

      default:
        throw new Exception(`Invalid token ${type}`);
    }
  }

  if (stack.length !== 1) {
    throw new Exception("Unmatched opening and closing elements");
  }

  return stack[0];
}

export default cache.wrap(parse);
