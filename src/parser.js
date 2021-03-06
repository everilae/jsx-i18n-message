'use strict';

import cache from './cache';

const TEXT = Symbol("text");
const INDEX = Symbol("element.index");
const OPEN_ELEMENT = Symbol("[");
const CLOSE_ELEMENT = Symbol("]");
const OPEN_EXPRESSION = Symbol("{");
const CLOSE_EXPRESSION = Symbol("}");

const ERROR_EOI = "Unexpected end of input while parsing";

function next(stream, ofType) {
  const { value: token, done } = stream.next();

  if (ofType != null && done) {
    throw new Error(ERROR_EOI);
  }

  const { type, meta, value } = token;

  if (ofType != null && type !== ofType) {
    throw new Error(`Unexpected ${String(type)} at column ${meta.index}`);
  }

  return value;
}

function token(type, meta, value) {
  return { type, value, meta };
}

// text = ... ;
// expression = "{" , text , "}" ;
// element = "[" , natural number , ":" , { text | expression | element } , "]" ;
// grammar = { text | expression | element } ;
const MATCHER = [
  String.raw`((?:[^[\]{}\\]|\\.)+)`,  // text (anything but unescaped reserved tokens)
  String.raw`(\[)([1-9]\d*):`,  // open element, followed by index
  String.raw`(\])`,  // close element
  String.raw`({)`,  // open expression
  String.raw`(})`,  // close expression
  String.raw`([[])`  // invalid tokens: lone [ etc.
].join('|');


function* tokenize(format) {
  const matcher = new RegExp(MATCHER, "g");

  let match;
  while (match = matcher.exec(format)) {
    const [ , text
            , openElement
            , index
            , closeElement
            , openExpression
            , closeExpression
            , invalid ] = match;

    const meta = { format,
                   index: match.index,
                   lastIndex: matcher.lastIndex };

    if (text) {
      yield token(TEXT, meta, text);
    }
    else if (openElement) {
      yield token(OPEN_ELEMENT, meta);
      yield token(INDEX, meta, +index);
    }
    else if (closeElement) {
      yield token(CLOSE_ELEMENT, meta);
    }
    else if (openExpression) {
      yield token(OPEN_EXPRESSION, meta);
    }
    else if (closeExpression) {
      yield token(CLOSE_EXPRESSION, meta);
    }
    else if (invalid) {
      throw new Error(`Unexpected '[' at column ${match.index}`);
    }
  }
}

function parse(format) {
  const stack = [ { index: 0, children: [] } ];
  const tokenStream = tokenize(format);

  for (const { type, value, meta } of tokenStream) {
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
        if (!stack.length) {
          throw new Error(`Unexpected ']' at column ${meta.index}`);
        }
        break;

      case OPEN_EXPRESSION: {
        const expr = next(tokenStream, TEXT);
        next(tokenStream, CLOSE_EXPRESSION);
        stack[stack.length - 1].children.push({ expr });
        break;
      }

      default:
        throw new Error(`Unhandled token ${String(type)} at column ${meta.index}`);
    }
  }

  if (stack.length !== 1) {
    throw new Error(ERROR_EOI);
  }

  return stack[0];
}

export default cache.wrap(parse);
