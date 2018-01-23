'use strict';


// TODO: LRU?
export default {

  size: 0,

  data: {},

  put(key, value) {
    if (!this.data.hasOwnProperty(key)) {
      this.size++;
    }

    this.data[key] = value;
  },

  get(key) {
    return this.data[key];
  },

  remove(key) {
    if (this.data.hasOwnProperty(key)) {
      delete this.data[key];
      this.size--;
    }
  },

  clear() {
    this.data = {};
    this.size = 0;
  }

};
