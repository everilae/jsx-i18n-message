'use strict';

import * as list from "./list";

// Arbitrary constant alert...
const MAX_CACHE_SIZE = 2048;

export default {

  maxSize: MAX_CACHE_SIZE,
  data: new Map(),
  list: list.create(),

  put(key, value) {
    let node = this.data.get(key);
    const { head, tail } = this.list;

    if (!node) {
      node = list.node(key, value);
      this.data.set(key, node);
    } else {
      list.remove(node);
      node.value = value;
    }

    list.insertAfter(head, node);

    if (this.data.size > this.maxSize) {
      this.remove(tail.prev.key);
    }
  },

  get(key) {
    const node = this.data.get(key);

    if (node) {
      const { head } = this.list;

      if (head.next !== node) {
        list.remove(node);
        list.insertAfter(head, node);
      }

      return node.value;
    }
  },

  remove(key) {
    const node = this.data.get(key);

    if (node) {
      list.remove(node);
      this.data.delete(key);
    }

    return !!node;
  },

  clear() {
    this.data.clear();
    this.list = list.create();
  },

  wrap(f) {
    return arg => {
      let value = this.get(arg);

      if (!value) {
        value = f(arg);
        this.put(arg, value);
      }

      return value;
    };
  }

};
