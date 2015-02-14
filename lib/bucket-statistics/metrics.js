module.exports = {
  count: function(current, key, obj, meta) {
    current = current || { elements: 0 };
    current.elements++;
    return current;
  },
  arrayLength: function(current, key, obj, meta) {
    current = current || { max: 0, min: 100000000000, avg: 0};
    current.max = Math.max(current.max, obj.entries.length);
    current.min = Math.min(current.min, obj.entries.length);
    return current;
  }
};
