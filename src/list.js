'use strict';


export function create() {
  const head = { prev: null, next: null };
  const tail = { prev: head, next: null };
  head.next = tail;
  return { head, tail };
}


export function remove(node) {
  node.prev.next = node.next;
  node.next.prev = node.prev;
  node.prev = node.next = null;
}


export function insertAfter(dest, node) {
  node.next = dest.next;
  node.prev = dest;
  dest.next.prev = node;
  dest.next = node;
}
