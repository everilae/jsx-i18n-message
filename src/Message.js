import React, { Children } from 'react';
import PropTypes from 'prop-types';

import parse from './parser';

function unescapeBackslashes(str) {
  return str.replace(/\\(.)/g, "$1");
}

function mapComponents({ index, children }, components, expressions) {
  return React.cloneElement(
    components[index],
    null,
    ...children.map(child => {
      if (typeof child === "string") {
        return unescapeBackslashes(child);
      } else if (child.expr) {
        return expressions[child.expr];
      } else {
        return mapComponents(child, components, expressions);
      }
    })
  );
}

function Message({ format, component, expressions, children }) {
  return mapComponents(
    parse(format),
    [ component, ...Children.toArray(children) ],
    expressions
  );
}

Message.propTypes = {
  format: PropTypes.string.isRequired,
  component: PropTypes.element.isRequired,
  expressions: PropTypes.object
};

export default Message;
